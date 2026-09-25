import { z } from "zod";
import { nameField, emailField, cpfField, phoneField, birthDateField } from "./fields.js";
export const adminListSchema = z.strictObject({
  q: z.string().trim().max(120).default(""),
  status: z.enum(["all", "active", "blocked"]).default("all"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
export const dateRangeSchema = z.strictObject({
  from: z.iso.date().optional(), to: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
}).transform(input => {
  const end = input.to ? new Date(`${input.to}T00:00:00Z`) : new Date(new Date().toISOString().slice(0, 10));
  const start = input.from ? new Date(`${input.from}T00:00:00Z`) : new Date(end.getTime() - 29 * 86400000);
  return { start, end: new Date(end.getTime() + 86400000), page: input.page };
}).refine(({ start, end }) => end > start && end.getTime() - start.getTime() <= 366 * 86400000, "Selecione um período de até 366 dias, com datas em ordem.");
export type DateRange = z.infer<typeof dateRangeSchema>;
export const userIdSchema = z.uuid();
const reason = z.string().trim().min(5, "Informe o motivo da alteração (mínimo 5 caracteres).").max(300);
export const adminUpdateUserSchema = z.strictObject({
  name: nameField, email: emailField, cpf: cpfField,
  phone: phoneField, birthDate: birthDateField,
  blocked: z.boolean(), reason, updatedAt: z.iso.datetime(),
});
export const adminDeleteUserSchema = z.strictObject({
  confirmation: z.literal("EXCLUIR"), currentPassword: z.string().min(1).max(200), reason,
  updatedAt: z.iso.datetime(),
});
