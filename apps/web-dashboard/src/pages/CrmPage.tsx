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
  return { locale, isAr: locale === "ar" };
}

type Tab = "opportunities" | "leads" | "contacts" | "accounts" | "activities" | "proposals" | "contracts";

const tabs: { key: Tab; path: string }[] = [
  { key: "opportunities", path: "/crm/opportunities" },
  { key: "leads", path: "/crm/leads" },
  { key: "contacts", path: "/crm/contacts" },
  { key: "accounts", path: "/crm/accounts" },
  { key: "activities", path: "/crm/activities" },
  { key: "proposals", path: "/crm/proposals" },
  { key: "contracts", path: "/crm/contracts" }
];

const columnConfig: Record<Tab, Array<{ key: string; label: string }>> = {
  opportunities: [
    { key: "title", label: "Title" },
    { key: "stage", label: "Stage" },
    { key: "estimatedAmount", label: "Amount" },
    { key: "probability", label: "Probability" },
    { key: "expectedCloseDate", label: "Close date" }
  ],
  leads: [
    { key: "fullName", label: "Name" },
    { key: "companyName", label: "Company" },
    { key: "source", label: "Source" },
    { key: "status", label: "Status" },
    { key: "score", label: "Score" }
  ],
  contacts: [
    { key: "fullName", label: "Name" },
    { key: "title", label: "Title" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "isPrimary", label: "Primary" }
  ],
  accounts: [
    { key: "name", label: "Account" },
    { key: "industry", label: "Industry" },
    { key: "country", label: "Country" },
    { key: "size", label: "Size" },
    { key: "status", label: "Status" }
  ],
  activities: [
    { key: "title", label: "Activity" },
    { key: "type", label: "Type" },
    { key: "entityType", label: "Related to" },
    { key: "dueDate", label: "Due date" },
    { key: "status", label: "Status" }
  ],
  proposals: [
    { key: "title", label: "Proposal" },
    { key: "version", label: "Version" },
    { key: "totalAmount", label: "Amount" },
    { key: "marginEstimate", label: "Margin" },
    { key: "approvalStatus", label: "Status" }
  ],
  contracts: [
    { key: "contractType", label: "Type" },
    { key: "startDate", label: "Start" },
    { key: "endDate", label: "End" },
    { key: "billingTerms", label: "Billing" },
    { key: "status", label: "Status" }
  ]
};

const opportunityStages = ["new", "qualified", "proposal", "negotiation", "won", "lost"];

