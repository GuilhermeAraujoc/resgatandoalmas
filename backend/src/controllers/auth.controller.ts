import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { loginSchema, registerSchema, resendConfirmationSchema } from "../validation/auth.schemas.js";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "../lib/session-cookie.js";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(
      registerSchema.parse(req.body),
    );
    res.status(201).json(result);
  },

  async verifyEmail(req: Request, res: Response) {
    res.json(await authService.verifyEmail(req.query.token));
  },

  async resendConfirmation(req: Request, res: Response) {
    const { email } = resendConfirmationSchema.parse(req.body);
    res.json(await authService.resendConfirmation(email));
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
