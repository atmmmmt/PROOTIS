import { Router } from "express";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok, ApiError } from "../core/http.js";
import { db } from "../data/demo-store.js";
import {
  createOwnership,
  deleteOwnership,
  ensureOwnershipDefaults,
  listOwnership,
  ownershipDb,
  updateOwnership
} from "../data/ownership-store.js";

export const ownershipRouter = Router();
ownershipRouter.use(requireAuth);

type OwnershipName = keyof typeof ownershipDb;

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rounded(value: unknown) {
  return Math.round(numberValue(value));
}

function monthBounds(monthRaw?: unknown) {
  const fallback = new Date().toISOString().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(String(monthRaw ?? "")) ? String(monthRaw) : fallback;
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { month, start, end };
}

function within(dateValue: unknown, start: Date, end: Date) {
  const date = new Date(String(dateValue ?? ""));
  return Number.isFinite(date.getTime()) && date >= start && date < end;
}

function before(dateValue: unknown, start: Date) {
  const date = new Date(String(dateValue ?? ""));
  return Number.isFinite(date.getTime()) && date < start;
}

function activeRows(name: OwnershipName) {
  return listOwnership(name).filter((row) => row.status !== "archived" && row.status !== "inactive");
}

function validateTemplate(payload: Record<string, any>) {
  const rules = Array.isArray(payload.rules) ? payload.rules : [];
  if (!rules.length) throw new ApiError(400, "invalid_template", "Distribution template must contain at least one rule.");
  const remainingRules = rules.filter((rule) => rule.kind === "remaining");
  if (remainingRules.length > 1) throw new ApiError(400, "invalid_template", "Only one remaining rule is allowed.");
  let poolPercent = 0;
  for (const rule of rules) {
    if (!rule.beneficiaryId) throw new ApiError(400, "invalid_template", "Every rule must have a beneficiary.");
    if (!["percent", "fixed", "remaining"].includes(String(rule.kind))) throw new ApiError(400, "invalid_template", "Unsupported rule type.");
    if (rule.kind === "percent") {
      const value = numberValue(rule.value, -1);
      if (value < 0 || value > 100) throw new ApiError(400, "invalid_template", "Percentage must be between 0 and 100.");
      if ((rule.applyTo ?? "pool") === "pool") poolPercent += value;
    }
    if (rule.kind === "fixed" && numberValue(rule.value, -1) < 0) throw new ApiError(400, "invalid_template", "Fixed amount cannot be negative.");
  }
  if (poolPercent > 100) throw new ApiError(400, "invalid_template", "Pool-based percentages cannot exceed 100%.");
}

function registerConfigCrud(path: string, name: OwnershipName) {
  ownershipRouter.get(
    path,
    requirePermission("finance:read"),
    asyncHandler(async (_req, res) => {
      const rows = listOwnership(name);
      ok(res, { rows, total: rows.length, page: 1, pageSize: rows.length || 25 });
    })
  );
  ownershipRouter.post(
    path,
    requirePermission("finance:write"),
    asyncHandler(async (req, res) => ok(res, createOwnership(name, req.body, req.user?.id)))
  );
  ownershipRouter.patch(
    `${path}/:id`,
    requirePermission("finance:write"),
    asyncHandler(async (req, res) => {
      const row = updateOwnership(name, String(req.params.id), req.body, req.user?.id);
      if (!row) throw new ApiError(404, "not_found", "Record not found.");
      ok(res, row);
    })
  );
  ownershipRouter.delete(
    `${path}/:id`,
    requirePermission("finance:write"),
    asyncHandler(async (req, res) => {
      const row = updateOwnership(name, String(req.params.id), { status: "archived" }, req.user?.id);
      if (!row) throw new ApiError(404, "not_found", "Record not found.");
      ok(res, { archived: true, id: req.params.id });
    })
  );
}

registerConfigCrud("/beneficiaries", "beneficiaries");
registerConfigCrud("/structure", "serviceCatalog");
registerConfigCrud("/saas-products", "saasProducts");
registerConfigCrud("/saas-subscriptions", "saasSubscriptions");

ownershipRouter.get(
  "/templates",
  requirePermission("finance:read"),
  asyncHandler(async (_req, res) => {
    const rows = listOwnership("templates");
    ok(res, { rows, total: rows.length, page: 1, pageSize: rows.length || 25 });
  })
);

