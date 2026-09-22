import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
import { ownershipRouter } from "./modules/ownership.routes.js";
import { accessRouter } from "./modules/access.routes.js";
import { notificationsRouter } from "./modules/notifications.routes.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function resolveWebDist() {
  const candidates = [
    path.resolve(currentDir, "public"),
    path.resolve(currentDir, "../../web-dashboard/dist")
  ];
  return candidates.find((candidate) => existsSync(path.join(candidate, "index.html")));
}

export function createApp() {
  const app = express();

  // Hostinger runs the Node process behind a reverse proxy. Trust the nearest
  // proxy so req.ip and express-rate-limit use X-Forwarded-For correctly.
  app.set("trust proxy", 1);

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
  app.use("/api/v1/access", accessRouter);
  app.use("/api/v1/platform/notifications", notificationsRouter);
  app.use("/api/v1/platform", platformRouter);
  app.use("/api/v1/crm", crmRouter);
  app.use("/api/v1/projects", projectsRouter);
  app.use("/api/v1/finance", financeRouter);
  app.use("/api/v1/hr", hrRouter);
  app.use("/api/v1/partners", partnersRouter);
  app.use("/api/v1/ownership", ownershipRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/audit", auditRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/ai-sales", aiSalesRouter);
  app.use("/api/v1/growth", growthRouter);
  app.use("/api/v1", specAliasRouter);

  if (env.NODE_ENV === "production") {
    const webDist = resolveWebDist();
    if (webDist) {
      app.use(express.static(webDist, { index: false }));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api/")) return next();
        return res.sendFile(path.join(webDist, "index.html"));
      });
    }
  }

  app.use(errorHandler);
  return app;
}
