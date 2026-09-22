import { Router } from "express";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok, ApiError } from "../core/http.js";
import { createRecord, updateRecord, deleteRecord, db } from "../data/demo-store.js";
import { crudRouter } from "./generic-crud.js";

export const platformRouter = Router();
platformRouter.use("/organizations", crudRouter("organizations", "platform:admin", "platform:admin"));
platformRouter.use("/legal-entities", crudRouter("legalEntities", "platform:admin", "platform:admin"));
platformRouter.use("/business-units", crudRouter("businessUnits", "platform:admin", "platform:admin"));
platformRouter.use("/departments", crudRouter("departments", "platform:admin", "platform:admin"));
platformRouter.use("/settings", crudRouter("settings", "platform:admin", "platform:admin"));
platformRouter.use("/feature-flags", crudRouter("featureFlags", "platform:admin", "platform:admin"));
platformRouter.use("/users", crudRouter("users", "users:read", "users:write"));
platformRouter.use("/roles", crudRouter("roles", "users:read", "users:write"));
platformRouter.use("/notifications", crudRouter("notifications", "users:read", "users:write"));
platformRouter.use("/files", crudRouter("files", "users:read", "users:write"));

export const projectsRouter = Router();

// ── Project Hub: full detail ──────────────────────────────────────────────────
projectsRouter.get(
  "/:id/hub",
  requireAuth,
  requirePermission("projects:read"),
  asyncHandler(async (req, res) => {
    const project = db.projects.find((p) => p.id === String(req.params.id));
    if (!project) throw new ApiError(404, "not_found", "Project not found.");
    const links = db.projectLinks.filter((l) => l.projectId === project.id);
    const files = db.projectFiles.filter((f) => f.projectId === project.id);
    const milestones = db.milestones.filter((m) => m.projectId === project.id);
    const deliverables = db.deliverables.filter((d) => d.projectId === project.id);
    const timesheets = db.timesheets.filter((t) => t.projectId === project.id);
    const totalHours = timesheets.reduce((sum, t) => sum + Number(t.hours ?? 0), 0);
    const billableHours = timesheets.filter((t) => t.billable).reduce((sum, t) => sum + Number(t.hours ?? 0), 0);
    ok(res, { project, links, files, milestones, deliverables, totalHours, billableHours });
  })
);

// ── Project Links CRUD ────────────────────────────────────────────────────────
projectsRouter.get(
  "/:id/links",
  requireAuth,
  requirePermission("projects:read"),
  asyncHandler(async (req, res) => {
    const links = db.projectLinks.filter((l) => l.projectId === String(req.params.id));
    ok(res, { rows: links, total: links.length });
  })
);

projectsRouter.post(
  "/:id/links",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    const project = db.projects.find((p) => p.id === String(req.params.id));
    if (!project) throw new ApiError(404, "not_found", "Project not found.");
    const row = createRecord("projectLinks", { ...req.body, projectId: String(req.params.id) }, req.user?.id);
    ok(res, row);
  })
);

projectsRouter.patch(
  "/:id/links/:linkId",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    const row = updateRecord("projectLinks", String(req.params.linkId), req.body);
    if (!row) throw new ApiError(404, "not_found", "Link not found.");
    ok(res, row);
  })
);

projectsRouter.delete(
  "/:id/links/:linkId",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    const deleted = deleteRecord("projectLinks", String(req.params.linkId));
    if (!deleted) throw new ApiError(404, "not_found", "Link not found.");
    ok(res, { deleted: true, id: req.params.linkId });
  })
);

// ── Project Files CRUD ────────────────────────────────────────────────────────
projectsRouter.get(
  "/:id/files",
  requireAuth,
  requirePermission("projects:read"),
  asyncHandler(async (req, res) => {
    const files = db.projectFiles.filter((f) => f.projectId === String(req.params.id));
    ok(res, { rows: files, total: files.length });
  })
);

projectsRouter.post(
  "/:id/files",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    const project = db.projects.find((p) => p.id === String(req.params.id));
    if (!project) throw new ApiError(404, "not_found", "Project not found.");
    const row = createRecord("projectFiles", { ...req.body, projectId: String(req.params.id) }, req.user?.id);
    ok(res, row);
  })
);

projectsRouter.delete(
  "/:id/files/:fileId",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    const deleted = deleteRecord("projectFiles", String(req.params.fileId));
    if (!deleted) throw new ApiError(404, "not_found", "File not found.");
    ok(res, { deleted: true, id: req.params.fileId });
  })
);

// ── Nested sub-resource routes ─────────────────────────────────────────────────
projectsRouter.post(
  "/:id/milestones",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    ok(res, createRecord("milestones", { ...req.body, projectId: String(req.params.id) }, req.user?.id));
  })
);
projectsRouter.post(
  "/:id/deliverables",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    ok(res, createRecord("deliverables", { ...req.body, projectId: String(req.params.id) }, req.user?.id));
  })
);
projectsRouter.use("/milestones", crudRouter("milestones", "projects:read", "projects:write"));
projectsRouter.use("/deliverables", crudRouter("deliverables", "projects:read", "projects:write"));
projectsRouter.use("/timesheets", crudRouter("timesheets", "projects:read", "projects:write"));
projectsRouter.use("/", crudRouter("projects", "projects:read", "projects:write"));

