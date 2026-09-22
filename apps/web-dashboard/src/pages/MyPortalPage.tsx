import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BriefcaseBusiness, Building2, CircleDollarSign, Save, TrendingUp, WalletCards } from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { Badge, SectionHeader, Surface } from "../components/ui";

type AnyRow = Record<string, any>;

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(value: unknown, currency = "USD") {
  const amount = Math.round(Number(value ?? 0));
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function MyPortalPage() {
  const locale = useAppStore((state) => state.locale);
  const user = useAppStore((state) => state.user);
  const isAr = locale === "ar";
  const [month, setMonth] = useState(currentMonth());
  const query = useQuery({ queryKey: ["partner-portal", month], queryFn: () => api.partnerPortal(month) });
  const data = query.data;

  if (query.isLoading) return <div className="h-80 animate-pulse rounded-2xl bg-prootech-muted-strong" />;
  if (query.error) return <Surface className="p-6 text-sm text-red-700">{query.error.message}</Surface>;
  if (!data) return null;

  const currencies = Array.from(new Set([
    ...Object.keys(data.finance?.earningsByCurrency ?? {}),
    ...Object.keys(data.finance?.paidByCurrency ?? {}),
    ...Object.keys(data.finance?.outstandingByCurrency ?? {})
  ]));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[0.68rem] uppercase tracking-[0.08em] text-white/50">Partner Portal</p>
            <h1 className="text-[1.8rem] font-semibold">{isAr ? `أهلاً ${user?.fullName ?? ""}` : `Welcome ${user?.fullName ?? ""}`}</h1>
            <p className="mt-2 text-sm text-white/60">{isAr ? `حسابك مرتبط بـ ${data.beneficiary?.name ?? "—"}` : `Linked to ${data.beneficiary?.name ?? "—"}`}</p>
          </div>
          <label className="text-xs text-white/60">{isAr ? "الشهر" : "Month"}<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none" /></label>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {currencies.length === 0 ? (
          <Surface className="p-5 sm:col-span-3"><p className="text-sm text-prootech-text-muted">{isAr ? "لا توجد استحقاقات مسجلة لهذا الحساب بعد." : "No allocations recorded for this account yet."}</p></Surface>
        ) : currencies.map((currency) => (
          <div key={currency} className="contents">
            <MiniKpi icon={CircleDollarSign} label={isAr ? `استحقاق ${month}` : `Earned ${month}`} value={money(data.finance.earningsByCurrency?.[currency], currency)} />
            <MiniKpi icon={WalletCards} label={isAr ? "المدفوع هذا الشهر" : "Paid this month"} value={money(data.finance.paidByCurrency?.[currency], currency)} />
            <MiniKpi icon={Activity} label={isAr ? "المتبقي الحالي" : "Current outstanding"} value={money(data.finance.outstandingByCurrency?.[currency], currency)} />
          </div>
        ))}
      </section>

      {data.growth && (
        <Surface className="p-5">
          <SectionHeader title={isAr ? "تطور الشركة" : "Company Growth"} subtitle={isAr ? "مؤشرات تشغيلية عامة بدون كشف التفاصيل المالية الداخلية" : "High-level operating indicators without internal financial details"} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <GrowthItem label={isAr ? "مشاريع فعالة" : "Active projects"} value={data.growth.activeProjects} />
            <GrowthItem label={isAr ? "كل المشاريع" : "Total projects"} value={data.growth.totalProjects} />
            <GrowthItem label={isAr ? "عملاء فعالون" : "Active clients"} value={data.growth.activeClients} />
            <GrowthItem label={isAr ? "فرص مفتوحة" : "Open opportunities"} value={data.growth.openOpportunities} />
            <GrowthItem label={isAr ? "متابعون" : "Followers"} value={data.growth.socialFollowers} />
            <GrowthItem label={isAr ? "زيارات الموقع" : "Website sessions"} value={data.growth.websiteSessions} />
          </div>
        </Surface>
      )}

      <Surface className="p-5">
        <SectionHeader title={isAr ? "المشاريع المسموح لك الوصول إليها" : "Your accessible projects"} subtitle={isAr ? "التعديل يظهر فقط إذا المدير سمح بحقول محددة" : "Editing appears only for fields allowed by management"} />
        <div className="grid gap-3 lg:grid-cols-2">
          {(data.projects ?? []).map((project: AnyRow) => <ProjectCard key={String(project.id)} project={project} isAr={isAr} />)}
          {(data.projects ?? []).length === 0 && <p className="text-sm text-prootech-text-muted">{isAr ? "لا يوجد مشاريع ضمن صلاحياتك حالياً." : "No projects are currently in your access scope."}</p>}
        </div>
      </Surface>

      {(data.finance?.projectBreakdown ?? []).length > 0 && (
        <Surface className="p-5">
          <SectionHeader title={isAr ? "استحقاقاتي حسب المشروع" : "My earnings by project"} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead><tr className="border-b border-prootech-line text-start text-xs text-prootech-text-muted"><th className="p-3 text-start">{isAr ? "المشروع" : "Project"}</th><th className="p-3 text-start">{isAr ? "إجمالي مستحق" : "Earned"}</th><th className="p-3 text-start">{isAr ? "مدفوع" : "Paid"}</th><th className="p-3 text-start">{isAr ? "متبقي" : "Remaining"}</th></tr></thead>
              <tbody>{data.finance.projectBreakdown.map((row: AnyRow) => <tr key={`${row.projectId}-${row.currencyCode}`} className="border-b border-prootech-line/70"><td className="p-3 font-medium">{String(row.projectName)}</td><td className="p-3">{money(row.earned, row.currencyCode)}</td><td className="p-3">{money(row.paid, row.currencyCode)}</td><td className="p-3 font-semibold text-prootech-violet">{money(row.remaining, row.currencyCode)}</td></tr>)}</tbody>
            </table>
          </div>
        </Surface>
      )}
    </div>
  );
}

function MiniKpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return <Surface className="p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-prootech-violet-soft text-prootech-violet"><Icon size={18} /></span><div><p className="text-xs text-prootech-text-muted">{label}</p><strong className="mt-1 block text-xl">{value}</strong></div></div></Surface>;
}

function GrowthItem({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-xl border border-prootech-line bg-prootech-muted p-4"><p className="text-xs text-prootech-text-muted">{label}</p><p className="mt-2 text-xl font-semibold">{Number(value ?? 0).toLocaleString()}</p></div>;
}

function ProjectCard({ project, isAr }: { project: AnyRow; isAr: boolean }) {
  const qc = useQueryClient();
  const editable = new Set<string>(project.editableFields ?? []);
  const [status, setStatus] = useState(String(project.status ?? "active"));
  const [healthStatus, setHealthStatus] = useState(String(project.healthStatus ?? "green"));
  const mutation = useMutation({
    mutationFn: () => {
      const patch: Record<string, unknown> = {};
      if (editable.has("status")) patch.status = status;
      if (editable.has("healthStatus")) patch.healthStatus = healthStatus;
      return api.updatePartnerProject(String(project.id), patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partner-portal"] })
  });

  return (
    <div className="rounded-xl border border-prootech-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-semibold">{String(project.name)}</p><p className="mt-1 text-xs text-prootech-text-muted">{String(project.type ?? "project")}</p></div>
        <Badge variant={project.healthStatus === "red" ? "danger" : project.healthStatus === "amber" ? "warning" : "success"}>{String(project.healthStatus ?? project.status)}</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-prootech-text-muted">{isAr ? "حالة المشروع" : "Status"}{editable.has("status") ? <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-prootech-line px-2 py-2 text-sm"><option value="active">active</option><option value="on_hold">on_hold</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select> : <span className="mt-1 block text-sm text-prootech-black">{String(project.status)}</span>}</label>
        <label className="text-xs text-prootech-text-muted">{isAr ? "صحة المشروع" : "Health"}{editable.has("healthStatus") ? <select value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-prootech-line px-2 py-2 text-sm"><option value="green">green</option><option value="amber">amber</option><option value="red">red</option></select> : <span className="mt-1 block text-sm text-prootech-black">{String(project.healthStatus ?? "—")}</span>}</label>
      </div>
      {project.budgetAmount !== undefined && <p className="mt-3 text-xs text-prootech-text-muted">{isAr ? "الميزانية: " : "Budget: "}<strong className="text-prootech-black">{money(project.budgetAmount, project.currencyCode)}</strong></p>}
      {editable.size > 0 && <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-prootech-violet px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><Save size={13} />{mutation.isPending ? "..." : isAr ? "حفظ التعديل" : "Save"}</button>}
    </div>
  );
}
