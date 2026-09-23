import { z } from "zod";
import {
  birthDateField,
  cpfField,
  emailField,
  nameField,
  phoneField,
} from "./fields.js";

export const updateProfileSchema = z
  .strictObject({
    name: nameField.optional(),
    email: emailField.optional(),
    // The profile form leaves CPF blank unless the user types a new one.
    cpf: z.union([z.literal("").transform(() => undefined), cpfField]).optional(),
    phone: phoneField.optional(),
    birthDate: birthDateField.optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    "Nenhum campo para atualizar.",
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