ownershipRouter.post(
  "/templates",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    validateTemplate(req.body);
    const row = createOwnership("templates", {
      ...req.body,
      version: 1,
      roundingMode: req.body.roundingMode ?? "nearest",
      expenseBasis: req.body.expenseBasis ?? "gross"
    }, req.user?.id);
    ok(res, row);
  })
);

ownershipRouter.patch(
  "/templates/:id",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const existing = ownershipDb.templates.find((item) => item.id === String(req.params.id));
    if (!existing) throw new ApiError(404, "not_found", "Template not found.");
    const merged = { ...existing, ...req.body };
    validateTemplate(merged);
    const row = updateOwnership("templates", String(req.params.id), {
      ...req.body,
      version: numberValue(existing.version, 1) + 1
    }, req.user?.id);
    ok(res, row);
  })
);

ownershipRouter.delete(
  "/templates/:id",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const row = updateOwnership("templates", String(req.params.id), { status: "archived" }, req.user?.id);
    if (!row) throw new ApiError(404, "not_found", "Template not found.");
    ok(res, { archived: true, id: req.params.id });
  })
);

ownershipRouter.post(
  "/projects/:projectId/profile",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const projectId = String(req.params.projectId);
    if (!db.projects.some((project) => project.id === projectId)) throw new ApiError(404, "not_found", "Project not found.");
    const existing = ownershipDb.projectProfiles.find((profile) => profile.projectId === projectId);
    const row = existing
      ? updateOwnership("projectProfiles", existing.id, { ...req.body, projectId }, req.user?.id)
      : createOwnership("projectProfiles", { ...req.body, projectId }, req.user?.id);
    ok(res, row);
  })
);

function resolveTemplate(input: { templateId?: string; projectId?: string; subscriptionId?: string }) {
  const templates = activeRows("templates");
  if (input.templateId) {
    const explicit = templates.find((template) => template.id === input.templateId);
    if (explicit) return explicit;
  }

  if (input.subscriptionId) {
    const subscription = ownershipDb.saasSubscriptions.find((item) => item.id === input.subscriptionId);
    if (subscription?.templateId) {
      const subscriptionTemplate = templates.find((template) => template.id === subscription.templateId);
      if (subscriptionTemplate) return subscriptionTemplate;
    }
    const product = ownershipDb.saasProducts.find((item) => item.id === subscription?.productId);
    if (product?.templateId) {
      const productTemplate = templates.find((template) => template.id === product.templateId);
      if (productTemplate) return productTemplate;
    }
    const scopedProduct = templates.find((template) => template.scopeType === "saas" && template.scopeId === product?.id);
    if (scopedProduct) return scopedProduct;
    const genericSaas = templates.find((template) => template.scopeType === "saas" && template.scopeId === "all");
    if (genericSaas) return genericSaas;
  }

  if (input.projectId) {
    const profile = ownershipDb.projectProfiles.find((item) => item.projectId === input.projectId && item.status !== "archived");
    if (profile?.templateId) {
      const profileTemplate = templates.find((template) => template.id === profile.templateId);
      if (profileTemplate) return profileTemplate;
    }
    const projectTemplate = templates.find((template) => template.scopeType === "project" && template.scopeId === input.projectId);
    if (projectTemplate) return projectTemplate;
    const serviceTemplate = templates.find((template) => template.scopeType === "service" && template.scopeId === profile?.serviceId);
    if (serviceTemplate) return serviceTemplate;
    const departmentTemplate = templates.find((template) => template.scopeType === "department" && template.scopeId === profile?.departmentId);
    if (departmentTemplate) return departmentTemplate;
  }

  return templates.find((template) => template.scopeType === "global" && template.isDefault) ?? templates.find((template) => template.scopeType === "global");
}

function beneficiaryName(id: string) {
  return ownershipDb.beneficiaries.find((beneficiary) => beneficiary.id === id)?.name ?? id;
}

