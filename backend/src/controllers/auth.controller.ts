import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { loginSchema, registerSchema } from "../validation/auth.schemas.js";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "../lib/session-cookie.js";

export const authController = {
  async register(req: Request, res: Response) {
    const { user, session } = await authService.register(
      registerSchema.parse(req.body),
    );
    setSessionCookie(res, session);
    res.status(201).json({ user });
  },

  async login(req: Request, res: Response) {
    const { user, session } = await authService.login(
      loginSchema.parse(req.body),
    );
    setSessionCookie(res, session);
    res.json({ user });
  },

  async logout(req: Request, res: Response) {
    await authService.logout(readSessionCookie(req));
    clearSessionCookie(res);
    res.status(204).end();
  },
};
