import { existsSync } from "node:fs";
import { z } from "zod";

if (existsSync(".env")) process.loadEnvFile(".env");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  /** Timezone used to group records into days/weeks for the progress screen. */
  APP_TIMEZONE: z
    .string()
    .default("America/Sao_Paulo")
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Invalid IANA timezone"),
  /** Express "trust proxy" value, e.g. "uniquelocal" behind the Vite dev proxy. */
  TRUST_PROXY: z.string().optional(),
  /** Public frontend origin, used to build links sent by e-mail. */
  APP_URL: z.url().default("http://localhost:5173"),
  /** Without SMTP_HOST, e-mails are printed to the console instead of sent. */
  SMTP_HOST: z.string().trim().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  /** true for implicit TLS (port 465); otherwise STARTTLS is used when offered. */
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: z.string().trim().optional(),
  /** Gmail shows app passwords in groups ("abcd efgh …"); the spaces are not part of it. */
  SMTP_PASS: z.string().transform((value) => value.replace(/\s/g, "")).optional(),
  MAIL_FROM: z.string().default("Resgatando Almas <nao-responda@resgatandoalmas.com.br>"),
});

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
