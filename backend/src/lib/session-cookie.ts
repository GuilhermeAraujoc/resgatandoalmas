import type { Request, Response } from "express";
import { isProduction } from "../config/env.js";
import type { IssuedSession } from "../services/auth.service.js";

export const SESSION_COOKIE = "ra_session";

const baseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api",
} as const;

export function setSessionCookie(res: Response, session: IssuedSession) {
  res.cookie(SESSION_COOKIE, session.token, {
    ...baseOptions,
    // Non-persistent sessions use a browser-session cookie; the server-side expiry still applies.
    ...(session.persistent ? { expires: session.expiresAt } : {}),
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, baseOptions);
}

export function readSessionCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[SESSION_COOKIE];
  return typeof value === "string" && value ? value : undefined;
}
