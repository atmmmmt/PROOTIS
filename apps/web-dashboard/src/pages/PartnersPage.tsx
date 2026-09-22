import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { t } from "../lib/i18n";
import { DataTable } from "../components/DataTable";
import { Surface, SectionHeader, StatusPill } from "../components/ui";
import { Modal, ConfirmModal } from "../components/Modal";

function useLocale() {
  const locale = useAppStore((s) => s.locale);
  return { locale };
}

type Tab = "partners" | "agreements" | "shareRules" | "settlements";

const tabs: { key: Tab; path: string }[] = [
  { key: "partners", path: "/partners" },
  { key: "agreements", path: "/partners/agreements" },
  { key: "shareRules", path: "/partners/share-rules" },
  { key: "settlements", path: "/partners/settlements" }
];

const columnConfig: Record<Tab, Array<{ key: string; label: string }>> = {
  partners: [
    { key: "fullName", label: "Name" },
    { key: "companyName", label: "Company" },
    { key: "partnerType", label: "Type" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" }
  ],
  agreements: [
    { key: "partnerId", label: "Partner" },
    { key: "agreementType", label: "Type" },
    { key: "startDate", label: "Start" },
    { key: "settlementBasis", label: "Basis" },
    { key: "status", label: "Status" }
  ],
  shareRules: [
    { key: "ruleCode", label: "Rule Code" },
    { key: "percentage", label: "%" },
    { key: "fixedFee", label: "Fixed Fee" },
    { key: "maxCap", label: "Max Cap" },
    { key: "status", label: "Status" }
  ],
  settlements: [
    { key: "partnerId", label: "Partner" },
    { key: "fromDate", label: "From" },
    { key: "toDate", label: "To" },
    { key: "grossBasis", label: "Gross Basis" },
    { key: "shareAmount", label: "Share Amount" },
    { key: "status", label: "Status" }
  ]
};

export function PartnersPage() {
  const { locale } = useLocale();
  const [tab, setTab] = useState<Tab>("partners");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const currentTab = tabs.find((t) => t.key === tab)!;

  const { data, isLoading } = useQuery({
    queryKey: ["partners", tab, search],
    queryFn: () => api.table(currentTab.path, search ? { search } : undefined)
  });

  const rows = data?.rows ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.create(currentTab.path, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["partners", tab] }); setCreateOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(currentTab.path, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["partners", tab] }); setDeleteOpen(false); }
  });

  const approveSettlementMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/partner-settlements/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners", tab] })
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/partner-settlements/${id}/mark-paid`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners", tab] })
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero */}
      <section className="flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">Partners</p>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
            {locale === "ar" ? "الشركاء والتسويات" : "Partners and Commissions"}
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
            <button onClick={() => qc.invalidateQueries({ queryKey: ["partners", tab] })} className="rounded-xl border border-prootech-line p-2 text-prootech-text-muted hover:bg-prootech-muted">
              <RefreshCw size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-prootech-muted-strong" />
          ) : (
            <>
              <DataTable title={t(locale, tab)} rows={rows} columns={columnConfig[tab]} />

              {/* Settlement Actions */}
              {tab === "settlements" && rows.length > 0 && (
                <div className="mt-4">
                  <SectionHeader title={locale === "ar" ? "إجراءات التسويات" : "Settlement Actions"} />
                  <div className="space-y-2">
                    {rows.map((row) => (
                      <div key={String(row.id)} className="flex items-center justify-between rounded-xl border border-prootech-line p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{String(row.partnerId)}</span>
                          <span className="text-sm text-prootech-text-muted">${String(row.shareAmount)}</span>
                          <StatusPill value={row.status} />
                        </div>
                        <div className="flex gap-2">
                          {row.status === "preview" && (
                            <button
                              onClick={() => approveSettlementMutation.mutate(String(row.id))}
                              disabled={approveSettlementMutation.isPending}
                              className="rounded-lg bg-prootech-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-prootech-violet-light disabled:opacity-60"
                            >
                              {t(locale, "approve")}
                            </button>
                          )}
                          {row.status === "approved" && (
                            <button
                              onClick={() => markPaidMutation.mutate(String(row.id))}
                              disabled={markPaidMutation.isPending}
                              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                            >
                              {t(locale, "markPaid")}
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedId(String(row.id)); setDeleteOpen(true); }}
                            className="rounded-lg border border-prootech-line px-3 py-1.5 text-xs font-medium text-prootech-text-muted hover:bg-prootech-muted"
                          >
                            {t(locale, "delete")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Surface>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={`${t(locale, "create")} ${t(locale, tab)}`} size="md"
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium text-prootech-text-muted hover:bg-prootech-muted">{t(locale, "cancel")}</button>
            <button form="partners-create-form" type="submit" disabled={createMutation.isPending} className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">
              {createMutation.isPending ? "..." : t(locale, "save")}
            </button>
          </>
        }
      >
        <PartnersCreateForm tab={tab} onSubmit={(d) => createMutation.mutate(d)} locale={locale} />
      </Modal>

      <ConfirmModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => deleteMutation.mutate(selectedId)}
        title={locale === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={locale === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure?"}
        confirmLabel={locale === "ar" ? "حذف" : "Delete"} variant="danger" isPending={deleteMutation.isPending} />
    </motion.div>
  );
}

function PartnersCreateForm({ tab, onSubmit, locale }: { tab: Tab; onSubmit: (d: Record<string, unknown>) => void; locale: string }) {
  const fields: Record<Tab, Array<{ key: string; label: string; type?: string; options?: string[] }>> = {
    partners: [
      { key: "fullName", label: locale === "ar" ? "الاسم الكامل" : "Full Name" },
      { key: "companyName", label: locale === "ar" ? "الشركة" : "Company Name" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: locale === "ar" ? "الهاتف" : "Phone" },
      { key: "partnerType", label: locale === "ar" ? "نوع الشراكة" : "Partner Type", options: ["referral", "reseller", "affiliate", "integration"] }
    ],
    agreements: [
      { key: "agreementType", label: locale === "ar" ? "نوع الاتفاقية" : "Agreement Type", options: ["referral", "reseller", "commission"] },
      { key: "startDate", label: locale === "ar" ? "تاريخ البداية" : "Start Date", type: "date" },
      { key: "settlementBasis", label: locale === "ar" ? "أساس التسوية" : "Settlement Basis", options: ["collected_cash", "invoiced_amount", "gross_revenue"] }
    ],
    shareRules: [
      { key: "ruleCode", label: locale === "ar" ? "كود القاعدة" : "Rule Code" },
      { key: "percentage", label: locale === "ar" ? "النسبة المئوية" : "Percentage", type: "number" },
      { key: "fixedFee", label: locale === "ar" ? "رسوم ثابتة" : "Fixed Fee", type: "number" },
      { key: "maxCap", label: locale === "ar" ? "الحد الأقصى" : "Max Cap", type: "number" }
    ],
    settlements: [
      { key: "fromDate", label: locale === "ar" ? "من تاريخ" : "From Date", type: "date" },
      { key: "toDate", label: locale === "ar" ? "إلى تاريخ" : "To Date", type: "date" },
      { key: "grossBasis", label: locale === "ar" ? "الأساس الإجمالي" : "Gross Basis", type: "number" },
      { key: "currencyCode", label: locale === "ar" ? "العملة" : "Currency", options: ["USD", "AED", "SAR"] }
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
    <form id="partners-create-form" onSubmit={handleSubmit} className="space-y-4">
      {fields[tab].map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{field.label}</span>
          {field.options ? (
            <select name={field.key} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white">
              <option value="">—</option>
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
