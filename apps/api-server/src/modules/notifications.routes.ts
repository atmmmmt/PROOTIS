import { Router } from "express";
import { requireAuth } from "../core/auth.js";
import { ApiError, asyncHandler, ok } from "../core/http.js";
import { db, updateRecord } from "../data/demo-store.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = db.notifications.filter((item) => item.userId === req.user?.id);
    ok(res, { rows, total: rows.length, page: 1, pageSize: rows.length || 25 });
  })
);

notificationsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = db.notifications.find((item) => item.id === String(req.params.id));
    if (!existing || existing.userId !== req.user?.id) throw new ApiError(404, "not_found", "Notification not found.");
    const row = updateRecord("notifications", String(req.params.id), {
      status: req.body?.status ?? existing.status,
      readAt: req.body?.status === "read" ? new Date().toISOString() : existing.readAt
    });
    ok(res, row);
  })
);
