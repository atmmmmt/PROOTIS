import type { NextFunction, Request, Response } from "express";
import { addAuditLog } from "../data/demo-store.js";

const sensitiveMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!sensitiveMethods.has(req.method) || req.path.includes("/auth/login")) {
    next();
    return;
  }

  const started = Date.now();
  res.on("finish", () => {
    addAuditLog({
      actorUserId: req.user?.id ?? "anonymous",
      action: `${req.method} ${req.originalUrl}`,
      resourceType: req.originalUrl.split("/").filter(Boolean)[2] ?? "unknown",
      resourceId: req.params.id,
      before: undefined,
      after: req.body,
      interactionId: req.interactionId,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? "unknown",
      outcome: res.statusCode < 400 ? "success" : "failure",
      durationMs: Date.now() - started
    });
  });
  next();
}
