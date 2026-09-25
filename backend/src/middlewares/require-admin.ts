import type { Request, Response, NextFunction } from "express";
import { forbidden } from "../lib/errors.js";
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") throw forbidden();
  next();
}
