import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeftRight, Plus, RefreshCw, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { t } from "../lib/i18n";
import { DataTable } from "../components/DataTable";
import { Surface } from "../components/ui";
import { Modal } from "../components/Modal";

function useLocale() {
  const locale = useAppStore((s) => s.locale);
  return { locale };
}

type Tab = "partners" | "agreements";
type PartnerOption = Record<string, unknown>;

const tabs: { key: Tab; path: string; ar: string; en: string }[] = [
  { key: "partners", path: "/partners", ar: "الشركاء", en: "Partners" },
  { key: "agreements", path: "/partners/agreements", ar: "الاتفاقيات", en: "Agreements" }
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
  ]
};

export function PartnersPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("partners");
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const currentTab = tabs.find((item) => item.key === tab)!;

  const { data, isLoading } = useQuery({
    queryKey: ["partners", tab, search],
    queryFn: () => api.table(currentTab.path, search ? { search } : undefined)
  });

  const partnerOptionsQuery = useQuery({
    queryKey: ["partner-options"],
    queryFn: () => api.table("/partners"),
    enabled: tab === "agreements" || createOpen,
    staleTime: 2 * 60_000
  });

  const rows = data?.rows ?? [];
  const partnerOptions = (partnerOptionsQuery.data?.rows ?? []) as PartnerOption[];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.create(currentTab.path, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners", tab] });
      qc.invalidateQueries({ queryKey: ["partner-options"] });
      setCreateOpen(false);
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <section className="flex flex-col justify-between gap-5 overflow-hidden rounded-[26px] bg-hero-gradient p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-medium text-white/60">
            <UsersRound size={13} /> People / Partners
          </div>
          <h1 className="text-[1.8rem] font-semibold leading-tight tracking-[-0.025em]">
            {locale === "ar" ? "الشركاء والاتفاقيات" : "Partners and Agreements"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/60">
            {locale === "ar"
              ? "هون منعرّف الشريك وعلاقته واتفاقيته فقط. الحصص المالية والتسويات إلها مركز واحد تحت قسم المالية."
              : "Manage partner identities and agreements here. Financial shares and settlements live in one Finance workspace."}
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 self-start rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 sm:self-auto">
          <Plus size={15} /> {locale === "ar" ? `إضافة ${tab === "partners" ? "شريك" : "اتفاقية"}` : `Add ${tab === "partners" ? "partner" : "agreement"}`}
        </button>
      </section>

      <Surface className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-prootech-line px-3 py-2.5">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((item) => (
              <button key={item.key} onClick={() => setTab(item.key)} className={`shrink-0 rounded-xl px-4 py-2.5 text-[0.8rem] font-medium transition ${tab === item.key ? "bg-prootech-violet-soft text-prootech-violet shadow-[inset_0_0_0_1px_rgba(99,0,255,.12)]" : "text-prootech-text-muted hover:bg-prootech-muted hover:text-prootech-black"}`}>
                {locale === "ar" ? item.ar : item.en}
              </button>
            ))}
          </div>
          <button onClick={() => navigate("/finance/distribution")} className="hidden shrink-0 items-center gap-2 rounded-xl border border-prootech-line bg-white px-3.5 py-2 text-xs font-medium text-prootech-text-muted shadow-sm hover:border-prootech-violet/20 hover:bg-prootech-violet-soft hover:text-prootech-violet sm:inline-flex">
            <ArrowLeftRight size={14} /> {locale === "ar" ? "الحصص والتسويات" : "Shares & settlements"}
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 flex items-center gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t(locale, "search_placeholder")} className="min-w-0 flex-1 rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white" />
            <button onClick={() => qc.invalidateQueries({ queryKey: ["partners", tab] })} className="rounded-xl border border-prootech-line bg-white p-2.5 text-prootech-text-muted shadow-sm hover:bg-prootech-muted">
              <RefreshCw size={15} />
            </button>
          </div>

          {isLoading ? <div className="h-64 animate-pulse rounded-2xl bg-prootech-muted-strong" /> : <DataTable title={locale === "ar" ? currentTab.ar : currentTab.en} rows={rows} columns={columnConfig[tab]} />}
        </div>
      </Surface>

      <Surface className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-prootech-black">{locale === "ar" ? "وين صارت النسب والتسويات؟" : "Where are shares and settlements?"}</p>
          <p className="mt-1 text-xs leading-6 text-prootech-text-muted">
            {locale === "ar" ? "نقلناها لمكانها الطبيعي تحت المالية حتى ما يكون في نظامين لنفس الحسابات." : "They now live under Finance so there is one source of truth for financial allocation."}
          </p>
        </div>
        <button onClick={() => navigate("/finance/distribution")} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-prootech-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-prootech-violet-light">
          <ArrowLeftRight size={15} /> {locale === "ar" ? "فتح الحصص والتسويات" : "Open distribution"}
        </button>
      </Surface>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={locale === "ar" ? `إضافة ${tab === "partners" ? "شريك" : "اتفاقية"}` : `Add ${tab === "partners" ? "partner" : "agreement"}`} size="md"
        footer={<><button onClick={() => setCreateOpen(false)} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium text-prootech-text-muted hover:bg-prootech-muted">{t(locale, "cancel")}</button><button form="partners-create-form" type="submit" disabled={createMutation.isPending} className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">{createMutation.isPending ? "..." : t(locale, "save")}</button></>}>
        <PartnersCreateForm tab={tab} onSubmit={(payload) => createMutation.mutate(payload)} locale={locale} partners={partnerOptions} />
      </Modal>
    </motion.div>
  );
}

