import { Router } from "express";
import { requireAuth, requirePermission } from "../core/auth.js";
import { ApiError, asyncHandler, ok } from "../core/http.js";
import { createOwnership, ensureOwnershipDefaults, ownershipDb, updateOwnership } from "../data/ownership-store.js";

export const personalContributionsRouter = Router();
personalContributionsRouter.use(requireAuth);

function whole(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function cleanMonth(value: unknown) {
  const month = String(value ?? currentMonth());
  if (!/^\d{4}-\d{2}$/.test(month)) throw new ApiError(400, "invalid_month", "Month must use YYYY-MM format.");
  return month;
}

function setting() {
  ensureOwnershipDefaults();
  return ownershipDb.settings.find((item) => item.key === "personalSalaryContribution" && item.status !== "archived");
}

function contributionRate() {
  return Number(setting()?.value?.ratePercent ?? 10);
}

function contributorName(id: string) {
  return ownershipDb.beneficiaries.find((item) => item.id === id)?.name ?? id;
}

function eligibleContributors() {
  return ownershipDb.beneficiaries.filter((item) =>
    item.status !== "archived" && !["office", "work_pool", "product_pool"].includes(String(item.beneficiaryType))
  );
}

function buildOverview(monthRaw?: unknown) {
  ensureOwnershipDefaults();
  const month = cleanMonth(monthRaw);
  const records = ownershipDb.personalContributions.filter((item) => item.status !== "reversed" && item.status !== "archived");
  const rows = records
    .filter((item) => item.salaryMonth === month)
    .sort((a, b) => String(b.salaryReceivedAt ?? b.createdAt).localeCompare(String(a.salaryReceivedAt ?? a.createdAt)));

  const totalsByCurrency = rows.reduce((acc: Record<string, any>, row) => {
    const currency = String(row.currencyCode ?? "USD");
    const current = acc[currency] ?? { salaryAmount: 0, contributionAmount: 0, paidAmount: 0, remainingAmount: 0 };
    current.salaryAmount += whole(row.salaryAmount);
    current.contributionAmount += whole(row.contributionAmount);
    current.paidAmount += whole(row.paidAmount);
    current.remainingAmount += whole(row.remainingAmount);
    acc[currency] = current;
    return acc;
  }, {});

  const carriedOutstandingByCurrency = records
    .filter((item) => String(item.salaryMonth ?? "") < month && whole(item.remainingAmount) > 0)
    .reduce((acc: Record<string, number>, row) => {
      const currency = String(row.currencyCode ?? "USD");
      acc[currency] = (acc[currency] ?? 0) + whole(row.remainingAmount);
      return acc;
    }, {});

  return {
    month,
    setting: setting(),
    ratePercent: contributionRate(),
    targetBeneficiaryId: "ben_office",
    targetBeneficiaryName: contributorName("ben_office"),
    contributors: eligibleContributors(),
    rows,
    totalsByCurrency,
    carriedOutstandingByCurrency
  };
}

personalContributionsRouter.get(
  "/overview",
  requirePermission("finance:read"),
  asyncHandler(async (req, res) => ok(res, buildOverview(req.query.month)))
);

personalContributionsRouter.patch(
  "/settings",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const ratePercent = Number(req.body?.ratePercent);
    if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
      throw new ApiError(400, "invalid_rate", "Contribution percentage must be between 0 and 100.");
    }
    const row = setting();
    if (!row) throw new ApiError(404, "setting_not_found", "Personal contribution setting was not found.");
    const updated = updateOwnership("settings", String(row.id), {
      value: { ratePercent, targetBeneficiaryId: "ben_office" }
    }, req.user?.id);
    ok(res, updated);
  })
);

personalContributionsRouter.post(
  "/",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    ensureOwnershipDefaults();
    const contributorBeneficiaryId = String(req.body?.contributorBeneficiaryId ?? "");
    const contributor = eligibleContributors().find((item) => item.id === contributorBeneficiaryId);
    if (!contributor) throw new ApiError(400, "invalid_contributor", "Choose a valid contributor.");

    const salaryAmount = whole(req.body?.salaryAmount);
    if (salaryAmount <= 0) throw new ApiError(400, "invalid_salary", "Salary amount must be greater than zero.");
    const ratePercent = contributionRate();
    const contributionAmount = Math.round(salaryAmount * ratePercent / 100);
    const salaryMonth = cleanMonth(req.body?.salaryMonth);
    const salaryReceivedAt = req.body?.salaryReceivedAt
      ? new Date(String(req.body.salaryReceivedAt)).toISOString()
      : new Date().toISOString();

    const row = createOwnership("personalContributions", {
      contributorBeneficiaryId,
      contributorName: contributor.name,
      employerName: String(req.body?.employerName ?? "").trim(),
      salaryMonth,
      salaryReceivedAt,
      salaryAmount,
      ratePercent,
      contributionAmount,
      paidAmount: 0,
      remainingAmount: contributionAmount,
      currencyCode: String(req.body?.currencyCode ?? "USD"),
      targetBeneficiaryId: "ben_office",
      payments: [],
      reference: req.body?.reference,
      note: req.body?.note,
      status: contributionAmount > 0 ? "due" : "paid"
    }, req.user?.id);
    ok(res, row);
  })
);

personalContributionsRouter.post(
  "/:id/pay",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const row = ownershipDb.personalContributions.find((item) => item.id === String(req.params.id) && item.status !== "reversed" && item.status !== "archived");
    if (!row) throw new ApiError(404, "not_found", "Personal contribution was not found.");
    const remaining = Math.max(0, whole(row.remainingAmount));
    if (remaining <= 0) throw new ApiError(400, "already_paid", "This contribution is already paid.");
    const requested = req.body?.amount === undefined ? remaining : Math.max(0, whole(req.body.amount));
    const amount = Math.min(remaining, requested);
    if (amount <= 0) throw new ApiError(400, "invalid_amount", "Payment amount must be greater than zero.");

    const paidAt = req.body?.paidAt ? new Date(String(req.body.paidAt)).toISOString() : new Date().toISOString();
    const newPaid = whole(row.paidAmount) + amount;
    const newRemaining = remaining - amount;
    const payment = {
      id: `pcpay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      amount,
      paidAt,
      paymentMethod: String(req.body?.paymentMethod ?? "cash"),
      note: req.body?.note,
      actorId: req.user?.id
    };
    const updated = updateOwnership("personalContributions", String(row.id), {
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      paidAt: newRemaining <= 0 ? paidAt : row.paidAt,
      paymentMethod: payment.paymentMethod,
      payments: [...(Array.isArray(row.payments) ? row.payments : []), payment],
      status: newRemaining <= 0 ? "paid" : "partially_paid"
    }, req.user?.id);
    ok(res, updated);
  })
);

personalContributionsRouter.post(
  "/:id/reverse",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const row = ownershipDb.personalContributions.find((item) => item.id === String(req.params.id));
    if (!row) throw new ApiError(404, "not_found", "Personal contribution was not found.");
    if (whole(row.paidAmount) > 0) throw new ApiError(400, "payment_exists", "A paid contribution cannot be reversed before its payments are reconciled.");
    const updated = updateOwnership("personalContributions", String(row.id), {
      status: "reversed",
      reversedAt: new Date().toISOString(),
      reversalReason: req.body?.reason
    }, req.user?.id);
    ok(res, updated);
  })
);
