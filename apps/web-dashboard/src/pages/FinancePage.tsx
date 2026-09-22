import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { t } from "../lib/i18n";
import { DataTable } from "../components/DataTable";
import { Surface, SectionHeader, StatusPill, KpiCard } from "../components/ui";
import { Modal, ConfirmModal } from "../components/Modal";

function useLocale() {
  const locale = useAppStore((s) => s.locale);
  return { locale, isAr: locale === "ar" };
}

type Tab = "invoices" | "payments" | "expenses" | "revenueSnapshots";

const tabs: { key: Tab; path: string }[] = [
  { key: "invoices", path: "/finance/invoices" },
  { key: "payments", path: "/finance/payments" },
  { key: "expenses", path: "/finance/expenses" },
  { key: "revenueSnapshots", path: "/finance/revenue-snapshots" }
];

const columnConfig: Record<Tab, Array<{ key: string; label: string }>> = {
  invoices: [
    { key: "invoiceNumber", label: "Invoice #" },
    { key: "status", label: "Status" },
    { key: "totalAmount", label: "Total" },
    { key: "amountPaid", label: "Paid" },
    { key: "balanceDue", label: "Balance Due" },
    { key: "dueDate", label: "Due Date" }
  ],
  payments: [
    { key: "invoiceId", label: "Invoice" },
    { key: "amount", label: "Amount" },
    { key: "currencyCode", label: "Currency" },
    { key: "paymentMethod", label: "Method" },
    { key: "paymentDate", label: "Date" },
    { key: "status", label: "Status" }
  ],
  expenses: [
    { key: "category", label: "Category" },
    { key: "vendorName", label: "Vendor" },
    { key: "amount", label: "Amount" },
    { key: "expenseDate", label: "Date" },
    { key: "approvalStatus", label: "Status" }
  ],
  revenueSnapshots: [
    { key: "month", label: "Month" },
    { key: "revenueBooked", label: "Booked" },
    { key: "revenueCollected", label: "Collected" },
    { key: "grossMargin", label: "Gross Margin" },
    { key: "netOperationalProfit", label: "Net Profit" }
  ]
};