function calculateAllocation(template: Record<string, any>, amountRaw: unknown, deductionsRaw: unknown) {
  const amount = Math.max(0, rounded(amountRaw));
  const deductions = Math.max(0, rounded(deductionsRaw));
  if (amount <= 0) throw new ApiError(400, "invalid_amount", "Amount must be greater than zero.");
  const pool = template.expenseBasis === "net" ? Math.max(0, amount - deductions) : amount;
  let remaining = pool;
  const lines: Array<Record<string, any>> = [];
  const sortedRules = [...(Array.isArray(template.rules) ? template.rules : [])].sort((a, b) => numberValue(a.order) - numberValue(b.order));

  const addLine = (rule: Record<string, any>, lineAmount: number) => {
    if (lineAmount <= 0) return;
    const existing = lines.find((line) => line.beneficiaryId === rule.beneficiaryId);
    if (existing) {
      existing.amount += lineAmount;
      existing.remainingAmount += lineAmount;
      return;
    }
    lines.push({
      id: `line_${Date.now()}_${lines.length + 1}`,
      beneficiaryId: rule.beneficiaryId,
      beneficiaryName: beneficiaryName(String(rule.beneficiaryId)),
      ruleId: rule.id,
      ruleLabel: rule.label,
      amount: lineAmount,
      paidAmount: 0,
      remainingAmount: lineAmount,
      status: "due"
    });
  };

  const remainingRule = sortedRules.find((rule) => rule.kind === "remaining");
  for (const rule of sortedRules.filter((item) => item.kind !== "remaining")) {
    if (remaining <= 0) break;
    let lineAmount = 0;
    if (rule.kind === "fixed") lineAmount = rounded(rule.value);
    if (rule.kind === "percent") {
      const base = (rule.applyTo ?? "pool") === "remaining" ? remaining : pool;
      lineAmount = Math.round(base * numberValue(rule.value) / 100);
    }
    lineAmount = Math.min(Math.max(0, lineAmount), remaining);
    addLine(rule, lineAmount);
    remaining -= lineAmount;
  }

  if (remainingRule && remaining > 0) {
    addLine(remainingRule, remaining);
    remaining = 0;
  }

  if (remaining > 0) {
    const fallbackId = String(template.roundingBeneficiaryId ?? "ben_office");
    addLine({ id: "rounding", label: "فرق التقريب / الرصيد", beneficiaryId: fallbackId }, remaining);
    remaining = 0;
  }

  const distributed = lines.reduce((sum, line) => sum + numberValue(line.amount), 0);
  return { amount, deductions, distributableAmount: pool, distributed, lines };
}

ownershipRouter.get(
  "/receipts",
  requirePermission("finance:read"),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25)));
    const rows = [...ownershipDb.receipts].sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
    const start = (page - 1) * pageSize;
    ok(res, { rows: rows.slice(start, start + pageSize), total: rows.length, page, pageSize });
  })
);

ownershipRouter.post(
  "/receipts",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const sourceType = String(req.body.sourceType ?? "project");
    const projectId = req.body.projectId ? String(req.body.projectId) : undefined;
    const subscriptionId = req.body.subscriptionId ? String(req.body.subscriptionId) : undefined;
    if (sourceType === "project" && !projectId) throw new ApiError(400, "project_required", "Project is required.");
    if (sourceType === "saas" && !subscriptionId) throw new ApiError(400, "subscription_required", "SaaS subscription is required.");
    const template = resolveTemplate({ templateId: req.body.templateId, projectId, subscriptionId });
    if (!template) throw new ApiError(400, "template_required", "No distribution template could be resolved. Configure a default template first.");
    validateTemplate(template);
    const calculation = calculateAllocation(template, req.body.amount, req.body.deductions);
    const subscription = ownershipDb.saasSubscriptions.find((item) => item.id === subscriptionId);
    const project = db.projects.find((item) => item.id === projectId);
    const receivedAt = req.body.receivedAt ? new Date(String(req.body.receivedAt)).toISOString() : new Date().toISOString();
    const currencyCode = String(req.body.currencyCode ?? subscription?.currencyCode ?? project?.currencyCode ?? "USD");

    const receipt = createOwnership("receipts", {
      sourceType,
      sourceId: projectId ?? subscriptionId ?? req.body.sourceId,
      projectId,
      subscriptionId,
      clientName: req.body.clientName ?? subscription?.clientName ?? (project ? String(project.name) : ""),
      amount: calculation.amount,
      deductions: calculation.deductions,
      distributableAmount: calculation.distributableAmount,
      currencyCode,
      receivedAt,
      paymentMethod: req.body.paymentMethod ?? "manual",
      reference: req.body.reference,
      templateId: template.id,
      note: req.body.note,
      status: "received"
    }, req.user?.id);

    const allocation = createOwnership("allocations", {
      receiptId: receipt.id,
      sourceType,
      sourceId: receipt.sourceId,
      projectId,
      subscriptionId,
      receivedAt,
      amountReceived: calculation.amount,
      deductions: calculation.deductions,
      distributableAmount: calculation.distributableAmount,
      currencyCode,
      templateId: template.id,
      templateSnapshot: {
        id: template.id,
        name: template.name,
        version: template.version,
        expenseBasis: template.expenseBasis,
        roundingBeneficiaryId: template.roundingBeneficiaryId,
        rules: template.rules
      },
      lines: calculation.lines,
      status: calculation.lines.length ? "open" : "settled"
    }, req.user?.id);

    updateOwnership("receipts", receipt.id, { allocationId: allocation.id }, req.user?.id);
    ok(res, { receipt: { ...receipt, allocationId: allocation.id }, allocation });
  })
);

