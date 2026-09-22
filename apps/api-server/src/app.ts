import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { requestContext } from "./core/request-context.js";
import { auditMiddleware } from "./core/audit.js";
import { errorHandler, ok } from "./core/http.js";
import { authRouter } from "./modules/auth.routes.js";
import { crmRouter } from "./modules/crm.routes.js";
import { aiRouter } from "./modules/ai.routes.js";
import { aiSalesRouter } from "./modules/ai-sales.routes.js";
import { analyticsRouter } from "./modules/analytics.routes.js";
import { auditRouter, financeRouter, hrRouter, partnersRouter, platformRouter, projectsRouter } from "./modules/domain.routes.js";
import { growthRouter } from "./modules/growth.routes.js";
import { docsRouter } from "./modules/docs.routes.js";
import { specAliasRouter } from "./modules/spec-alias.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("tiny"));
  app.use(requestContext);
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 180,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(auditMiddleware);

  app.get("/api/v1/health", (_req, res) => ok(res, { status: "ok", service: "api-server" }));
  app.use("/api/v1/docs", docsRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/platform", platformRouter);
  app.use("/api/v1/crm", crmRouter);
  app.use("/api/v1/projects", projectsRouter);
  app.use("/api/v1/finance", financeRouter);
  app.use("/api/v1/hr", hrRouter);
  app.use("/api/v1/partners", partnersRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/audit", auditRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/ai-sales", aiSalesRouter);
  app.use("/api/v1/growth", growthRouter);
  app.use("/api/v1", specAliasRouter);

  app.use(errorHandler);
  return app;
}
