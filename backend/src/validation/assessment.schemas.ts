import { z } from "zod";
import { EnergyLevel } from "../generated/prisma/enums.js";
import { QUESTION_COUNT } from "../domain/energy.js";

export const createAssessmentSchema = z.strictObject({
  /** One level per question, in questionnaire order. */
  answers: z
    .array(z.enum(EnergyLevel))
    .length(QUESTION_COUNT, `Responda às ${QUESTION_COUNT} perguntas.`),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