function PartnersCreateForm({ tab, onSubmit, locale, partners }: { tab: Tab; onSubmit: (data: Record<string, unknown>) => void; locale: string; partners: PartnerOption[] }) {
  const fields: Record<Tab, Array<{ key: string; label: string; type?: string; options?: string[]; required?: boolean }>> = {
    partners: [
      { key: "fullName", label: locale === "ar" ? "الاسم الكامل" : "Full Name", required: true },
      { key: "companyName", label: locale === "ar" ? "الشركة" : "Company Name" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: locale === "ar" ? "الهاتف" : "Phone" },
      { key: "partnerType", label: locale === "ar" ? "نوع الشراكة" : "Partner Type", options: ["referral", "reseller", "affiliate", "integration"], required: true }
    ],
    agreements: [
      { key: "partnerId", label: locale === "ar" ? "الشريك" : "Partner", required: true },
      { key: "agreementType", label: locale === "ar" ? "نوع الاتفاقية" : "Agreement Type", options: ["referral", "reseller", "commission"], required: true },
      { key: "startDate", label: locale === "ar" ? "تاريخ البداية" : "Start Date", type: "date", required: true },
      { key: "settlementBasis", label: locale === "ar" ? "أساس التسوية" : "Settlement Basis", options: ["collected_cash", "invoiced_amount", "gross_revenue"], required: true }
    ]
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: Record<string, unknown> = {};
    formData.forEach((value, key) => { if (value) data[key] = value; });
    onSubmit(data);
  };

  return (
    <form id="partners-create-form" onSubmit={handleSubmit} className="space-y-4">
      {fields[tab].map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{field.label}{field.required ? " *" : ""}</span>
          {field.key === "partnerId" ? (
            <select name={field.key} required={field.required} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white">
              <option value="">{locale === "ar" ? "اختر الشريك" : "Select partner"}</option>
              {partners.map((partner) => (
                <option key={String(partner.id)} value={String(partner.id)}>{String(partner.fullName ?? partner.companyName ?? partner.id)}</option>
              ))}
            </select>
          ) : field.options ? (
            <select name={field.key} required={field.required} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white">
              <option value="">—</option>
              {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input name={field.key} required={field.required} type={field.type ?? "text"} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white" />
          )}
        </label>
      ))}
      {tab === "agreements" && partners.length === 0 && (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-700">
          {locale === "ar" ? "لا يوجد شركاء بعد. أضف الشريك أولاً ثم أنشئ الاتفاقية." : "No partners exist yet. Create the partner first, then add the agreement."}
        </p>
      )}
    </form>
  );
}