ownershipRouter.post(
  "/receipts/:id/reverse",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const receipt = ownershipDb.receipts.find((item) => item.id === String(req.params.id));
    if (!receipt) throw new ApiError(404, "not_found", "Receipt not found.");
    const allocation = ownershipDb.allocations.find((item) => item.id === receipt.allocationId);
    const hasPaid = (allocation?.lines ?? []).some((line: any) => numberValue(line.paidAmount) > 0);
    if (hasPaid) throw new ApiError(400, "payout_exists", "Cannot reverse a receipt after beneficiary payouts. Reverse or settle those payouts first.");
    updateOwnership("receipts", receipt.id, { status: "reversed", reversedAt: new Date().toISOString(), reversalReason: req.body.reason }, req.user?.id);
    if (allocation) updateOwnership("allocations", allocation.id, { status: "reversed" }, req.user?.id);
    ok(res, { reversed: true, id: receipt.id });
  })
);

function payAllocationLine(allocation: Record<string, any>, lineId: string, requestedAmount: number | undefined, actorId?: string, paymentMethod = "manual", note?: string, paidAt?: string) {
  const lines = Array.isArray(allocation.lines) ? allocation.lines.map((line: any) => ({ ...line })) : [];
  const lineIndex = lines.findIndex((line: any) => line.id === lineId);
  if (lineIndex < 0) throw new ApiError(404, "not_found", "Allocation line not found.");
  const remaining = Math.max(0, rounded(lines[lineIndex].remainingAmount));
  if (remaining <= 0) throw new ApiError(400, "already_paid", "This allocation line is already paid.");
  const amount = requestedAmount === undefined ? remaining : Math.min(remaining, Math.max(0, rounded(requestedAmount)));
  if (amount <= 0) throw new ApiError(400, "invalid_amount", "Payout amount must be greater than zero.");

  lines[lineIndex].paidAmount = rounded(lines[lineIndex].paidAmount) + amount;
  lines[lineIndex].remainingAmount = remaining - amount;
  lines[lineIndex].status = lines[lineIndex].remainingAmount <= 0 ? "paid" : "partially_paid";
  const allPaid = lines.every((line: any) => rounded(line.remainingAmount) <= 0);
  const updatedAllocation = updateOwnership("allocations", allocation.id, { lines, status: allPaid ? "settled" : "open" }, actorId);
  const event = createOwnership("payoutEvents", {
    allocationId: allocation.id,
    lineId,
    beneficiaryId: lines[lineIndex].beneficiaryId,
    amount,
    currencyCode: allocation.currencyCode,
    paidAt: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
    paymentMethod,
    note,
    status: "paid"
  }, actorId);
  return { allocation: updatedAllocation, event, paidAmount: amount };
}

ownershipRouter.post(
  "/allocations/:allocationId/lines/:lineId/pay",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const allocation = ownershipDb.allocations.find((item) => item.id === String(req.params.allocationId));
    if (!allocation || allocation.status === "reversed") throw new ApiError(404, "not_found", "Allocation not found.");
    ok(res, payAllocationLine(allocation, String(req.params.lineId), req.body.amount === undefined ? undefined : numberValue(req.body.amount), req.user?.id, req.body.paymentMethod, req.body.note, req.body.paidAt));
  })
);

