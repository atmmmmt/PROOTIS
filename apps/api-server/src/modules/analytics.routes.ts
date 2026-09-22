import { Router } from "express";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok } from "../core/http.js";
import { db, executiveDashboard } from "../data/demo-store.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth, requirePermission("analytics:read"));

analyticsRouter.get(
  "/dashboard/executive",
  asyncHandler(async (_req, res) => ok(res, executiveDashboard))
);

analyticsRouter.get(
  "/dashboard/sales",
  asyncHandler(async (_req, res) =>
    ok(res, {
      leadsBySource: [
        { source: "Website", count: 18 },
        { source: "Partner", count: 9 },
        { source: "Outbound", count: 6 }
      ],
      pipeline: executiveDashboard.pipeline,
      opportunities: db.opportunities
    })
  )
);

analyticsRouter.get(
  "/dashboard/finance",
  asyncHandler(async (_req, res) =>
    ok(res, {
      arAging: executiveDashboard.arAging,
      invoices: db.invoices,
      payments: db.payments,
      revenueSnapshots: db.revenueSnapshots
    })
  )
);

analyticsRouter.get(
  "/dashboard/hr",
  asyncHandler(async (_req, res) =>
    ok(res, {
      headcount: db.employees.length,
      leaveRequests: db.leaveRequests,
      payrollRuns: db.payrollRuns,
      contractExpiries: db.employmentContracts
    })
  )
);

analyticsRouter.get(
  "/dashboard/projects",
  asyncHandler(async (_req, res) =>
    ok(res, {
      projects: db.projects,
      milestones: db.milestones,
      deliverables: db.deliverables,
      timesheets: db.timesheets
    })
  )
);
