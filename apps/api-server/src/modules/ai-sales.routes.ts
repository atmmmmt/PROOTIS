import { Router } from "express";
import { z } from "zod";
import type { AiSalesOverview } from "@prootech/shared-types";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok, ApiError } from "../core/http.js";
import {
  addAiSalesActivity,
  createRecord,
  db,
  generateAiSalesProspects,
  syncAiSalesProspectToCrm,
  updateRecord
} from "../data/demo-store.js";

const campaignSchema = z.object({
  name: z.string().min(3),
  sector: z.string().min(2),
  region: z.string().min(2),
  objective: z.string().min(8),
  targetTitle: z.string().min(2),
  language: z.enum(["ar", "en"]).default("en"),
  mode: z.enum(["copilot", "semi_autonomous"]).default("copilot")
});

function buildOverview(): AiSalesOverview {
  const campaigns = db.aiSalesCampaigns;
  const prospects = db.aiSalesProspects;
  const sent = prospects.filter((item) => ["sent", "opened", "replied", "qualified"].includes(String(item.status))).length;
  const qualified = prospects.filter((item) => item.status === "qualified").length;
  const opened = prospects.filter((item) => item.deliverySignal === "opened").length;
  const approvalQueue = prospects.filter((item) => item.status === "approval_required").slice(0, 5);

  return {
    metrics: [
      { id: "campaigns", labelAr: "الحملات النشطة", labelEn: "Active campaigns", value: String(campaigns.filter((item) => item.status === "active").length), delta: "+1", tone: "good" },
      { id: "researched", labelAr: "الشركات المدروسة", labelEn: "Researched accounts", value: String(prospects.length), delta: "+4", tone: "neutral" },
      { id: "sent", labelAr: "الرسائل المرسلة", labelEn: "Outreach sent", value: String(sent), delta: "+2", tone: "good" },
      { id: "opened", labelAr: "الرسائل المفتوحة", labelEn: "Opened", value: String(opened), delta: "+1", tone: "good" },
      { id: "qualified", labelAr: "الليدز المؤهلة", labelEn: "Qualified leads", value: String(qualified), delta: "+1", tone: "good" },
      { id: "approval", labelAr: "بانتظار اعتماد", labelEn: "Awaiting approval", value: String(approvalQueue.length), delta: "watch", tone: "watch" }
    ],
    campaigns,
    approvalQueue,
    activityFeed: db.aiSalesActivities.slice(0, 8),
    managerSummary: {
      topAngleAr: "أفضل زاوية حالياً: تحسين الحجز والمتابعة للعيادات والخدمات.",
      topAngleEn: "Best angle right now: booking conversion and follow-up for clinics and service teams.",
      weakPointAr: "النقطة الأضعف: ما زال الاعتماد البشري مطلوباً قبل الإرسال الأول في معظم الشركات.",
      weakPointEn: "Weakest point: first-send approval still depends on a human for most accounts.",
      recommendationAr: "ابدأ بـ Copilot للحملات الجديدة، ثم فعّل الوضع شبه الذاتي فقط على الرسائل والقوالب التي أثبتت أداءً جيداً.",
      recommendationEn: "Use copilot for new campaigns, then enable semi-autonomous mode only on proven templates and low-risk segments."
    }
  };
}

export const aiSalesRouter = Router();
aiSalesRouter.use(requireAuth, requirePermission("sales:automation"));

aiSalesRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => ok(res, buildOverview()))
);

aiSalesRouter.get(
  "/campaigns",
  asyncHandler(async (_req, res) =>
    ok(res, {
      rows: db.aiSalesCampaigns,
      total: db.aiSalesCampaigns.length,
      page: 1,
      pageSize: db.aiSalesCampaigns.length
    })
  )
);

aiSalesRouter.post(
  "/campaigns",
  asyncHandler(async (req, res) => {
    const input = campaignSchema.parse(req.body);
    const row = createRecord(
      "aiSalesCampaigns",
      {
        ...input,
        status: "draft",
        approvedCount: 0,
        sentCount: 0,
        qualifiedCount: 0
      },
      req.user?.id
    );
    addAiSalesActivity({
      campaignId: String(row.id),
      type: "research",
      title: "New AI sales campaign created",
      detail: `${input.name} is ready for prospect generation.`
    });
    ok(res, row);
  })
);

