import { Router } from "express";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok, ApiError } from "../core/http.js";
import { createRecord, db, updateRecord } from "../data/demo-store.js";
import { crudRouter } from "./generic-crud.js";

export const crmRouter = Router();

crmRouter.use("/leads", crudRouter("leads", "crm:read", "crm:write"));
crmRouter.use("/accounts", crudRouter("accounts", "crm:read", "crm:write"));
crmRouter.use("/contacts", crudRouter("contacts", "crm:read", "crm:write"));
crmRouter.use("/opportunities", crudRouter("opportunities", "crm:read", "crm:write"));
crmRouter.use("/activities", crudRouter("activities", "crm:read", "crm:write"));
crmRouter.use("/proposals", crudRouter("proposals", "crm:read", "crm:write"));
crmRouter.use("/contracts", crudRouter("contracts", "crm:read", "crm:write"));

crmRouter.patch(
  "/opportunities/:id/stage",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const row = updateRecord("opportunities", String(req.params.id), { stage: req.body.stage });
    if (!row) throw new ApiError(404, "not_found", "Opportunity not found.");
    ok(res, row);
  })
);

crmRouter.post(
  "/opportunities/:id/convert-to-project",
  requireAuth,
  requirePermission("projects:write"),
  asyncHandler(async (req, res) => {
    const opportunity = db.opportunities.find((item) => item.id === String(req.params.id));
    if (!opportunity) throw new ApiError(404, "not_found", "Opportunity not found.");
    const project = createRecord("projects", {
      businessUnitId: opportunity.businessUnitId,
      accountId: opportunity.accountId,
      opportunityId: opportunity.id,
      name: req.body.name ?? opportunity.title,
      type: req.body.type ?? "project",
      status: "planned",
      projectManagerId: req.user?.id,
      budgetAmount: opportunity.estimatedAmount,
      currencyCode: opportunity.currencyCode,
      billingModel: req.body.billingModel ?? "fixed",
      healthStatus: "green"
    });
    ok(res, project);
  })
);
