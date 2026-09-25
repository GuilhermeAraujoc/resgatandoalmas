import type { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { unauthorized } from "../lib/errors.js";
import { clearSessionCookie, readSessionCookie } from "../lib/session-cookie.js";

/** Rejects the request with 401 unless it carries a valid session cookie. */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = readSessionCookie(req);
  const session = token ? await authService.resolve(token) : null;
  if (!session) {
    if (token) clearSessionCookie(res);
    throw unauthorized();
  }
  req.user = { id: session.userId, sessionId: session.id, role: session.user.role };
  next();
}

/** The authenticated user's id. Only call behind `authenticate`. */
export function currentUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}
