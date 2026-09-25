import express from "express";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { env } from "./config/env.js";
import { requestProtection } from "./middlewares/request-protection.js";
import { routes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";

// Default validation messages in Portuguese (custom ones are set per field).
z.config(z.locales.pt());

export const app = express();

app.disable("x-powered-by");
if (env.TRUST_PROXY) app.set("trust proxy", env.TRUST_PROXY);

app.use("/api", requestProtection);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/api", routes);
app.use("/api", notFoundHandler);
app.use(errorHandler);
