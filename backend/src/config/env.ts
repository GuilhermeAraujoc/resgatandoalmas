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
});

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
