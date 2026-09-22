import { Router } from "express";
import type { UserSession } from "@prootech/shared-types";
import { requireAuth, requirePermission } from "../core/auth.js";
import { ApiError, asyncHandler, ok } from "../core/http.js";
import { db, updateRecord } from "../data/demo-store.js";
import { ownershipDb } from "../data/ownership-store.js";
import {
  createAccessUser,
  createDefaultPartnerAccounts,
  listAccessUsers,
  resetAccessPassword,
  updateAccessUser
} from "../data/user-access.js";

export const accessRouter = Router();
accessRouter.use(requireAuth);

function asNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function monthBounds(monthRaw?: unknown) {
  const fallback = new Date().toISOString().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(String(monthRaw ?? "")) ? String(monthRaw) : fallback;
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    month,
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1))
  };
}

function inRange(value: unknown, start: Date, end: Date) {
  const date = new Date(String(value ?? ""));
  return Number.isFinite(date.getTime()) && date >= start && date < end;
}

function projectAllowed(projectId: string, user?: UserSession) {
  if (!user) return false;
  const scope = user.accessScope ?? {};
  if (scope.canViewAllProjects) return true;
  if ((scope.projectIds ?? []).includes(projectId)) return true;
  const profile = ownershipDb.projectProfiles.find((item) => item.projectId === projectId && item.status !== "archived");
  return Boolean(profile?.departmentId && (scope.departmentIds ?? []).includes(String(profile.departmentId)));
}

function beneficiaryForUser(userId: string) {
  return ownershipDb.beneficiaries.find((item) => item.relatedUserId === userId && item.status !== "archived");
}

function ownFinance(beneficiaryId: string, monthRaw?: unknown) {
  const { month, start, end } = monthBounds(monthRaw);
  const earningsByCurrency: Record<string, number> = {};
  const paidByCurrency: Record<string, number> = {};
  const outstandingByCurrency: Record<string, number> = {};
  const projectBreakdown = new Map<string, { projectId: string; projectName: string; currencyCode: string; earned: number; paid: number; remaining: number }>();

  for (const allocation of ownershipDb.allocations) {
    if (allocation.status === "reversed") continue;
    const line = (allocation.lines ?? []).find((item: any) => item.beneficiaryId === beneficiaryId);
    if (!line) continue;
    const currency = String(allocation.currencyCode ?? "USD");
    const amount = Math.round(asNumber(line.amount));
    const remaining = Math.round(asNumber(line.remainingAmount));
    outstandingByCurrency[currency] = (outstandingByCurrency[currency] ?? 0) + remaining;
    if (inRange(allocation.receivedAt ?? allocation.createdAt, start, end)) {
      earningsByCurrency[currency] = (earningsByCurrency[currency] ?? 0) + amount;
    }
    if (allocation.projectId) {
      const project = db.projects.find((item) => item.id === allocation.projectId);
      const key = `${allocation.projectId}:${currency}`;
      const current = projectBreakdown.get(key) ?? {
        projectId: String(allocation.projectId),
        projectName: String(project?.name ?? allocation.projectId),
        currencyCode: currency,
        earned: 0,
        paid: 0,
        remaining: 0
      };
      current.earned += amount;
      current.remaining += remaining;
      projectBreakdown.set(key, current);
    }
  }

  for (const payout of ownershipDb.payoutEvents) {
    if (payout.status === "reversed" || payout.beneficiaryId !== beneficiaryId) continue;
    const currency = String(payout.currencyCode ?? "USD");
    const amount = Math.round(asNumber(payout.amount));
    if (inRange(payout.paidAt ?? payout.createdAt, start, end)) {
      paidByCurrency[currency] = (paidByCurrency[currency] ?? 0) + amount;
    }
    const allocation = ownershipDb.allocations.find((item) => item.id === payout.allocationId);
    if (allocation?.projectId) {
      const key = `${allocation.projectId}:${currency}`;
      const project = db.projects.find((item) => item.id === allocation.projectId);
      const current = projectBreakdown.get(key) ?? {
        projectId: String(allocation.projectId),
        projectName: String(project?.name ?? allocation.projectId),
        currencyCode: currency,
        earned: 0,
        paid: 0,
        remaining: 0
      };
      current.paid += amount;
      projectBreakdown.set(key, current);
    }
  }

  return {
    month,
    earningsByCurrency,
    paidByCurrency,
    outstandingByCurrency,
    projectBreakdown: [...projectBreakdown.values()].sort((a, b) => b.earned - a.earned)
  };
}

