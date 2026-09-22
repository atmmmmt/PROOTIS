import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok, ApiError } from "../core/http.js";
import { createRecord, db, executiveDashboard, updateRecord } from "../data/demo-store.js";
import { crudRouter } from "./generic-crud.js";
import { env } from "../config/env.js";

export const specAliasRouter = Router();

specAliasRouter.use("/users", crudRouter("users", "users:read", "users:write"));
specAliasRouter.use("/roles", crudRouter("roles", "users:read", "users:write"));

specAliasRouter.use("/leads", crudRouter("leads", "crm:read", "crm:write"));
specAliasRouter.use("/accounts", crudRouter("accounts", "crm:read", "crm:write"));
specAliasRouter.use("/contacts", crudRouter("contacts", "crm:read", "crm:write"));
specAliasRouter.use("/proposals", crudRouter("proposals", "crm:read", "crm:write"));
specAliasRouter.use("/contracts", crudRouter("contracts", "crm:read", "crm:write"));

specAliasRouter.use("/invoices", crudRouter("invoices", "finance:read", "finance:write"));
specAliasRouter.use("/payments", crudRouter("payments", "finance:read", "finance:write"));
specAliasRouter.use("/expenses", crudRouter("expenses", "finance:read", "finance:write"));

specAliasRouter.use("/employees", crudRouter("employees", "hr:read", "hr:write"));
specAliasRouter.use("/employment-contracts", crudRouter("employmentContracts", "hr:read", "hr:write"));
specAliasRouter.use("/leave-requests", crudRouter("leaveRequests", "hr:read", "hr:write"));
specAliasRouter.use("/payroll-runs", crudRouter("payrollRuns", "hr:payroll", "hr:payroll"));
specAliasRouter.use("/payslips", crudRouter("payslips", "hr:payroll", "hr:payroll"));

specAliasRouter.use("/partner-agreements", crudRouter("partnerAgreements", "partners:read", "partners:write"));
specAliasRouter.use("/partner-share-rules", crudRouter("partnerShareRules", "partners:read", "partners:write"));
specAliasRouter.use("/partner-settlements", crudRouter("partnerSettlements", "partners:read", "partners:write"));
specAliasRouter.use("/milestones", crudRouter("milestones", "projects:read", "projects:write"));
specAliasRouter.use("/deliverables", crudRouter("deliverables", "projects:read", "projects:write"));

specAliasRouter.get("/dashboard/executive", requireAuth, requirePermission("analytics:read"), asyncHandler(async (_req, res) => ok(res, executiveDashboard)));
specAliasRouter.get("/dashboard/sales", requireAuth, requirePermission("analytics:read"), asyncHandler(async (_req, res) => ok(res, { pipeline: executiveDashboard.pipeline, opportunities: db.opportunities })));
specAliasRouter.get("/dashboard/finance", requireAuth, requirePermission("analytics:read"), asyncHandler(async (_req, res) => ok(res, { arAging: executiveDashboard.arAging, invoices: db.invoices })));
specAliasRouter.get("/dashboard/hr", requireAuth, requirePermission("analytics:read"), asyncHandler(async (_req, res) => ok(res, { headcount: db.employees.length, payrollRuns: db.payrollRuns })));
specAliasRouter.get("/dashboard/projects", requireAuth, requirePermission("analytics:read"), asyncHandler(async (_req, res) => ok(res, { projects: db.projects, milestones: db.milestones })));

specAliasRouter.get("/finance/ar-aging", requireAuth, requirePermission("finance:read"), asyncHandler(async (_req, res) => ok(res, executiveDashboard.arAging)));
specAliasRouter.get("/finance/revenue-snapshots", requireAuth, requirePermission("finance:read"), asyncHandler(async (_req, res) => ok(res, db.revenueSnapshots)));
specAliasRouter.post(
  "/webhooks/payments/:provider",
  asyncHandler(async (req, res) => {
    const signature = req.headers["x-webhook-signature"] as string | undefined;
    if (signature) {
      const payload = JSON.stringify(req.body);
      const expected = createHmac("sha256", env.WEBHOOK_PAYMENT_SECRET).update(payload).digest("hex");
      const expectedBuf = Buffer.from(`sha256=${expected}`);
      const receivedBuf = Buffer.from(signature);
      const isValid = expectedBuf.length === receivedBuf.length && timingSafeEqual(expectedBuf, receivedBuf);
      if (!isValid) throw new ApiError(401, "invalid_signature", "Webhook signature verification failed.");
    }

    const idempotencyKey = String(req.headers["idempotency-key"] ?? req.body.idempotencyKey ?? "");
    if (idempotencyKey) {
      const existing = db.payments.find((p) => p.idempotencyKey === idempotencyKey);
      if (existing) {
        return ok(res, { received: true, duplicate: true, payment: existing });
      }
    }

    ok(res, {
      received: true,
      provider: req.params.provider,
      idempotencyKey: idempotencyKey || null
    });
  })
);

