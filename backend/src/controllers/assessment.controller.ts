import type { Request, Response } from "express";
import { assessmentService } from "../services/assessment.service.js";
import { currentUserId } from "../middlewares/authenticate.js";
import { createAssessmentSchema } from "../validation/assessment.schemas.js";

export const assessmentController = {
  async create(req: Request, res: Response) {
    const input = createAssessmentSchema.parse(req.body);
    const assessment = await assessmentService.create(currentUserId(req), input);
    res.status(201).json({ assessment });
  },
};
