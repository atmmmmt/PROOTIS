import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { UserSession } from "@prootech/shared-types";

export type AuthUser = UserSession;

declare module "express-serve-static-core" {
  interface Request {
    interactionId: string;
    user?: AuthUser;
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  req.interactionId = String(req.headers["x-interaction-id"] ?? randomUUID());
  res.setHeader("x-interaction-id", req.interactionId);
  next();
}
