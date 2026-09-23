import type { Request, Response } from "express";
import { feedbackService } from "../services/feedback.service.js";
import { currentUserId } from "../middlewares/authenticate.js";
import { createFeedbackSchema } from "../validation/feedback.schemas.js";

export const feedbackController = {
  async create(req: Request, res: Response) {
    const input = createFeedbackSchema.parse(req.body);
    const feedback = await feedbackService.create(currentUserId(req), input);
    res.status(201).json({ feedback });
  },
};
