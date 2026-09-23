import type { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { progressService } from "../services/progress.service.js";
import { currentUserId } from "../middlewares/authenticate.js";
import { updateProfileSchema } from "../validation/user.schemas.js";
import { clearSessionCookie } from "../lib/session-cookie.js";

export const meController = {
  async show(req: Request, res: Response) {
    res.json({ user: await userService.getProfile(currentUserId(req)) });
  },

  async update(req: Request, res: Response) {
    const input = updateProfileSchema.parse(req.body);
    res.json({ user: await userService.updateProfile(currentUserId(req), input) });
  },

  async destroy(req: Request, res: Response) {
    await userService.deleteAccount(currentUserId(req));
    clearSessionCookie(res);
    res.status(204).end();
  },

  async progress(req: Request, res: Response) {
    res.json(await progressService.getProgress(currentUserId(req)));
  },
};