function sourceLabel(allocation: Record<string, any>) {
  if (allocation.projectId) return db.projects.find((project) => project.id === allocation.projectId)?.name ?? allocation.projectId;
  if (allocation.subscriptionId) {
    const subscription = ownershipDb.saasSubscriptions.find((item) => item.id === allocation.subscriptionId);
    const product = ownershipDb.saasProducts.find((item) => item.id === subscription?.productId);
    return `${subscription?.clientName ?? "SaaS"}${product?.name ? ` · ${product.name}` : ""}`;
  }
  return allocation.sourceId ?? "Other";
}

function buildMonthlySettlement(monthRaw?: unknown) {
  const { month, start, end } = monthBounds(monthRaw);
  const allocations = ownershipDb.allocations.filter((allocation) => allocation.status !== "reversed");
  const events = ownershipDb.payoutEvents.filter((event) => event.status !== "reversed");
  const keys = new Set<string>();
  allocations.forEach((allocation) => (allocation.lines ?? []).forEach((line: any) => keys.add(`${line.beneficiaryId}::${allocation.currencyCode ?? "USD"}`)));
  ownershipDb.beneficiaries.forEach((beneficiary) => keys.add(`${beneficiary.id}::USD`));

  const rows = [...keys].map((key) => {
    const [beneficiaryId, currencyCode] = key.split("::");
    let earnedBefore = 0;
    let earnedThisMonth = 0;
    const sources: Array<{ label: string; amount: number }> = [];
    for (const allocation of allocations.filter((item) => String(item.currencyCode ?? "USD") === currencyCode)) {
      const amount = (allocation.lines ?? [])
        .filter((line: any) => line.beneficiaryId === beneficiaryId)
        .reduce((sum: number, line: any) => sum + rounded(line.amount), 0);
      if (!amount) continue;
      if (before(allocation.receivedAt ?? allocation.createdAt, start)) earnedBefore += amount;
      if (within(allocation.receivedAt ?? allocation.createdAt, start, end)) {
        earnedThisMonth += amount;
        sources.push({ label: String(sourceLabel(allocation)), amount });
      }
    }
    const beneficiaryEvents = events.filter((event) => event.beneficiaryId === beneficiaryId && String(event.currencyCode ?? "USD") === currencyCode);
    const paidBefore = beneficiaryEvents.filter((event) => before(event.paidAt ?? event.createdAt, start)).reduce((sum, event) => sum + rounded(event.amount), 0);
    const paidThisMonth = beneficiaryEvents.filter((event) => within(event.paidAt ?? event.createdAt, start, end)).reduce((sum, event) => sum + rounded(event.amount), 0);
    const openingOutstanding = Math.max(0, earnedBefore - paidBefore);
    const dueNow = Math.max(0, openingOutstanding + earnedThisMonth - paidThisMonth);
    return {
      beneficiaryId,
      beneficiaryName: beneficiaryName(beneficiaryId),
      currencyCode,
      openingOutstanding,
      earnedThisMonth,
      paidThisMonth,
      dueNow,
      sources
    };
  }).filter((row) => row.openingOutstanding || row.earnedThisMonth || row.paidThisMonth || row.dueNow);

  rows.sort((a, b) => b.dueNow - a.dueNow);
  return {
    month,
    rows,
    totalsByCurrency: rows.reduce((acc: Record<string, any>, row) => {
      const current = acc[row.currencyCode] ?? { earnedThisMonth: 0, paidThisMonth: 0, dueNow: 0, openingOutstanding: 0 };
      current.earnedThisMonth += row.earnedThisMonth;
      current.paidThisMonth += row.paidThisMonth;
      current.dueNow += row.dueNow;
      current.openingOutstanding += row.openingOutstanding;
      acc[row.currencyCode] = current;
      return acc;
    }, {})
  };
}

ownershipRouter.get(
  "/monthly-settlement",
  requirePermission("finance:read"),
  asyncHandler(async (req, res) => ok(res, buildMonthlySettlement(req.query.month)))
);

