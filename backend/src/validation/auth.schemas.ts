import { z } from "zod";
import { cpfField, emailField, nameField, newPasswordField } from "./fields.js";

export const registerSchema = z.strictObject({
  name: nameField,
  cpf: cpfField,
  email: emailField,
  password: newPasswordField,
  acceptedTerms: z.literal(true, {
    error: "É necessário aceitar os Termos de Uso e a Política de Privacidade.",
  }),
});

export const loginSchema = z.strictObject({
  email: emailField,
  password: z.string().min(1, "Informe sua senha.").max(200),
  remember: z.boolean().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.strictObject({
  email: emailField,
});

export const resetPasswordSchema = z.strictObject({
  token: z.string().min(1, "Link de redefinição inválido.").max(200),
  password: newPasswordField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
