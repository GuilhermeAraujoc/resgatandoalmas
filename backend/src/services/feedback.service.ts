import { activityRepository } from "../repositories/activity.repository.js";
import { feedbackRepository } from "../repositories/feedback.repository.js";
import { feedbackEnergy } from "../domain/energy.js";
import { notFound } from "../lib/errors.js";
import { progressService } from "./progress.service.js";
import type { CreateFeedbackInput } from "../validation/feedback.schemas.js";

export const feedbackService = {
  /** Registers the feedback together with the completed activity it refers to. */
  async create(userId: string, input: CreateFeedbackInput) {
    if (!(await activityRepository.findById(input.activityId)))
      throw notFound("Atividade não encontrada.");

    const feedback = await feedbackRepository.createWithCompletion({
      userId,
      activityId: input.activityId,
      energyLevel: input.energyLevel,
      feeling: input.feeling,
      ease: input.ease,
      hadDiscomfort: input.hadDiscomfort,
      note: input.note ?? null,
      energyBefore: await progressService.latestEnergy(userId),
    });
    return {
      id: feedback.id,
      activityId: feedback.userActivity.activityId,
      energyLevel: feedback.energyLevel,
      feeling: feedback.feeling,
      ease: feedback.ease,
      hadDiscomfort: feedback.hadDiscomfort,
      note: feedback.note,
      before: feedback.energyBefore,
      after: feedbackEnergy(feedback.energyLevel),
      createdAt: feedback.createdAt.toISOString(),
    };
  },
};
