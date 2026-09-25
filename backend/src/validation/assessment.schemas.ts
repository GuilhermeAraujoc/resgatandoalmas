import { z } from "zod";
export const createAssessmentSchema = z.strictObject({
  contentReleaseId: z.string().min(1).max(64),
  answers: z.array(z.strictObject({ questionId: z.string().min(1).max(64), optionIndex: z.number().int().min(0).max(7) })).min(1).max(100),
});
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
