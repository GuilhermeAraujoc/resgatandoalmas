import { z } from "zod";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function isValidCpf(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export const nameField = z
  .string()
  .trim()
  .min(1, "Informe seu nome.")
  .max(120, "Nome muito longo.");

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-mail muito longo.")
  .pipe(z.email("Informe um e-mail válido."));

/** Accepts "000.000.000-00" or digits; outputs digits only. */
export const cpfField = z
  .string()
  .transform(onlyDigits)
  .refine(isValidCpf, "Informe um CPF válido.");

/** bcrypt only uses the first 72 bytes, so longer passwords are rejected. */
export const newPasswordField = z
  .string()
  .min(6, "A senha deve ter no mínimo 6 caracteres.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "A senha deve ter no máximo 72 caracteres.",
  );

/** Empty string clears the phone; otherwise 10–11 digits (DDD + número). */
export const phoneField = z
  .string()
  .transform(onlyDigits)
  .refine(
    (value) => value === "" || /^\d{10,11}$/.test(value),
    "Informe um telefone válido com DDD.",
  )
  .transform((value) => value || null);

/** Empty string clears the date; otherwise "YYYY-MM-DD" not in the future. */
export const birthDateField = z
  .union([z.literal(""), z.iso.date("Informe uma data válida.")])
  .refine(
    (value) =>
      value === "" ||
      (value >= "1900-01-01" && value <= new Date().toISOString().slice(0, 10)),
    "Informe uma data de nascimento válida.",
  )
  .transform((value) => value || null);
