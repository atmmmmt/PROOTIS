import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { t } from "../lib/i18n";
import { Surface, SectionHeader, StatusPill } from "../components/ui";

function useLocale() {
  const locale = useAppStore((s) => s.locale);
  return { locale };
}

const outcomeColors: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  failure: "bg-red-50 text-red-700 border-red-100"
};

export function AuditPage() {
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("");
  const [filterResource, setFilterResource] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const params: Record<string, string> = { page: String(page), pageSize: "20" };
  if (search) params.search = search;
  if (filterOutcome) params.outcome = filterOutcome;
  if (filterResource) params.resourceType = filterResource;

  const { data, isLoading } = useQuery({
    queryKey: ["audit", search, filterOutcome, filterResource, page],
    queryFn: () => api.table("/audit", params)
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:p-8">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-white/70" />
          <div>
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">
              {locale === "ar" ? "سجل التدقيق" : "Audit Log"}
            </p>
            <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em]">
              {locale === "ar" ? "كل الإجراءات مسجّلة وموثّقة" : "Every action logged and traceable"}
            </h1>
          </div>
        </div>
        <p className="mt-3 text-[0.8125rem] text-white/60">
          {locale === "ar"
            ? "سجل كامل لكل عملية كتابة: من قام بها، على أي سجل، ومتى."
            : "Full trail of every write: who did it, on which record, and when."}
        </p>
      </section>

      <Surface className="overflow-hidden">
        <div className="border-b border-prootech-line p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t(locale, "search_placeholder")}
              className="min-w-[180px] flex-1 rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2 text-sm outline-none transition focus:border-prootech-violet focus:bg-white"
            />
            <select
              value={filterOutcome}
              onChange={(e) => { setFilterOutcome(e.target.value); setPage(1); }}
              className="rounded-xl border border-prootech-line bg-prootech-muted px-3 py-2 text-sm outline-none focus:border-prootech-violet"
            >
              <option value="">{locale === "ar" ? "كل النتائج" : "All outcomes"}</option>
              <option value="success">{locale === "ar" ? "نجاح" : "Success"}</option>
              <option value="failure">{locale === "ar" ? "فشل" : "Failure"}</option>
            </select>
            <select
              value={filterResource}
              onChange={(e) => { setFilterResource(e.target.value); setPage(1); }}
              className="rounded-xl border border-prootech-line bg-prootech-muted px-3 py-2 text-sm outline-none focus:border-prootech-violet"
            >
              <option value="">{locale === "ar" ? "كل الموارد" : "All resources"}</option>
              {["auth", "crm", "finance", "hr", "projects", "partners", "ai", "users"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button onClick={() => qc.invalidateQueries({ queryKey: ["audit"] })} className="rounded-xl border border-prootech-line p-2 text-prootech-text-muted hover:bg-prootech-muted">
              <RefreshCw size={15} />
            </button>
            <span className="text-xs text-prootech-text-muted">{total} {locale === "ar" ? "إجراء" : "entries"}</span>
          </div>
        </div>

        <div className="divide-y divide-prootech-line">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-prootech-muted-strong" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-prootech-text-muted">{t(locale, "noRecords")}</div>
          ) : (
            rows.map((row) => (
              <div key={String(row.id)} className="flex items-start gap-4 px-4 py-3 hover:bg-prootech-muted transition-colors">
                <div className="mt-0.5">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium ${outcomeColors[String(row.outcome ?? "success")] ?? outcomeColors.success}`}>
                    {String(row.outcome ?? "success")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.8125rem] font-mono font-medium text-prootech-black">{String(row.action)}</span>
                    {Boolean(row.resourceType) && (
                      <span className="rounded-md bg-prootech-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-prootech-text-muted">
                        {String(row.resourceType)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-3 text-[0.75rem] text-prootech-text-muted">
                    <span>{locale === "ar" ? "المستخدم:" : "Actor:"} <strong className="text-prootech-black">{String(row.actorUserId)}</strong></span>
                    {Boolean(row.resourceId) && <span>{locale === "ar" ? "السجل:" : "Record:"} <code className="text-xs">{String(row.resourceId)}</code></span>}
                    {Boolean(row.ip) && <span>IP: {String(row.ip)}</span>}
                    {Boolean(row.durationMs) && <span>{String(row.durationMs)}ms</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[0.75rem] text-prootech-text-muted">{new Date(String(row.createdAt)).toLocaleString(locale === "ar" ? "ar-SY" : "en-US")}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between border-t border-prootech-line px-4 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-prootech-line px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-prootech-muted"
            >
              {locale === "ar" ? "السابق" : "Previous"}
            </button>
            <span className="text-xs text-prootech-text-muted">
              {locale === "ar" ? `صفحة ${page} من ${Math.ceil(total / 20)}` : `Page ${page} of ${Math.ceil(total / 20)}`}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="rounded-lg border border-prootech-line px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-prootech-muted"
            >
              {locale === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </Surface>
    </motion.div>
  );
}