export function FinancePage() {
  const { locale } = useLocale();
  const [tab, setTab] = useState<Tab>("invoices");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const currentTab = tabs.find((t) => t.key === tab)!;

  const { data, isLoading } = useQuery({
    queryKey: ["finance", tab, search],
    queryFn: () => api.table(currentTab.path, search ? { search } : undefined)
  });

  const { data: dashboard } = useQuery({
    queryKey: ["finance-dashboard"],
    queryFn: api.financeDashboard
  });

  const rows = data?.rows ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.create(currentTab.path, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", tab] }); setCreateOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(currentTab.path, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", tab] }); setDeleteOpen(false); }
  });

  const issueMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/invoices/${id}/issue`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", tab] })
  });

  const approveExpenseMutation = useMutation({
    mutationFn: (id: string) => api.update("/finance/expenses", id, { approvalStatus: "approved" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", tab] })
  });

  const arAging = dashboard?.arAging ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero */}
      <section className="flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">Finance</p>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
            {locale === "ar" ? "مركز الفواتير والتحصيل" : "Finance and Revenue Ops"}
          </h1>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 self-start rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 sm:self-auto"
        >
          <Plus size={15} />
          {t(locale, "create")} {t(locale, tab)}
        </button>
      </section>

      {/* AR Aging KPIs */}
      {arAging.length > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {arAging.map((bucket: any) => (
            <KpiCard
              key={bucket.bucket}
              label={`AR ${bucket.bucket} days`}
              value={`$${Number(bucket.amount).toLocaleString()}`}
              delta={bucket.bucket === "30+" ? "⚠ Overdue" : "Current"}
              tone={bucket.bucket === "30+" ? "risk" : bucket.bucket === "Current" ? "good" : "watch"}
            />
          ))}
        </section>
      )}

      {/* Tabs + Table */}
      <Surface className="overflow-hidden">
        <div className="flex gap-0 overflow-x-auto border-b border-prootech-line">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`shrink-0 px-4 py-3 text-[0.8125rem] font-medium transition-colors ${tab === item.key ? "border-b-2 border-prootech-violet text-prootech-violet" : "text-prootech-text-muted hover:text-prootech-black"}`}
            >
              {t(locale, item.key)}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="mb-4 flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(locale, "search_placeholder")}
              className="min-w-0 flex-1 rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2 text-sm outline-none transition focus:border-prootech-violet focus:bg-white"
            />
            <button onClick={() => qc.invalidateQueries({ queryKey: ["finance", tab] })} className="rounded-xl border border-prootech-line p-2 text-prootech-text-muted hover:bg-prootech-muted">
              <RefreshCw size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-prootech-muted-strong" />
          ) : (
            <>
              <DataTable title={t(locale, tab)} rows={rows} columns={columnConfig[tab]} />

              {/* Invoice Actions */}
              {tab === "invoices" && rows.length > 0 && (
                <div className="mt-4">
                  <SectionHeader title={locale === "ar" ? "إجراءات الفواتير" : "Invoice Actions"} />
                  <div className="space-y-2">
                    {rows.slice(0, 5).map((row) => (
                      <div key={String(row.id)} className="flex items-center justify-between rounded-xl border border-prootech-line p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{String(row.invoiceNumber)}</span>
                          <StatusPill value={row.status} />
                          <span className="text-sm text-prootech-text-muted">${String(row.totalAmount)}</span>
                        </div>
                        <div className="flex gap-2">
                          {row.status === "draft" && (
                            <button
                              onClick={() => issueMutation.mutate(String(row.id))}
                              disabled={issueMutation.isPending}
                              className="rounded-lg bg-prootech-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-prootech-violet-light disabled:opacity-60"
                            >
                              {t(locale, "issue")}
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedId(String(row.id)); setDeleteOpen(true); }}
                            className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            {t(locale, "delete")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Actions */}
              {tab === "expenses" && rows.length > 0 && (
                <div className="mt-4">
                  <SectionHeader title={locale === "ar" ? "اعتماد المصروفات" : "Expense Approvals"} />
                  <div className="space-y-2">
                    {rows.filter((r) => r.approvalStatus === "pending").slice(0, 5).map((row) => (
                      <div key={String(row.id)} className="flex items-center justify-between rounded-xl border border-prootech-line p-3">
                        <div>
                          <span className="text-sm font-medium">{String(row.category)}</span>
                          <span className="ms-3 text-sm text-prootech-text-muted">${String(row.amount)}</span>
                        </div>
                        <button
                          onClick={() => approveExpenseMutation.mutate(String(row.id))}
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
                        >
                          {t(locale, "approve")}
                        </button>
                      </div>
                    ))}
                    {rows.filter((r) => r.approvalStatus === "pending").length === 0 && (
                      <p className="text-sm text-prootech-text-muted">{locale === "ar" ? "لا توجد مصروفات بانتظار الاعتماد." : "No expenses pending approval."}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Surface>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={`${t(locale, "create")} ${t(locale, tab)}`}
        size="md"
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium text-prootech-text-muted hover:bg-prootech-muted">
              {t(locale, "cancel")}
            </button>
            <button form="finance-create-form" type="submit" disabled={createMutation.isPending}
              className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">
              {createMutation.isPending ? "..." : t(locale, "save")}
            </button>
          </>
        }
      >
        <FinanceCreateForm tab={tab} onSubmit={(d) => createMutation.mutate(d)} locale={locale} />
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(selectedId)}
        title={locale === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={locale === "ar" ? "هل أنت متأكد من حذف هذا السجل؟" : "Are you sure you want to delete this record?"}
        confirmLabel={locale === "ar" ? "حذف" : "Delete"}
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </motion.div>
  );
}

function FinanceCreateForm({ tab, onSubmit, locale }: { tab: Tab; onSubmit: (d: Record<string, unknown>) => void; locale: string }) {
  const fields: Record<Tab, Array<{ key: string; label: string; type?: string; options?: string[] }>> = {
    invoices: [
      { key: "invoiceNumber", label: locale === "ar" ? "رقم الفاتورة" : "Invoice Number" },
      { key: "invoiceType", label: locale === "ar" ? "نوع الفاتورة" : "Invoice Type", options: ["retainer", "project", "ad-hoc"] },
      { key: "totalAmount", label: locale === "ar" ? "المبلغ الكلي" : "Total Amount", type: "number" },
      { key: "issueDate", label: locale === "ar" ? "تاريخ الإصدار" : "Issue Date", type: "date" },
      { key: "dueDate", label: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date", type: "date" },
      { key: "currencyCode", label: locale === "ar" ? "العملة" : "Currency", options: ["USD", "AED", "SAR", "SYP"] }
    ],
    payments: [
      { key: "amount", label: locale === "ar" ? "المبلغ" : "Amount", type: "number" },
      { key: "paymentMethod", label: locale === "ar" ? "طريقة الدفع" : "Payment Method", options: ["bank_transfer", "cash", "card", "crypto"] },
      { key: "paymentDate", label: locale === "ar" ? "تاريخ الدفع" : "Payment Date", type: "date" },
      { key: "externalRef", label: locale === "ar" ? "مرجع خارجي" : "External Reference" },
      { key: "currencyCode", label: locale === "ar" ? "العملة" : "Currency", options: ["USD", "AED", "SAR"] }
    ],
    expenses: [
      { key: "category", label: locale === "ar" ? "الفئة" : "Category", options: ["Media tools", "Ads spend", "Software", "Travel", "Office", "Other"] },
      { key: "vendorName", label: locale === "ar" ? "اسم المورد" : "Vendor Name" },
      { key: "amount", label: locale === "ar" ? "المبلغ" : "Amount", type: "number" },
      { key: "expenseDate", label: locale === "ar" ? "التاريخ" : "Date", type: "date" },
      { key: "currencyCode", label: locale === "ar" ? "العملة" : "Currency", options: ["USD", "AED", "SAR"] }
    ],
    revenueSnapshots: [
      { key: "month", label: locale === "ar" ? "الشهر" : "Month (YYYY-MM)" },
      { key: "revenueBooked", label: locale === "ar" ? "الإيراد المحجوز" : "Revenue Booked", type: "number" },
      { key: "revenueCollected", label: locale === "ar" ? "الإيراد المحصّل" : "Revenue Collected", type: "number" },
      { key: "grossMargin", label: locale === "ar" ? "الهامش" : "Gross Margin (0-1)", type: "number" },
      { key: "payrollCost", label: locale === "ar" ? "تكلفة الرواتب" : "Payroll Cost", type: "number" }
    ]
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (v) data[k] = v; });
    onSubmit(data);
  };

  return (
    <form id="finance-create-form" onSubmit={handleSubmit} className="space-y-4">
      {fields[tab].map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{field.label}</span>
          {field.options ? (
            <select name={field.key} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white">
              <option value="">— {locale === "ar" ? "اختر" : "Select"} —</option>
              {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input name={field.key} type={field.type ?? "text"} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white" />
          )}
        </label>
      ))}
    </form>
  );
}