aiSalesRouter.post(
  "/campaigns/:id/generate-prospects",
  asyncHandler(async (req, res) => {
    const created = generateAiSalesProspects(String(req.params.id), req.user?.id);
    ok(res, { createdCount: created.length, rows: created });
  })
);

aiSalesRouter.post(
  "/campaigns/:id/activate",
  asyncHandler(async (req, res) => {
    const row = updateRecord("aiSalesCampaigns", String(req.params.id), { status: "active" });
    if (!row) throw new ApiError(404, "not_found", "Campaign not found.");
    ok(res, row);
  })
);

aiSalesRouter.get(
  "/prospects",
  asyncHandler(async (_req, res) =>
    ok(res, {
      rows: db.aiSalesProspects,
      total: db.aiSalesProspects.length,
      page: 1,
      pageSize: db.aiSalesProspects.length
    })
  )
);

aiSalesRouter.post(
  "/prospects/:id/approve",
  asyncHandler(async (req, res) => {
    const row = updateRecord("aiSalesProspects", String(req.params.id), {
      status: "approved",
      nextAction: "Ready to sync or send",
      deliverySignal: "queued"
    });
    if (!row) throw new ApiError(404, "not_found", "Prospect not found.");
    addAiSalesActivity({
      campaignId: String(row.campaignId),
      prospectId: String(row.id),
      type: "approval",
      title: "Prospect approved by manager",
      detail: `${row.companyName} is approved for outreach.`
    });
    ok(res, row);
  })
);

aiSalesRouter.post(
  "/prospects/:id/reject",
  asyncHandler(async (req, res) => {
    const row = updateRecord("aiSalesProspects", String(req.params.id), {
      status: "rejected",
      nextAction: "No outreach. Keep as researched account.",
      deliverySignal: "none"
    });
    if (!row) throw new ApiError(404, "not_found", "Prospect not found.");
    addAiSalesActivity({
      campaignId: String(row.campaignId),
      prospectId: String(row.id),
      type: "approval",
      title: "Prospect rejected",
      detail: `${row.companyName} was blocked from outreach by manager review.`
    });
    ok(res, row);
  })
);

aiSalesRouter.post(
  "/prospects/:id/send",
  asyncHandler(async (req, res) => {
    const current = db.aiSalesProspects.find((item) => item.id === String(req.params.id));
    if (!current) throw new ApiError(404, "not_found", "Prospect not found.");
    const nextStatus = current.status === "approved" || current.status === "scheduled" ? "sent" : current.status;
    const row = updateRecord("aiSalesProspects", String(req.params.id), {
      status: nextStatus,
      nextAction: nextStatus === "sent" ? "Wait for open or reply" : current.nextAction,
      deliverySignal: nextStatus === "sent" ? "queued" : current.deliverySignal
    });
    addAiSalesActivity({
      campaignId: String(current.campaignId),
      prospectId: String(current.id),
      type: "send",
      title: "Outreach dispatched in demo mode",
      detail: `${current.companyName} moved to sent without using a real mailbox integration.`
    });
    ok(res, row);
  })
);

aiSalesRouter.post(
  "/prospects/:id/simulate-reply",
  asyncHandler(async (req, res) => {
    const current = db.aiSalesProspects.find((item) => item.id === String(req.params.id));
    if (!current) throw new ApiError(404, "not_found", "Prospect not found.");
    const row = updateRecord("aiSalesProspects", String(req.params.id), {
      status: "replied",
      nextAction: "Review AI draft response and schedule a call",
      deliverySignal: "replied"
    });
    addAiSalesActivity({
      campaignId: String(current.campaignId),
      prospectId: String(current.id),
      type: "reply",
      title: "Reply detected in demo sequence",
      detail: `${current.companyName} replied and now needs human qualification.`
    });
    ok(res, row);
  })
);

aiSalesRouter.post(
  "/prospects/:id/push-to-crm",
  asyncHandler(async (req, res) => {
    const synced = syncAiSalesProspectToCrm(String(req.params.id), req.user?.id);
    if (!synced) throw new ApiError(404, "not_found", "Prospect not found.");
    ok(res, synced);
  })
);

aiSalesRouter.get(
  "/activities",
  asyncHandler(async (_req, res) =>
    ok(res, {
      rows: db.aiSalesActivities,
      total: db.aiSalesActivities.length,
      page: 1,
      pageSize: db.aiSalesActivities.length
    })
  )
);
