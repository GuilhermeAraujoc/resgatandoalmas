import { rateLimit } from "express-rate-limit";

/** Slows down credential guessing on the auth endpoints. */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: { message: "Muitas tentativas. Aguarde alguns minutos." },
  },
});
