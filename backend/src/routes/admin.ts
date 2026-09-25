import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate, currentUserId } from "../middlewares/authenticate.js";
import { requireAdmin } from "../middlewares/require-admin.js";
import { adminRepository } from "../repositories/admin.repository.js";
import { contentRepository } from "../repositories/content.repository.js";
import { adminService } from "../services/admin.service.js";
import { adminListSchema, dateRangeSchema, adminUpdateUserSchema, adminDeleteUserSchema, userIdSchema } from "../validation/admin.schemas.js";
import { saveContentSchema, publishContentSchema, catalogSchema } from "../validation/content.schemas.js";

export const adminRoutes = Router();
adminRoutes.use(authenticate, requireAdmin);
adminRoutes.use(rateLimit({ windowMs: 60000, limit: 120, keyGenerator: req => currentUserId(req), standardHeaders: true, legacyHeaders: false, message: { error: { message: "Muitas solicitações. Aguarde um minuto." } } }));
const writeLimit = rateLimit({ windowMs: 60000, limit: 20, keyGenerator: req => currentUserId(req), standardHeaders: true, legacyHeaders: false, message: { error: { message: "Muitas alterações. Aguarde um minuto." } } });
adminRoutes.get("/stats", async (req, res) => res.json(await adminRepository.stats(dateRangeSchema.parse(req.query))));
adminRoutes.get("/users", async (req, res) => res.json(await adminRepository.list(adminListSchema.parse(req.query))));
adminRoutes.get("/users/:id/report", async (req, res) => res.json(await adminService.report(currentUserId(req), userIdSchema.parse(req.params.id), dateRangeSchema.parse(req.query))));
adminRoutes.get("/users/:id/export", async (req, res) => res.json(await adminService.export(currentUserId(req), userIdSchema.parse(req.params.id), dateRangeSchema.parse(req.query))));
adminRoutes.patch("/users/:id", writeLimit, async (req, res) => {
  const { reason, updatedAt, blocked, birthDate, ...profile } = adminUpdateUserSchema.parse(req.body);
  res.json({ user: await adminRepository.update(currentUserId(req), userIdSchema.parse(req.params.id), updatedAt, reason, { ...profile, birthDate: birthDate ? new Date(`${birthDate}T00:00:00Z`) : null, blockedAt: blocked ? new Date() : null }) });
});
adminRoutes.delete("/users/:id", writeLimit, async (req, res) => {
  const input = adminDeleteUserSchema.parse(req.body);
  await adminService.confirmPassword(currentUserId(req), input.currentPassword);
  await adminRepository.remove(currentUserId(req), userIdSchema.parse(req.params.id), input.updatedAt, input.reason);
  res.status(204).end();
});
adminRoutes.get("/content", async (_req, res) => {
  const [draft, releases] = await Promise.all([contentRepository.draft(), contentRepository.history()]);
  res.json({ draft: draft ? { ...draft, data: catalogSchema.parse(draft.data) } : null, releases });
});
adminRoutes.patch("/content", writeLimit, async (req, res) => {
  const input = saveContentSchema.parse(req.body);
  res.json({ draft: await contentRepository.save(currentUserId(req), input.revision, input.data) });
});
adminRoutes.post("/content/publish", writeLimit, async (req, res) => {
  const { revision } = publishContentSchema.parse(req.body);
  res.status(201).json({ release: await contentRepository.publish(currentUserId(req), revision) });
});
adminRoutes.get("/audit", async (req, res) => res.json(await adminRepository.audits(adminListSchema.parse(req.query).page)));