function companyGrowthSnapshot() {
  const activeProjects = db.projects.filter((project) => project.status === "active").length;
  const activeClients = db.accounts.filter((account) => account.status === "active").length;
  const openOpportunities = db.opportunities.filter((opportunity) => !["won", "lost", "closed"].includes(String(opportunity.stage ?? opportunity.status))).length;
  const wonOpportunities = db.opportunities.filter((opportunity) => String(opportunity.stage) === "won").length;

  let socialFollowers = 0;
  let websiteSessions = 0;
  for (const channel of db.growthChannels) {
    const rows = db.growthMetrics
      .filter((metric) => metric.channelId === channel.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const latest = rows[0];
    if (!latest) continue;
    socialFollowers += asNumber(latest.followers);
    websiteSessions += asNumber(latest.sessions);
  }

  return {
    activeProjects,
    totalProjects: db.projects.length,
    activeClients,
    openOpportunities,
    wonOpportunities,
    socialFollowers: Math.round(socialFollowers),
    websiteSessions: Math.round(websiteSessions)
  };
}

accessRouter.get(
  "/accounts",
  requirePermission("users:read"),
  asyncHandler(async (_req, res) => {
    const rows = listAccessUsers();
    ok(res, { rows, total: rows.length });
  })
);

accessRouter.post(
  "/accounts",
  requirePermission("users:write"),
  asyncHandler(async (req, res) => {
    try {
      ok(res, createAccessUser(req.body, req.user?.id));
    } catch (error) {
      throw new ApiError(400, "invalid_account", error instanceof Error ? error.message : "Could not create account.");
    }
  })
);

accessRouter.patch(
  "/accounts/:id",
  requirePermission("users:write"),
  asyncHandler(async (req, res) => {
    try {
      const row = updateAccessUser(String(req.params.id), req.body, req.user?.id);
      if (!row) throw new ApiError(404, "not_found", "User not found.");
      ok(res, row);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, "invalid_account", error instanceof Error ? error.message : "Could not update account.");
    }
  })
);

accessRouter.post(
  "/accounts/:id/reset-password",
  requirePermission("users:write"),
  asyncHandler(async (req, res) => {
    const result = resetAccessPassword(String(req.params.id), req.body?.password ? String(req.body.password) : undefined);
    if (!result) throw new ApiError(404, "not_found", "User not found.");
    ok(res, result);
  })
);

accessRouter.post(
  "/accounts/create-default-partners",
  requirePermission("users:write"),
  asyncHandler(async (req, res) => {
    ok(res, { rows: createDefaultPartnerAccounts(req.user?.id) });
  })
);

accessRouter.get(
  "/portal",
  requirePermission("partner:portal"),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const beneficiary = beneficiaryForUser(user.id);
    if (!beneficiary) throw new ApiError(404, "beneficiary_not_linked", "This account is not linked to a beneficiary yet.");

    const projects = db.projects.filter((project) => projectAllowed(String(project.id), user)).map((project) => {
      const profile = ownershipDb.projectProfiles.find((item) => item.projectId === project.id && item.status !== "archived");
      const base: Record<string, unknown> = {
        id: project.id,
        name: project.name,
        type: project.type,
        status: project.status,
        healthStatus: project.healthStatus,
        startDate: project.startDate,
        endDate: project.endDate,
        departmentId: profile?.departmentId,
        serviceId: profile?.serviceId,
        editableFields: user.accessScope?.editableProjectFields ?? []
      };
      if (user.accessScope?.canViewProjectFinancials) {
        base.budgetAmount = project.budgetAmount;
        base.currencyCode = project.currencyCode;
      }
      return base;
    });

    ok(res, {
      beneficiary: { id: beneficiary.id, name: beneficiary.name, beneficiaryType: beneficiary.beneficiaryType },
      finance: ownFinance(String(beneficiary.id), req.query.month),
      projects,
      growth: user.accessScope?.canViewCompanyGrowth ? companyGrowthSnapshot() : null,
      scope: user.accessScope ?? {}
    });
  })
);

accessRouter.patch(
  "/portal/projects/:projectId",
  requirePermission("partner:portal"),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const projectId = String(req.params.projectId);
    if (!projectAllowed(projectId, user)) throw new ApiError(403, "project_scope_denied", "Project is outside this account's scope.");
    const editable = new Set(user.accessScope?.editableProjectFields ?? []);
    if (!editable.size) throw new ApiError(403, "project_read_only", "This account has read-only project access.");
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(req.body ?? {})) {
      if (editable.has(key as any)) patch[key] = value;
    }
    if (!Object.keys(patch).length) throw new ApiError(400, "no_editable_fields", "No allowed fields were supplied.");
    const row = updateRecord("projects", projectId, patch);
    if (!row) throw new ApiError(404, "not_found", "Project not found.");
    ok(res, row);
  })
);
