import { assessmentRepository } from "../repositories/assessment.repository.js";
import { assessmentScore, scenarioForScore } from "../domain/energy.js";
import type { CreateAssessmentInput } from "../validation/assessment.schemas.js";

export const assessmentService = {
  /** Score and scenario are computed here; the client only sends answers. */
  async create(userId: string, input: CreateAssessmentInput) {
    const energyScore = assessmentScore(input.answers);
    const assessment = await assessmentRepository.create({
      userId,
      energyScore,
      scenario: scenarioForScore(energyScore),
      answers: input.answers,
    });
    return { ...assessment, createdAt: assessment.createdAt.toISOString() };
  },
};
