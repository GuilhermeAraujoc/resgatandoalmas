import { adminRoutes } from "./admin.js";
import { contentService, visibleCatalog } from "../services/content.service.js";
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authRateLimit } from "../middlewares/rate-limit.js";
import { authController } from "../controllers/auth.controller.js";
import { meController } from "../controllers/me.controller.js";
import { assessmentController } from "../controllers/assessment.controller.js";
import { feedbackController } from "../controllers/feedback.controller.js";

export const routes = Router();

routes.get("/", (_req, res) => {
  res.json({ message: "API Resgatando Almas funcionando!" });
});

routes.post("/auth/register", authRateLimit, authController.register);
routes.post("/auth/login", authRateLimit, authController.login);
routes.post("/auth/logout", authController.logout);

routes.get("/me", authenticate, meController.show);
routes.patch("/me", authenticate, meController.update);
routes.delete("/me", authenticate, meController.destroy);
routes.get("/me/progress", authenticate, meController.progress);

routes.post("/assessments", authenticate, assessmentController.create);
routes.post("/feedbacks", authenticate, feedbackController.create);

routes.get("/catalog", authenticate, async (_req, res) => res.json(visibleCatalog(await contentService.get())));
routes.use("/admin", adminRoutes);
