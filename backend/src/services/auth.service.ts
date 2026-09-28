import crypto, { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { sessionRepository } from "../repositories/session.repository.js";
import { passwordResetRepository } from "../repositories/password-reset.repository.js";
import { badRequest, conflict, unauthorized } from "../lib/errors.js";
import { sendMail } from "../lib/mailer.js";
import { env } from "../config/env.js";
import { enviarEmailConfirmacao } from "./email.service.js";
import { HttpError, conflict, unauthorized } from "../lib/errors.js";
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
function verificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, verificationTokenHash: hashToken(token), verificationExpiresAt: new Date(Date.now() + HOUR) };
}

async function sendConfirmation(email: string, name: string, token: string) {
  try {
    await enviarEmailConfirmacao(email, name, token);
    return true;
  } catch {
    // Never log SMTP responses: they can contain credentials, recipients or links.
    console.error("Falha no envio da confirmação de e-mail. Verifique a configuração e disponibilidade SMTP.");
    return false;
  }
}

export const authService = {
  async register(input: RegisterInput) {
    const taken = await userRepository.findConflicts({ email: input.email });
    if (taken.some((user) => user.email === input.email))
      throw conflict("Este e-mail já está cadastrado.");

    const { token, ...verification } = verificationToken();
    const user = await userRepository.create({
      ...verification,
      emailVerified: false,
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_COST),
      termsAcceptedAt: new Date(),
    });
    const emailSent = await sendConfirmation(user.email, user.name, token);
    return { emailSent, message: emailSent
      ? "Cadastro realizado! Verifique sua caixa de entrada para confirmar seu e-mail."
      : "Conta criada, mas não foi possível enviar a confirmação. Solicite um novo envio." };
  },

  async verifyEmail(token: unknown) {
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      throw new HttpError(400, "Link de confirmação inválido.");
    const hash = hashToken(token);
    const user = await userRepository.findByVerificationHash(hash);
    if (!user) throw new HttpError(400, "Link de confirmação inválido.");
    if (user.emailVerified) return { message: "Este e-mail já foi confirmado." };
    if (!user.verificationExpiresAt || user.verificationExpiresAt.getTime() <= Date.now())
      throw new HttpError(410, "Este link de confirmação expirou.");
    const result = await userRepository.confirmEmail(user.id, hash);
    if (!result.count) throw new HttpError(400, "Link de confirmação inválido.");
    return { message: "E-mail confirmado com sucesso!" };
  },

  async resendConfirmation(email: string) {
    const user = await userRepository.findByEmail(email);
    if (user && !user.emailVerified && !user.blockedAt) {
      const { token, verificationTokenHash, verificationExpiresAt } = verificationToken();
      const result = await userRepository.renewVerification(user.id, verificationTokenHash, verificationExpiresAt);
      if (result.count) await sendConfirmation(user.email, user.name, token);
    }
    return { message: "Se houver uma conta pendente para este e-mail, enviaremos um novo link. Verifique também o spam." };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    const valid = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !valid || user.blockedAt) throw unauthorized("E-mail ou senha incorretos.");

    if (!user.emailVerified) throw new HttpError(403, "Confirme seu e-mail antes de entrar na plataforma.", "EMAIL_NOT_VERIFIED");

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