export const financeRouter = Router();
financeRouter.use("/invoices", crudRouter("invoices", "finance:read", "finance:write"));
financeRouter.use("/invoice-lines", crudRouter("invoiceLines", "finance:read", "finance:write"));
financeRouter.use("/payments", crudRouter("payments", "finance:read", "finance:write"));
financeRouter.use("/expenses", crudRouter("expenses", "finance:read", "finance:write"));
financeRouter.use("/revenue-snapshots", crudRouter("revenueSnapshots", "finance:read", "finance:write"));

export const hrRouter = Router();
hrRouter.use("/employees", crudRouter("employees", "hr:read", "hr:write"));
hrRouter.use("/employment-contracts", crudRouter("employmentContracts", "hr:read", "hr:write"));
hrRouter.use("/leave-requests", crudRouter("leaveRequests", "hr:read", "hr:write"));
hrRouter.use("/payroll-runs", crudRouter("payrollRuns", "hr:payroll", "hr:payroll"));
hrRouter.use("/payroll-items", crudRouter("payrollItems", "hr:payroll", "hr:payroll"));
hrRouter.use("/payslips", crudRouter("payslips", "hr:payroll", "hr:payroll"));

hrRouter.patch(
  "/leave-requests/:id/approve",
  requireAuth,
  requirePermission("hr:write"),
  asyncHandler(async (req, res) => {
    const row = updateRecord("leaveRequests", String(req.params.id), { status: "approved", approvedBy: req.user?.id });
    if (!row) throw new ApiError(404, "not_found", "Leave request not found.");
    ok(res, row);
  })
);

hrRouter.patch(
  "/leave-requests/:id/reject",
  requireAuth,
  requirePermission("hr:write"),
  asyncHandler(async (req, res) => {
    const row = updateRecord("leaveRequests", String(req.params.id), { status: "rejected", approvedBy: req.user?.id });
    if (!row) throw new ApiError(404, "not_found", "Leave request not found.");
    ok(res, row);
  })
);

hrRouter.post(
  "/payroll-runs/:id/calculate",
  requireAuth,
  requirePermission("hr:payroll"),
  asyncHandler(async (req, res) => {
    const run = db.payrollRuns.find((r) => r.id === String(req.params.id));
    if (!run) throw new ApiError(404, "not_found", "Payroll run not found.");
    const items = db.payrollItems.filter((item) => item.payrollRunId === run.id);
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    const updatedItems = items.map((item) => {
      const gross = Number(item.baseSalary ?? 0) + Number(item.bonuses ?? 0) + Number(item.commissions ?? 0);
      const deductions = Number(item.deductions ?? 0);
      const net = gross - deductions;
      totalGross += gross;
      totalDeductions += deductions;
      totalNet += net;
      return updateRecord("payrollItems", String(item.id), { netPay: net, varianceFlag: Math.abs(net - Number(item.netPay ?? 0)) > 200 ? "review" : "none" });
    });
    const updatedRun = updateRecord("payrollRuns", String(run.id), {
      status: "calculated",
      totalGross,
      totalDeductions,
      totalNet,
      employeesCount: items.length
    });
    ok(res, { run: updatedRun, items: updatedItems });
  })
);

hrRouter.post(
  "/payroll-runs/:id/approve",
  requireAuth,
  requirePermission("hr:payroll"),
  asyncHandler(async (req, res) => {
    const row = updateRecord("payrollRuns", String(req.params.id), { status: "approved", approvedBy: req.user?.id, approvedAt: new Date().toISOString() });
    if (!row) throw new ApiError(404, "not_found", "Payroll run not found.");
    ok(res, row);
  })
);

hrRouter.post(
  "/payroll-runs/:id/finalize",
  requireAuth,
  requirePermission("hr:payroll"),
  asyncHandler(async (req, res) => {
    const run = db.payrollRuns.find((r) => r.id === String(req.params.id));
    if (!run) throw new ApiError(404, "not_found", "Payroll run not found.");
    if (run.status !== "approved") throw new ApiError(400, "invalid_state", "Payroll run must be approved before finalizing.");
    const updatedRun = updateRecord("payrollRuns", String(run.id), { status: "finalized", finalizedAt: new Date().toISOString() });
    const employees = db.employees.filter((e) => ["active"].includes(String(e.status)));
    const items = db.payrollItems.filter((item) => item.payrollRunId === run.id);
    items.forEach((item) => {
      const emp = employees.find((e) => e.id === item.employeeId);
      if (emp) {
        createRecord("payslips", {
          payrollRunId: run.id,
          employeeId: item.employeeId,
          employeeName: emp.fullName,
          netPay: item.netPay,
          currencyCode: run.currencyCode,
          issuedAt: new Date().toISOString(),
          status: "issued"
        }, req.user?.id);
      }
    });
    ok(res, updatedRun);
  })
);

export const partnersRouter = Router();
partnersRouter.use("/agreements", crudRouter("partnerAgreements", "partners:read", "partners:write"));
partnersRouter.use("/share-rules", crudRouter("partnerShareRules", "partners:read", "partners:write"));
partnersRouter.use("/settlements", crudRouter("partnerSettlements", "partners:read", "partners:write"));
partnersRouter.use("/", crudRouter("partners", "partners:read", "partners:write"));

export const auditRouter = Router();
auditRouter.use("/", crudRouter("auditLogs", "audit:read"));
