import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ok, ApiError, asyncHandler } from "../core/http.js";
import { requireAuth, signAccessToken, signRefreshToken, revokeToken, type AccessTokenPayload } from "../core/auth.js";
import { env } from "../config/env.js";
import { findUserByEmail, findUserById, verifyUserPassword } from "../data/demo-store.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(16)
});

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = findUserByEmail(input.email);
    if (!user || !verifyUserPassword(user, input.password)) {
      throw new ApiError(401, "invalid_credentials", "Email or password is incorrect.");
    }

    const payload = { sub: user.id, organizationId: user.organizationId, email: user.email };
    const { passwordHash: _passwordHash, ...session } = user;
    ok(res, {
      user: session,
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload)
    });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const input = refreshSchema.parse(req.body);
    try {
      const payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
      const user = findUserById(payload.sub);
      if (!user) throw new ApiError(401, "invalid_session", "User session no longer exists.");

      const nextPayload = { sub: user.id, organizationId: user.organizationId, email: user.email };
      ok(res, {
        accessToken: signAccessToken(nextPayload),
        refreshToken: signRefreshToken(nextPayload),
        user
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, "invalid_refresh_token", "Invalid or expired refresh token.");
    }
  })
);

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => ok(res, req.user)));

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (token) {
      try {
        const payload = jwt.decode(token) as AccessTokenPayload | null;
        if (payload?.jti) revokeToken(payload.jti);
      } catch {
        // ignore decode errors
      }
    }
    ok(res, { success: true });
  })
);
