import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { sessionRepository } from "../repositories/session.repository.js";
import { conflict, unauthorized } from "../lib/errors.js";
import { toUserDto } from "./user.service.js";
import type { LoginInput, RegisterInput } from "../validation/auth.schemas.js";

const BCRYPT_COST = 12;
const HOUR = 60 * 60 * 1000;
/** Without "Lembrar de mim" the cookie lives for the browser session, capped at this. */
const SHORT_SESSION_MS = 24 * HOUR;
const REMEMBER_SESSION_MS = 30 * 24 * HOUR;

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
    if (!user || !valid) throw unauthorized("E-mail ou senha incorretos.");

    await sessionRepository.deleteExpired(user.id);
    return {
      user: toUserDto(user),
      session: await issueSession(user.id, input.remember),
    };
  },

  async logout(token: string | undefined) {
    if (token) await sessionRepository.deleteByTokenHash(hashToken(token));
  },

  /** The session behind a cookie token, or null when missing/expired. */
  async resolve(token: string) {
    return sessionRepository.findActive(hashToken(token));
  },
};
