import type { Request, Response, NextFunction } from "express";
import { forbidden } from "../lib/errors.js";

export function requestProtection(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  // Browsers cannot send this custom header cross-origin without an accepted
  // CORS preflight. This API intentionally does not allow cross-origin requests.
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.get("X-Requested-With") !== "ResgatandoAlmas" || req.get("Sec-Fetch-Site") === "cross-site"))
    throw forbidden("Origem da solicitação não permitida.");
  next();
}
