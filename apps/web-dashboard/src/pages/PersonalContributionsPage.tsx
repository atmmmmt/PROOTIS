import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeDollarSign, Building2, CheckCircle2, Landmark, Plus, Save, WalletCards } from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { Badge, SectionHeader, Surface } from "../components/ui";

type AnyRow = Record<string, any>;

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value: unknown, currency = "USD") {
  const amount = Math.round(Number(value ?? 0));
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

const field = "w-full rounded-xl border border-prootech-line bg-white px-3 py-2.5 text-sm outline-none focus:border-prootech-violet";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-prootech-violet px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";

export function PersonalContributionsPage() {
  const locale = useAppStore((state) => state.locale);
  const user = useAppStore((state) => state.user);
  const isAr = locale === "ar";
  const canWrite = Boolean(user?.permissions?.includes("finance:write"));
  const qc = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const query = useQuery({
    queryKey: ["personal-contributions", month],
    queryFn: () => api.table<any>("/ownership/personal-contributions/overview", { month }).then((value) => value as any)
  });
  const data = query.data as AnyRow | undefined;
  const [rate, setRate] = useState("10");
  const [contributorId, setContributorId] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [salaryReceivedAt, setSalaryReceivedAt] = useState(today());
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (data?.ratePercent !== undefined) setRate(String(data.ratePercent));
    if (!contributorId && data?.contributors?.[0]?.id) setContributorId(String(data.contributors[0].id));
  }, [data, contributorId]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["personal-contributions"] });

  const saveRate = useMutation({
    mutationFn: () => api.action<any>("PATCH", "/ownership/personal-contributions/settings", { ratePercent: Number(rate) }),
    onSuccess: refresh
  });

  const create = useMutation({
    mutationFn: () => api.action<any>("POST", "/ownership/personal-contributions", {
      contributorBeneficiaryId: contributorId,
      employerName,
      salaryMonth: month,
      salaryReceivedAt,
      salaryAmount: Number(salaryAmount),
      currencyCode,
      reference
    }),
    onSuccess: () => {
      setSalaryAmount("");
      setEmployerName("");
      setReference("");
      refresh();
    }
  });

  const pay = useMutation({
    mutationFn: (id: string) => api.action<any>("POST", `/ownership/personal-contributions/${id}/pay`, { paymentMethod: "cash" }),
    onSuccess: refresh
  });

  const preview = useMemo(() => Math.round(Number(salaryAmount || 0) * Number(rate || 0) / 100), [salaryAmount, rate]);

  if (query.isLoading || !data) return <div className="grid min-h-80 place-items-center text-sm text-prootech-text-muted">{isAr ? "جاري تحميل مساهمات الدخل الشخصي..." : "Loading personal contributions..."}</div>;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-medium text-white/60"><Landmark size={13} /> Office Fund</div>
            <h1 className="text-2xl font-semibold sm:text-3xl">{isAr ? "مساهمة الدخل الشخصي للصندوق" : "Personal income contribution"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">{isAr ? "إذا اشتغل شريك أو موظف شغلاً شخصياً براتب شهري، تُحتسب النسبة المحددة من راتبه وتذهب حصراً لصندوق المكتب. لا تدخل ضمن توزيع المشاريع ولا تُقسم على الشركاء." : "A configurable share of personal salaried work goes only to the office fund. It never enters project partner distribution."}</p>
          </div>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Surface className="p-5">
          <SectionHeader title={isAr ? "إعداد النسبة" : "Contribution setting"} subtitle={isAr ? "تغييرها يطبق على الرواتب الجديدة فقط، والسجلات القديمة تحتفظ بالنسبة وقت تسجيلها." : "Changes apply only to new salary records; old records keep their original rate."} />
          <label className="text-xs text-prootech-text-muted">{isAr ? "نسبة الصندوق من الراتب" : "Office fund rate"}<div className="mt-1 flex gap-2"><div className="relative flex-1"><input type="number" min="0" max="100" step="0.1" value={rate} disabled={!canWrite} onChange={(e) => setRate(e.target.value)} className={`${field} pe-10`} /><span className="absolute end-3 top-2.5 text-sm text-prootech-text-muted">%</span></div>{canWrite && <button onClick={() => saveRate.mutate()} disabled={saveRate.isPending} className={primary}><Save size={15} />{isAr ? "حفظ" : "Save"}</button>}</div></label>
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><strong>{isAr ? "الوجهة: صندوق المكتب فقط" : "Destination: office fund only"}</strong><p className="mt-1 text-xs opacity-80">{isAr ? "هذه المساهمة لا تنشئ أي حصة لأبو دان أو أحمد أو عبد اللطيف أو فريق التنفيذ." : "This contribution creates no share for partners or execution teams."}</p></div>
        </Surface>

        <Surface className="p-5">
          <SectionHeader title={isAr ? "تسجيل راتب / دخل شخصي" : "Record personal salary"} subtitle={isAr ? "نسجل الراتب كمرجع فقط؛ الداخل للصندوق هو قيمة المساهمة المحسوبة." : "The salary is reference data; only the calculated contribution enters the office fund."} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-prootech-text-muted">{isAr ? "الشخص" : "Contributor"}<select disabled={!canWrite} value={contributorId} onChange={(e) => setContributorId(e.target.value)} className={`mt-1 ${field}`}><option value="">—</option>{(data.contributors ?? []).map((item: AnyRow) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></label>
            <label className="text-xs text-prootech-text-muted">{isAr ? "الشركة / جهة العمل" : "Employer"}<input disabled={!canWrite} value={employerName} onChange={(e) => setEmployerName(e.target.value)} className={`mt-1 ${field}`} /></label>
            <label className="text-xs text-prootech-text-muted">{isAr ? "الراتب" : "Salary"}<input disabled={!canWrite} type="number" min="0" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} className={`mt-1 ${field}`} /></label>
            <label className="text-xs text-prootech-text-muted">{isAr ? "العملة" : "Currency"}<select disabled={!canWrite} value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className={`mt-1 ${field}`}><option>USD</option><option>AED</option><option>SYP</option><option>EUR</option><option>SAR</option></select></label>
            <label className="text-xs text-prootech-text-muted">{isAr ? "تاريخ قبض الراتب" : "Salary received"}<input disabled={!canWrite} type="date" value={salaryReceivedAt} onChange={(e) => setSalaryReceivedAt(e.target.value)} className={`mt-1 ${field}`} /></label>
            <label className="text-xs text-prootech-text-muted">{isAr ? "مرجع / ملاحظة قصيرة" : "Reference"}<input disabled={!canWrite} value={reference} onChange={(e) => setReference(e.target.value)} className={`mt-1 ${field}`} /></label>
          </div>
          <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl bg-prootech-muted p-4 sm:flex-row sm:items-center"><div><p className="text-xs text-prootech-text-muted">{isAr ? `مساهمة الصندوق حسب ${rate}%` : `Fund contribution at ${rate}%`}</p><strong className="mt-1 block text-xl text-prootech-violet">{money(preview, currencyCode)}</strong></div>{canWrite && <button onClick={() => create.mutate()} disabled={create.isPending || !contributorId || Number(salaryAmount) <= 0} className={primary}><Plus size={15} />{isAr ? "تسجيل الاستحقاق" : "Record due"}</button>}</div>
          {(create.error || saveRate.error) && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{(create.error ?? saveRate.error)?.message}</p>}
        </Surface>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(data.totalsByCurrency ?? {}).map(([currency, totals]: [string, any]) => <div key={currency} className="contents"><Kpi icon={BadgeDollarSign} label={isAr ? `رواتب مسجلة ${currency}` : `Recorded salaries ${currency}`} value={money(totals.salaryAmount, currency)} /><Kpi icon={Landmark} label={isAr ? "حصة الصندوق" : "Fund share"} value={money(totals.contributionAmount, currency)} /><Kpi icon={CheckCircle2} label={isAr ? "المدفوع للصندوق" : "Paid to fund"} value={money(totals.paidAmount, currency)} /><Kpi icon={WalletCards} label={isAr ? "متبقي لهذا الشهر" : "Month remaining"} value={money(totals.remainingAmount, currency)} /></div>)}
        {!Object.keys(data.totalsByCurrency ?? {}).length && <Surface className="p-5 sm:col-span-2 xl:col-span-4"><p className="text-sm text-prootech-text-muted">{isAr ? "لا توجد رواتب شخصية مسجلة لهذا الشهر." : "No personal salary records for this month."}</p></Surface>}
      </section>

      {Object.keys(data.carriedOutstandingByCurrency ?? {}).length > 0 && <Surface className="border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">{isAr ? "مساهمات مرحّلة غير مدفوعة من أشهر سابقة" : "Carried unpaid contributions"}</p><div className="mt-2 flex flex-wrap gap-2">{Object.entries(data.carriedOutstandingByCurrency).map(([currency, value]) => <Badge key={currency} variant="warning">{money(value, currency)}</Badge>)}</div></Surface>}

      <Surface className="p-5">
        <SectionHeader title={isAr ? `سجل مساهمات ${month}` : `Contribution register · ${month}`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead><tr className="border-b border-prootech-line text-xs text-prootech-text-muted"><th className="p-3 text-start">{isAr ? "الشخص" : "Person"}</th><th className="p-3 text-start">{isAr ? "جهة العمل" : "Employer"}</th><th className="p-3 text-end">{isAr ? "الراتب" : "Salary"}</th><th className="p-3 text-end">{isAr ? "النسبة" : "Rate"}</th><th className="p-3 text-end">{isAr ? "حصة الصندوق" : "Fund share"}</th><th className="p-3 text-end">{isAr ? "مدفوع" : "Paid"}</th><th className="p-3 text-end">{isAr ? "متبقي" : "Remaining"}</th><th className="p-3 text-end">{isAr ? "الحالة" : "Status"}</th></tr></thead>
            <tbody>{(data.rows ?? []).map((row: AnyRow) => <tr key={String(row.id)} className="border-b border-prootech-line/70"><td className="p-3 font-medium">{String(row.contributorName)}</td><td className="p-3 text-prootech-text-muted">{row.employerName || "—"}</td><td className="p-3 text-end">{money(row.salaryAmount, row.currencyCode)}</td><td className="p-3 text-end">{Number(row.ratePercent)}%</td><td className="p-3 text-end font-semibold">{money(row.contributionAmount, row.currencyCode)}</td><td className="p-3 text-end text-emerald-700">{money(row.paidAmount, row.currencyCode)}</td><td className="p-3 text-end font-semibold text-prootech-violet">{money(row.remainingAmount, row.currencyCode)}</td><td className="p-3 text-end">{Number(row.remainingAmount) > 0 && canWrite ? <button onClick={() => pay.mutate(String(row.id))} disabled={pay.isPending} className="rounded-lg bg-prootech-black px-3 py-1.5 text-xs font-semibold text-white">{isAr ? "تم الدفع" : "Mark paid"}</button> : <Badge variant="success">{isAr ? "مدفوع" : "Paid"}</Badge>}</td></tr>)}{!(data.rows ?? []).length && <tr><td colSpan={8} className="py-10 text-center text-sm text-prootech-text-muted">{isAr ? "لا يوجد سجلات." : "No records."}</td></tr>}</tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return <Surface className="p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-prootech-violet-soft text-prootech-violet"><Icon size={18} /></span><div><p className="text-xs text-prootech-text-muted">{label}</p><strong className="mt-1 block text-lg">{value}</strong></div></div></Surface>;
}