specAliasRouter.use("/timesheets", crudRouter("timesheets", "projects:read", "projects:write"));

specAliasRouter.use("/opportunities", crudRouter("opportunities", "crm:read", "crm:write"));

specAliasRouter.post(
  "/opportunities/:id/change-stage",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const row = updateRecord("opportunities", String(req.params.id), { stage: req.body.stage });
    if (!row) throw new ApiError(404, "not_found", "Opportunity not found.");
    ok(res, row);
  })
);

specAliasRouter.post(
  "/opportunities/:id/convert-to-project",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    const opportunity = db.opportunities.find((item) => item.id === String(req.params.id));
    if (!opportunity) throw new ApiError(404, "not_found", "Opportunity not found.");
    ok(
      res,
      createRecord("projects", {
        businessUnitId: opportunity.businessUnitId,
        accountId: opportunity.accountId,
        opportunityId: opportunity.id,
        name: req.body.name ?? opportunity.title,
        type: "project",
        status: "planned",
        projectManagerId: req.user?.id,
        budgetAmount: opportunity.estimatedAmount,
        currencyCode: opportunity.currencyCode,
        billingModel: req.body.billingModel ?? "fixed",
        healthStatus: "green"
      })
    );
  })
);

specAliasRouter.post("/proposals/:id/submit", requireAuth, requirePermission("crm:write"), asyncHandler(async (req, res) => ok(res, updateRecord("proposals", String(req.params.id), { approvalStatus: "submitted" }))));
specAliasRouter.post("/proposals/:id/approve", requireAuth, requirePermission("crm:write"), asyncHandler(async (req, res) => ok(res, updateRecord("proposals", String(req.params.id), { approvalStatus: "approved" }))));
specAliasRouter.post("/invoices/:id/issue", requireAuth, requirePermission("finance:write"), asyncHandler(async (req, res) => ok(res, updateRecord("invoices", String(req.params.id), { status: "issued" }))));
specAliasRouter.patch("/leave-requests/:id/approve", requireAuth, requirePermission("hr:write"), asyncHandler(async (req, res) => ok(res, updateRecord("leaveRequests", String(req.params.id), { status: "approved", approvedBy: req.user?.id }))));
specAliasRouter.patch("/leave-requests/:id/reject", requireAuth, requirePermission("hr:write"), asyncHandler(async (req, res) => ok(res, updateRecord("leaveRequests", String(req.params.id), { status: "rejected", approvedBy: req.user?.id }))));
specAliasRouter.post("/payroll-runs/:id/calculate", requireAuth, requirePermission("hr:payroll"), asyncHandler(async (req, res) => ok(res, updateRecord("payrollRuns", String(req.params.id), { status: "calculated" }))));
specAliasRouter.post("/payroll-runs/:id/approve", requireAuth, requirePermission("hr:payroll"), asyncHandler(async (req, res) => ok(res, updateRecord("payrollRuns", String(req.params.id), { status: "approved" }))));
specAliasRouter.post("/payroll-runs/:id/finalize", requireAuth, requirePermission("hr:payroll"), asyncHandler(async (req, res) => ok(res, updateRecord("payrollRuns", String(req.params.id), { status: "finalized" }))));
specAliasRouter.post("/partner-settlements/preview", requireAuth, requirePermission("partners:write"), asyncHandler(async (_req, res) => ok(res, db.partnerSettlements[0])));
specAliasRouter.post("/partner-settlements/:id/approve", requireAuth, requirePermission("partners:write"), asyncHandler(async (req, res) => ok(res, updateRecord("partnerSettlements", String(req.params.id), { status: "approved" }))));
specAliasRouter.post("/partner-settlements/:id/mark-paid", requireAuth, requirePermission("partners:write"), asyncHandler(async (req, res) => ok(res, updateRecord("partnerSettlements", String(req.params.id), { status: "paid" }))));