export function CrmPage() {
  const { locale } = useLocale();
  const [tab, setTab] = useState<Tab>("opportunities");
  const [createOpen, setCreateOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState("");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const currentTab = tabs.find((t) => t.key === tab)!;

  const { data, isLoading } = useQuery({
    queryKey: ["crm", tab, search],
    queryFn: () => api.table(currentTab.path, search ? { search } : undefined)
  });

  const rows = data?.rows ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.create(currentTab.path, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", tab] }); setCreateOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(currentTab.path, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", tab] }); setDeleteOpen(false); }
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      api.action("POST", `/opportunities/${id}/change-stage`, { stage }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm", tab] }); setStageOpen(false); }
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/opportunities/${id}/convert-to-project`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm", tab] })
  });

  const submitProposalMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/proposals/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm", tab] })
  });

  const approveProposalMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/proposals/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm", tab] })
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero */}
      <section className="flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">CRM</p>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
            {locale === "ar" ? "مركز المبيعات والعملاء" : "CRM and Sales"}
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

      {/* Tabs */}
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
            <button onClick={() => qc.invalidateQueries({ queryKey: ["crm", tab] })} className="rounded-xl border border-prootech-line p-2 text-prootech-text-muted hover:bg-prootech-muted">
              <RefreshCw size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-prootech-muted-strong" />
          ) : (
            <>
              <DataTable
                title={t(locale, tab)}
                rows={rows}
                columns={columnConfig[tab]}
              />

              {/* Action rows for special tabs */}
              {tab === "opportunities" && rows.length > 0 && (
                <div className="mt-4 space-y-2">
                  <SectionHeader title={locale === "ar" ? "إجراءات سريعة" : "Quick Actions"} />
                  <div className="flex flex-wrap gap-2">
                    {rows.slice(0, 3).map((row) => (
                      <div key={String(row.id)} className="flex items-center gap-2 rounded-xl border border-prootech-line bg-prootech-muted p-3">
                        <span className="text-xs font-medium text-prootech-black truncate max-w-[120px]">{String(row.title ?? row.id)}</span>
                        <button
                          onClick={() => { setSelectedId(String(row.id)); setSelectedStage(String(row.stage ?? "")); setStageOpen(true); }}
                          className="rounded-lg border border-prootech-line bg-white px-2.5 py-1 text-[0.7rem] font-medium hover:bg-prootech-muted"
                        >
                          {t(locale, "changeStage")}
                        </button>
                        <button
                          onClick={() => convertMutation.mutate(String(row.id))}
                          disabled={convertMutation.isPending}
                          className="rounded-lg bg-prootech-violet px-2.5 py-1 text-[0.7rem] font-medium text-white hover:bg-prootech-violet-light disabled:opacity-60"
                        >
                          {t(locale, "convertToProject")}
                        </button>
                        <button
                          onClick={() => { setSelectedId(String(row.id)); setDeleteOpen(true); }}
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[0.7rem] font-medium text-red-700 hover:bg-red-100"
                        >
                          {t(locale, "delete")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "proposals" && rows.length > 0 && (
                <div className="mt-4 space-y-2">
                  <SectionHeader title={locale === "ar" ? "إجراءات العروض" : "Proposal Actions"} />
                  <div className="flex flex-wrap gap-2">
                    {rows.slice(0, 3).map((row) => (
                      <div key={String(row.id)} className="flex items-center gap-2 rounded-xl border border-prootech-line bg-prootech-muted p-3">
                        <span className="text-xs font-medium text-prootech-black truncate max-w-[120px]">{String(row.title ?? row.id)}</span>
                        <StatusPill value={row.approvalStatus} />
                        {row.approvalStatus === "draft" && (
                          <button
                            onClick={() => submitProposalMutation.mutate(String(row.id))}
                            className="rounded-lg border border-prootech-line bg-white px-2.5 py-1 text-[0.7rem] font-medium hover:bg-prootech-muted"
                          >
                            {t(locale, "submitProposal")}
                          </button>
                        )}
                        {row.approvalStatus === "submitted" && (
                          <button
                            onClick={() => approveProposalMutation.mutate(String(row.id))}
                            className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[0.7rem] font-medium text-white hover:bg-emerald-600"
                          >
                            {t(locale, "approveProposal")}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Surface>

      {/* Stage Change Modal */}
      <Modal
        open={stageOpen}
        onClose={() => setStageOpen(false)}
        title={t(locale, "changeStage")}
        size="sm"
        footer={
          <>
            <button onClick={() => setStageOpen(false)} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium text-prootech-text-muted hover:bg-prootech-muted">
              {t(locale, "cancel")}
            </button>
            <button
              onClick={() => stageMutation.mutate({ id: selectedId, stage: selectedStage })}
              disabled={stageMutation.isPending}
              className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60"
            >
              {stageMutation.isPending ? "..." : t(locale, "save")}
            </button>
          </>
        }
      >
        <div className="space-y-2">
          {opportunityStages.map((s) => (
            <label key={s} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selectedStage === s ? "border-prootech-violet bg-prootech-violet-soft" : "border-prootech-line hover:bg-prootech-muted"}`}>
              <input type="radio" name="stage" value={s} checked={selectedStage === s} onChange={() => setSelectedStage(s)} className="accent-prootech-violet" />
              <span className="text-sm font-medium capitalize">{s}</span>
            </label>
          ))}
        </div>
      </Modal>

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
            <button
              form="create-form"
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60"
            >
              {createMutation.isPending ? "..." : t(locale, "save")}
            </button>
          </>
        }
      >
        <CreateForm
          tab={tab}
          onSubmit={(data) => createMutation.mutate(data)}
          locale={locale}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(selectedId)}
        title={locale === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={locale === "ar" ? "هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this record? This action cannot be undone."}
        confirmLabel={locale === "ar" ? "حذف" : "Delete"}
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </motion.div>
  );
}

