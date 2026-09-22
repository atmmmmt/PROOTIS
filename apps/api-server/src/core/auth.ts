import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { Permission } from "@prootech/shared-types";
import { env } from "../config/env.js";
import { ApiError } from "./http.js";
import { findUserById } from "../data/demo-store.js";

// In-memory token blocklist — swap with Redis Set in production
const revokedTokens = new Set<string>();

export function revokeToken(jti: string) {
  revokedTokens.add(jti);
}

export function isRevoked(jti: string) {
  return revokedTokens.has(jti);
}

export interface AccessTokenPayload {
  sub: string;
  organizationId: string;
  email: string;
  jti?: string;
}

export function signAccessToken(payload: AccessTokenPayload) {
  const jti = `at_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return jwt.sign({ ...payload, jti }, env.JWT_ACCESS_SECRET, { expiresIn: "20m" });
}

export function signRefreshToken(payload: AccessTokenPayload) {
  const jti = `rt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, { expiresIn: "14d" });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!token) throw new ApiError(401, "missing_token", "Authentication token is required.");

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (payload.jti && isRevoked(payload.jti)) {
      throw new ApiError(401, "token_revoked", "Token has been revoked.");
    }
    const user = findUserById(payload.sub);
    if (!user) throw new ApiError(401, "invalid_session", "User session no longer exists.");
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "invalid_token", "Invalid or expired token.");
  }
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "missing_user", "Authentication is required.");
    if (!req.user.permissions.includes(permission)) {
      throw new ApiError(403, "permission_denied", `Required permission: ${permission}`);
    }
    next();
  };
}
