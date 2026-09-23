import { z } from "zod";
import { Ease, EnergyLevel, Feeling } from "../generated/prisma/enums.js";

export const createFeedbackSchema = z.strictObject({
  activityId: z.string().trim().min(1).max(64),
  energyLevel: z.enum(EnergyLevel),
  feeling: z.enum(Feeling),
  ease: z.enum(Ease),
  hadDiscomfort: z.boolean(),
  note: z
    .string()
    .trim()
    .max(1000, "O comentário deve ter no máximo 1000 caracteres.")
    .transform((value) => value || null)
    .optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