function CreateForm({ tab, onSubmit, locale }: { tab: Tab; onSubmit: (data: Record<string, unknown>) => void; locale: string }) {
  const fields: Record<Tab, Array<{ key: string; label: string; type?: string; options?: string[] }>> = {
    opportunities: [
      { key: "title", label: locale === "ar" ? "العنوان" : "Title" },
      { key: "stage", label: locale === "ar" ? "المرحلة" : "Stage", options: opportunityStages },
      { key: "estimatedAmount", label: locale === "ar" ? "المبلغ التقديري" : "Estimated Amount", type: "number" },
      { key: "probability", label: locale === "ar" ? "الاحتمالية (0-1)" : "Probability (0-1)", type: "number" },
      { key: "expectedCloseDate", label: locale === "ar" ? "تاريخ الإغلاق المتوقع" : "Expected Close Date", type: "date" }
    ],
    leads: [
      { key: "fullName", label: locale === "ar" ? "الاسم الكامل" : "Full Name" },
      { key: "companyName", label: locale === "ar" ? "الشركة" : "Company" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: locale === "ar" ? "الهاتف" : "Phone" },
      { key: "source", label: locale === "ar" ? "المصدر" : "Source", options: ["Website", "Partner", "Outbound", "Referral", "Event"] },
      { key: "country", label: locale === "ar" ? "الدولة" : "Country" }
    ],
    contacts: [
      { key: "fullName", label: locale === "ar" ? "الاسم الكامل" : "Full Name" },
      { key: "title", label: locale === "ar" ? "المسمى الوظيفي" : "Title" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: locale === "ar" ? "الهاتف" : "Phone" },
      { key: "whatsapp", label: "WhatsApp" }
    ],
    accounts: [
      { key: "name", label: locale === "ar" ? "اسم الحساب" : "Account Name" },
      { key: "industry", label: locale === "ar" ? "القطاع" : "Industry", options: ["Retail", "Healthcare", "Ecommerce", "Real Estate", "Finance", "Other"] },
      { key: "country", label: locale === "ar" ? "الدولة" : "Country" },
      { key: "website", label: "Website" },
      { key: "size", label: locale === "ar" ? "حجم الشركة" : "Company Size" }
    ],
    activities: [
      { key: "title", label: locale === "ar" ? "الموضوع" : "Title" },
      { key: "type", label: locale === "ar" ? "النوع" : "Type", options: ["call", "meeting", "email", "note", "task"] },
      { key: "description", label: locale === "ar" ? "الوصف" : "Description" },
      { key: "dueDate", label: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date", type: "date" }
    ],
    proposals: [
      { key: "title", label: locale === "ar" ? "عنوان العرض" : "Proposal Title" },
      { key: "summary", label: locale === "ar" ? "الملخص" : "Summary" },
      { key: "totalAmount", label: locale === "ar" ? "المبلغ الكلي" : "Total Amount", type: "number" },
      { key: "marginEstimate", label: locale === "ar" ? "الهامش المتوقع (0-1)" : "Margin Estimate (0-1)", type: "number" }
    ],
    contracts: [
      { key: "contractType", label: locale === "ar" ? "نوع العقد" : "Contract Type", options: ["retainer", "project", "hourly"] },
      { key: "startDate", label: locale === "ar" ? "تاريخ البداية" : "Start Date", type: "date" },
      { key: "endDate", label: locale === "ar" ? "تاريخ النهاية" : "End Date", type: "date" },
      { key: "billingTerms", label: locale === "ar" ? "شروط الفوترة" : "Billing Terms", options: ["monthly", "quarterly", "milestone", "upfront"] },
      { key: "paymentTerms", label: locale === "ar" ? "شروط الدفع" : "Payment Terms", options: ["net_10", "net_30", "immediate"] }
    ]
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    formData.forEach((value, key) => { if (value) data[key] = value; });
    onSubmit(data);
  };

  return (
    <form id="create-form" onSubmit={handleSubmit} className="space-y-4">
      {fields[tab].map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{field.label}</span>
          {field.options ? (
            <select
              name={field.key}
              className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white"
            >
              <option value="">— {locale === "ar" ? "اختر" : "Select"} —</option>
              {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              name={field.key}
              type={field.type ?? "text"}
              className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white"
            />
          )}
        </label>
      ))}
    </form>
  );
}
