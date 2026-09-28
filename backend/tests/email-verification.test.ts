import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import type { User } from "../src/generated/db/client.js";

// Stub SMTP before importing the service; no database or real e-mail is used.
test("registration, confirmation, resend and login respect email verification", async t => {
  process.env.DATABASE_URL ??= "postgresql://unused:unused@localhost:5432/unused";
  process.env.SMTP_HOST = "smtp.test.invalid";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_USER = "sender@test.invalid";
  process.env.SMTP_PASS = "test-only";
  process.env.APP_URL = "http://localhost:5173";
  let mail = "";
  let failMail = false;
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async (options: { text: string }) => {
    if (failMail) throw new Error("Sensitive SMTP error");
    mail = options.text;
  } }));
  const { authService, hashToken } = await import("../src/services/auth.service.js");
  const { userRepository } = await import("../src/repositories/user.repository.js");
  const { sessionRepository } = await import("../src/repositories/session.repository.js");
  let user: User = {
    id: "test", name: "Teste", email: "test@test.invalid", cpf: null, phone: null,
    birthDate: null, role: "USER", blockedAt: null, lastLoginAt: null,
    passwordHash: "", emailVerified: false, verificationTokenHash: null,
    verificationExpiresAt: null, termsAcceptedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
  };
  t.mock.method(userRepository, "findConflicts", async () => []);
  t.mock.method(userRepository, "create", async (data: Partial<User>) => (user = { ...user, ...data }));
  t.mock.method(userRepository, "findByEmail", async (email: string) => email === user.email ? user : null);
  t.mock.method(userRepository, "findByVerificationHash", async (hash: string) => hash === user.verificationTokenHash ? { ...user } : null);
  t.mock.method(userRepository, "confirmEmail", async (_id: string, hash: string) => {
    if (user.verificationTokenHash !== hash || user.emailVerified) return { count: 0 };
    user = { ...user, emailVerified: true, verificationTokenHash: null, verificationExpiresAt: null };
    return { count: 1 };
  });
  t.mock.method(userRepository, "renewVerification", async (_id: string, hash: string, expires: Date) => {
    user = { ...user, verificationTokenHash: hash, verificationExpiresAt: expires };
    return { count: 1 };
  });
  t.mock.method(userRepository, "update", async () => user);
  t.mock.method(sessionRepository, "deleteExpired", async () => ({ count: 0 }));
  let sessions = 0;
  t.mock.method(sessionRepository, "create", async () => { sessions++; });
  const input = { name: "Teste", email: user.email, password: "test-password", acceptedTerms: true as const };
  const { registerSchema } = await import("../src/validation/auth.schemas.js");
  const result = await authService.register(registerSchema.parse(input));
  assert.equal(result.emailSent, true);
  assert.equal(sessions, 0);
  assert.equal(user.emailVerified, false);
  assert.ok(await bcrypt.compare(input.password, user.passwordHash));
  const raw = () => /token=([a-f0-9]{64})/.exec(mail)![1]!;
  const first = raw();
  assert.equal(user.verificationTokenHash, hashToken(first));
  assert.notEqual(user.verificationTokenHash, first);
  assert.ok(Math.abs(user.verificationExpiresAt!.getTime() - Date.now() - 3600000) < 3000);
  await assert.rejects(authService.login({ email: user.email, password: input.password, remember: false }), { status: 403, code: "EMAIL_NOT_VERIFIED" });
  await assert.rejects(authService.verifyEmail(undefined), { status: 400 });
  user.verificationExpiresAt = new Date(Date.now() - 1);
  await assert.rejects(authService.verifyEmail(first), { status: 410 });
  const resend = await authService.resendConfirmation(user.email);
  assert.deepEqual(await authService.resendConfirmation("unknown@test.invalid"), resend);
  const second = raw();
  assert.notEqual(first, second);
  await assert.rejects(authService.verifyEmail(first), { status: 400 });
  assert.equal((await authService.verifyEmail(second)).message, "E-mail confirmado com sucesso!");
  assert.equal(user.emailVerified, true);
  assert.equal(user.verificationTokenHash, null);
  assert.equal(user.verificationExpiresAt, null);
  await assert.rejects(authService.verifyEmail(second), { status: 400 });
  await authService.login({ email: user.email, password: input.password, remember: false });
  assert.equal(sessions, 1);
  failMail = true;
  const log = t.mock.method(console, "error", () => {});
  const failed = await authService.register(input);
  assert.equal(failed.emailSent, false);
  assert.match(failed.message, /Conta criada/);
  assert.equal(sessions, 1);
  assert.ok(!JSON.stringify(log.mock.calls).includes("Sensitive SMTP error"));
});