ownershipRouter.post(
  "/settlements/pay",
  requirePermission("finance:write"),
  asyncHandler(async (req, res) => {
    const beneficiaryId = String(req.body.beneficiaryId ?? "");
    const currencyCode = String(req.body.currencyCode ?? "USD");
    if (!beneficiaryId) throw new ApiError(400, "beneficiary_required", "Beneficiary is required.");
    const openLines = ownershipDb.allocations
      .filter((allocation) => allocation.status !== "reversed" && String(allocation.currencyCode ?? "USD") === currencyCode)
      .flatMap((allocation) => (allocation.lines ?? []).filter((line: any) => line.beneficiaryId === beneficiaryId && rounded(line.remainingAmount) > 0).map((line: any) => ({ allocation, line })))
      .sort((a, b) => String(a.allocation.receivedAt ?? a.allocation.createdAt).localeCompare(String(b.allocation.receivedAt ?? b.allocation.createdAt)));
    const totalDue = openLines.reduce((sum, item) => sum + rounded(item.line.remainingAmount), 0);
    let remainingToPay = req.body.amount === undefined ? totalDue : Math.min(totalDue, Math.max(0, rounded(req.body.amount)));
    if (remainingToPay <= 0) throw new ApiError(400, "nothing_due", "No outstanding amount is available to pay.");
    const events: any[] = [];
    for (const item of openLines) {
      if (remainingToPay <= 0) break;
      const amount = Math.min(remainingToPay, rounded(item.line.remainingAmount));
      const result = payAllocationLine(item.allocation, item.line.id, amount, req.user?.id, req.body.paymentMethod, req.body.note, req.body.paidAt);
      events.push(result.event);
      remainingToPay -= result.paidAmount;
    }
    ok(res, { beneficiaryId, currencyCode, paidAmount: events.reduce((sum, event) => sum + rounded(event.amount), 0), events });
  })
);

ownershipRouter.get(
  "/overview",
  requirePermission("finance:read"),
  asyncHandler(async (req, res) => {
    ensureOwnershipDefaults();
    const settlement = buildMonthlySettlement(req.query.month);
    const { start, end } = monthBounds(req.query.month);
    const monthReceipts = ownershipDb.receipts.filter((receipt) => receipt.status !== "reversed" && within(receipt.receivedAt ?? receipt.createdAt, start, end));
    const activeSubscriptions = activeRows("saasSubscriptions");
    const saasMrrByCurrency = activeSubscriptions.reduce((acc: Record<string, number>, subscription) => {
      const currency = String(subscription.currencyCode ?? "USD");
      acc[currency] = (acc[currency] ?? 0) + rounded(subscription.monthlyFee);
      return acc;
    }, {});
    const outstandingByCurrency = ownershipDb.allocations.filter((allocation) => allocation.status !== "reversed").reduce((acc: Record<string, number>, allocation) => {
      const currency = String(allocation.currencyCode ?? "USD");
      const due = (allocation.lines ?? []).reduce((sum: number, line: any) => sum + rounded(line.remainingAmount), 0);
      acc[currency] = (acc[currency] ?? 0) + due;
      return acc;
    }, {});
    const receivedByCurrency = monthReceipts.reduce((acc: Record<string, number>, receipt) => {
      const currency = String(receipt.currencyCode ?? "USD");
      acc[currency] = (acc[currency] ?? 0) + rounded(receipt.amount);
      return acc;
    }, {});

    ok(res, {
      month: settlement.month,
      kpis: {
        receivedByCurrency,
        outstandingByCurrency,
        saasMrrByCurrency,
        activeSubscriptions: activeSubscriptions.length,
        receiptsCount: monthReceipts.length
      },
      settlement,
      beneficiaries: ownershipDb.beneficiaries,
      structure: ownershipDb.serviceCatalog,
      templates: ownershipDb.templates,
      projectProfiles: ownershipDb.projectProfiles,
      projects: db.projects.map((project) => ({ id: project.id, name: project.name, status: project.status, currencyCode: project.currencyCode, budgetAmount: project.budgetAmount })),
      accounts: db.accounts.map((account) => ({ id: account.id, name: account.name })),
      saasProducts: ownershipDb.saasProducts,
      saasSubscriptions: ownershipDb.saasSubscriptions,
      recentReceipts: [...ownershipDb.receipts].sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt))).slice(0, 12),
      recentPayouts: [...ownershipDb.payoutEvents].sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt))).slice(0, 12)
    });
  })
);

export { ensureOwnershipDefaults } from "../data/ownership-store.js";
