import { Router } from "express";
import { ok } from "../core/http.js";

export const docsRouter = Router();

docsRouter.get("/", (_req, res) => {
  ok(res, {
    name: "Prootech Internal Enterprise OS API",
    version: "v1",
    responseEnvelope: {
      success: true,
      data: {},
      meta: {}
    },
    auth: ["POST /api/v1/auth/login", "POST /api/v1/auth/refresh", "POST /api/v1/auth/logout", "GET /api/v1/auth/me"],
    usersAndRoles: ["GET/POST /api/v1/users", "GET/POST /api/v1/roles", "PATCH /api/v1/users/:id", "PATCH /api/v1/roles/:id"],
    platform: [
      "GET/POST /api/v1/platform/organizations",
      "GET/POST /api/v1/platform/legal-entities",
      "GET/POST /api/v1/platform/business-units",
      "GET/POST /api/v1/platform/departments",
      "GET/POST /api/v1/platform/settings",
      "GET/POST /api/v1/platform/feature-flags"
    ],
    crm: [
      "GET/POST /api/v1/leads",
      "GET/POST /api/v1/accounts",
      "GET/POST /api/v1/contacts",
      "GET/POST /api/v1/opportunities",
      "POST /api/v1/opportunities/:id/change-stage",
      "POST /api/v1/opportunities/:id/convert-to-project"
    ],
    proposalsAndContracts: [
      "GET/POST /api/v1/proposals",
      "POST /api/v1/proposals/:id/submit",
      "POST /api/v1/proposals/:id/approve",
      "GET/POST /api/v1/contracts"
    ],
    projects: [
      "GET/POST /api/v1/projects",
      "POST /api/v1/projects/:id/milestones",
      "POST /api/v1/projects/:id/deliverables",
      "GET/POST /api/v1/timesheets"
    ],
    finance: [
      "GET/POST /api/v1/invoices",
      "POST /api/v1/invoices/:id/issue",
      "GET/POST /api/v1/payments",
      "POST /api/v1/webhooks/payments/:provider",
      "GET /api/v1/finance/ar-aging",
      "GET /api/v1/finance/revenue-snapshots",
      "GET/POST /api/v1/expenses"
    ],
    hr: [
      "GET/POST /api/v1/employees",
      "GET/POST /api/v1/employment-contracts",
      "GET/POST /api/v1/leave-requests",
      "PATCH /api/v1/leave-requests/:id/approve",
      "PATCH /api/v1/leave-requests/:id/reject",
      "GET/POST /api/v1/payroll-runs",
      "POST /api/v1/payroll-runs/:id/calculate",
      "POST /api/v1/payroll-runs/:id/approve",
      "POST /api/v1/payroll-runs/:id/finalize",
      "GET/POST /api/v1/payslips"
    ],
    partners: [
      "GET/POST /api/v1/partners",
      "POST /api/v1/partner-agreements",
      "POST /api/v1/partner-share-rules",
      "POST /api/v1/partner-settlements/preview",
      "POST /api/v1/partner-settlements/:id/approve",
      "POST /api/v1/partner-settlements/:id/mark-paid"
    ],
    analytics: [
      "GET /api/v1/dashboard/executive",
      "GET /api/v1/dashboard/sales",
      "GET /api/v1/dashboard/finance",
      "GET /api/v1/dashboard/hr",
      "GET /api/v1/dashboard/projects"
    ],
    ai: [
      "POST /api/v1/ai/chat",
      "POST /api/v1/ai/explain-metric",
      "POST /api/v1/ai/draft-email",
      "POST /api/v1/ai/next-best-action"
    ],
    aiSales: [
      "GET /api/v1/ai-sales/overview",
      "GET/POST /api/v1/ai-sales/campaigns",
      "POST /api/v1/ai-sales/campaigns/:id/generate-prospects",
      "GET /api/v1/ai-sales/prospects",
      "POST /api/v1/ai-sales/prospects/:id/approve",
      "POST /api/v1/ai-sales/prospects/:id/reject",
      "POST /api/v1/ai-sales/prospects/:id/send",
      "POST /api/v1/ai-sales/prospects/:id/simulate-reply",
      "POST /api/v1/ai-sales/prospects/:id/push-to-crm",
      "GET /api/v1/ai-sales/activities"
    ],
    domainAliases: "Domain-prefixed routes such as /api/v1/crm/leads and /api/v1/analytics/dashboard/executive remain available for modular clients.",
    guarantees: [
      "organization scoped",
      "RBAC protected",
      "write actions audited",
      "AI tools are permission aware",
      "Mongo schemas include lifecycle status and indexes for common filters"
    ]
  });
});
