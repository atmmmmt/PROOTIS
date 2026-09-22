import { Router } from "express";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok, ApiError } from "../core/http.js";
import { db, createRecord, updateRecord, deleteRecord } from "../data/demo-store.js";

export const growthRouter = Router();
growthRouter.use(requireAuth);

// ── Overview: latest metrics per channel ─────────────────────────────────────
growthRouter.get(
  "/overview",
  requirePermission("analytics:read"),
  asyncHandler(async (_req, res) => {
    const channels = db.growthChannels;
    const overview = channels.map((ch) => {
      // Get all metrics for this channel sorted by date desc
      const history = db.growthMetrics
        .filter((m) => m.channelId === ch.id)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const latest = history[0] ?? null;
      const previous = history[1] ?? null;
      let followersDelta: number | null = null;
      if (latest && previous && latest.followers != null && previous.followers != null) {
        followersDelta = Number(latest.followers) - Number(previous.followers);
      }
      return {
        channel: ch,
        latest,
        previous,
        followersDelta,
        historyCount: history.length
      };
    });
    ok(res, overview);
  })
);

// ── List channels ─────────────────────────────────────────────────────────────
growthRouter.get(
  "/channels",
  requirePermission("analytics:read"),
  asyncHandler(async (_req, res) => {
    ok(res, { rows: db.growthChannels, total: db.growthChannels.length });
  })
);

// ── Create channel ────────────────────────────────────────────────────────────
growthRouter.post(
  "/channels",
  requirePermission("analytics:read"),
  asyncHandler(async (req, res) => {
    const row = createRecord("growthChannels", req.body, req.user?.id);
    ok(res, row);
  })
);

// ── Update channel ────────────────────────────────────────────────────────────
growthRouter.patch(
  "/channels/:id",
  requirePermission("analytics:read"),
  asyncHandler(async (req, res) => {
    const row = updateRecord("growthChannels", String(req.params.id), req.body);
    if (!row) throw new ApiError(404, "not_found", "Channel not found.");
    ok(res, row);
  })
);

// ── Delete channel ────────────────────────────────────────────────────────────
growthRouter.delete(
  "/channels/:id",
  requirePermission("analytics:read"),
  asyncHandler(async (req, res) => {
    const deleted = deleteRecord("growthChannels", String(req.params.id));
    if (!deleted) throw new ApiError(404, "not_found", "Channel not found.");
    ok(res, { deleted: true, id: String(req.params.id) });
  })
);

// ── Metrics history for a channel ─────────────────────────────────────────────
growthRouter.get(
  "/channels/:id/history",
  requirePermission("analytics:read"),
  asyncHandler(async (req, res) => {
    const ch = db.growthChannels.find((c) => c.id === String(req.params.id));
    if (!ch) throw new ApiError(404, "not_found", "Channel not found.");
    const history = db.growthMetrics
      .filter((m) => m.channelId === String(req.params.id))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    ok(res, { channel: ch, history, total: history.length });
  })
);

// ── Add metrics snapshot ──────────────────────────────────────────────────────
growthRouter.post(
  "/channels/:id/metrics",
  requirePermission("analytics:read"),
  asyncHandler(async (req, res) => {
    const ch = db.growthChannels.find((c) => c.id === String(req.params.id));
    if (!ch) throw new ApiError(404, "not_found", "Channel not found.");
    const row = createRecord("growthMetrics", { ...req.body, channelId: String(req.params.id) }, req.user?.id);
    ok(res, row);
  })
);

// ── List all metrics (for table view) ────────────────────────────────────────
growthRouter.get(
  "/metrics",
  requirePermission("analytics:read"),
  asyncHandler(async (_req, res) => {
    const sorted = [...db.growthMetrics].sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );
    ok(res, { rows: sorted, total: sorted.length });
  })
);
