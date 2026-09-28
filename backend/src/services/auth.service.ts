import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { sessionRepository } from "../repositories/session.repository.js";
import { passwordResetRepository } from "../repositories/password-reset.repository.js";
import { badRequest, conflict, unauthorized } from "../lib/errors.js";
import { sendMail } from "../lib/mailer.js";
import { env } from "../config/env.js";
import { toUserDto } from "./user.service.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../validation/auth.schemas.js";

const BCRYPT_COST = 12;
const HOUR = 60 * 60 * 1000;
/** Without "Lembrar de mim" the cookie lives for the browser session, capped at this. */
const SHORT_SESSION_MS = 24 * HOUR;
const REMEMBER_SESSION_MS = 30 * 24 * HOUR;
const PASSWORD_RESET_MS = 1 * HOUR;

/** Compared against when the e-mail is unknown, so both paths take the same time. */
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer", BCRYPT_COST);

export interface IssuedSession {
  token: string;
  expiresAt: Date;
  /** Whether the cookie should outlive the browser session. */
  persistent: boolean;
}

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

async function issueSession(
  userId: string,
  persistent: boolean,
): Promise<IssuedSession> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + (persistent ? REMEMBER_SESSION_MS : SHORT_SESSION_MS),
  );
  await sessionRepository.create({
    tokenHash: hashToken(token),
    userId,
    expiresAt,
  });
  return { token, expiresAt, persistent };
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function passwordResetMail(name: string, link: string) {
  const firstName = name.split(" ")[0] ?? name;
  return {
    subject: "Redefinição de senha — Resgatando Almas",
    text: [
      `Olá, ${firstName}!`,
      "",
      "Recebemos um pedido para redefinir a senha da sua conta.",
      "Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):",
      "",
      link,
      "",
      "Se você não fez este pedido, ignore este e-mail: sua senha continua a mesma.",
    ].join("\n"),
    html: `<p>Olá, ${escapeHtml(firstName)}!</p>
<p>Recebemos um pedido para redefinir a senha da sua conta.</p>
<p><a href="${escapeHtml(link)}">Criar uma nova senha</a></p>
<p>O link é válido por 1 hora. Se o botão não funcionar, copie e cole no navegador:<br>${escapeHtml(link)}</p>
<p>Se você não fez este pedido, ignore este e-mail: sua senha continua a mesma.</p>`,
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const taken = await userRepository.findConflicts(input);
    if (taken.some((user) => user.email === input.email))
      throw conflict("Este e-mail já está cadastrado.");
    if (taken.length > 0) throw conflict("Este CPF já está cadastrado.");

    const user = await userRepository.create({
      name: input.name,
      cpf: input.cpf,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_COST),
      termsAcceptedAt: new Date(),
    });
    return { user: toUserDto(user), session: await issueSession(user.id, false) };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    const valid = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !valid || user.blockedAt) throw unauthorized("E-mail ou senha incorretos.");

    await userRepository.update(user.id, { lastLoginAt: new Date() });
    await sessionRepository.deleteExpired(user.id);
    return {
      user: toUserDto(user),
      session: await issueSession(user.id, input.remember),
    };
  },

  async logout(token: string | undefined) {
    if (token) await sessionRepository.deleteByTokenHash(hashToken(token));
  },

  /**
   * Issues a single-use reset link and e-mails it. Unknown or blocked e-mails
   * are silently ignored so the endpoint does not reveal which accounts exist.
   */
  async requestPasswordReset(input: ForgotPasswordInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || user.blockedAt) return;

    const token = randomBytes(32).toString("base64url");
    await passwordResetRepository.replace({
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_MS),
    });
    const link = new URL("/reset-password", env.APP_URL);
    link.searchParams.set("token", token);
    await sendMail({ to: user.email, ...passwordResetMail(user.name, link.href) });
  },

  /** Sets a new password from a reset link and signs the user out everywhere. */
  async resetPassword(input: ResetPasswordInput) {
    const invalid = () =>
      badRequest("Este link de redefinição é inválido ou expirou. Solicite um novo.");
    const reset = await passwordResetRepository.findActive(hashToken(input.token));
    if (!reset) throw invalid();
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    if (!(await passwordResetRepository.redeem(reset.id, reset.userId, passwordHash)))
      throw invalid();
  },

  /** The session behind a cookie token, or null when missing/expired. */
  async resolve(token: string) {
    return sessionRepository.findActive(hashToken(token));
  },
};
