import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  BadgeDollarSign,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Layers3,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  UsersRound
} from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { Badge, SectionHeader, Surface } from "../components/ui";

type Tab = "overview" | "receipt" | "settlements" | "templates" | "structure" | "saas";
type AnyRow = Record<string, any>;

type Rule = {
  id: string;
  label: string;
  beneficiaryId: string;
  kind: "percent" | "fixed" | "remaining";
  value: number;
  applyTo: "pool" | "remaining";
  order: number;
};

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

const fieldClass = "w-full rounded-xl border border-prootech-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-prootech-violet";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-prootech-violet px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-prootech-violet-light disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-prootech-line bg-white px-3 py-2 text-xs font-medium text-prootech-text-muted transition hover:bg-prootech-muted hover:text-prootech-black";

export function OwnershipPage() {
  const locale = useAppStore((state) => state.locale);
  const isAr = locale === "ar";
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [month, setMonth] = useState(currentMonth());

  const overviewQuery = useQuery({
    queryKey: ["ownership-overview", month],
    queryFn: () => api.ownershipOverview(month)
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["ownership-overview"] });
  const data = overviewQuery.data;

  const tabs: Array<{ id: Tab; label: string; icon: any }> = [
    { id: "overview", label: isAr ? "نظرة عامة" : "Overview", icon: BadgeDollarSign },
    { id: "receipt", label: isAr ? "تسجيل دفعة" : "Receive Payment", icon: ArrowDownToLine },
    { id: "settlements", label: isAr ? "التسويات" : "Settlements", icon: CreditCard },
    { id: "templates", label: isAr ? "قوالب النسب" : "Distribution Rules", icon: Settings2 },
    { id: "structure", label: isAr ? "الأقسام والشركاء" : "Structure", icon: Layers3 },
    { id: "saas", label: "SaaS", icon: Boxes }
  ];

  if (overviewQuery.isLoading || !data) {
    return <div className="grid min-h-[420px] place-items-center text-sm text-prootech-text-muted">{isAr ? "جاري تحميل نظام التوزيع المالي..." : "Loading financial distribution..."}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-medium text-white/60">
              <CircleDollarSign size={13} /> Prootech Ownership & Distribution
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {isAr ? "التوزيع المالي والشراكات والتسويات" : "Financial distribution, ownership, and settlements"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              {isAr
                ? "كل دفعة مقبوضة تتوزع فوراً حسب القالب الفعّال، مع حفظ نسخة النسب وقت القبض، وتتبع المستحق والمدفوع والمتبقي لكل شخص بدون فواصل عشرية."
                : "Every received payment is distributed immediately using the active rule snapshot, with beneficiary dues and payouts tracked as whole currency units."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none" />
            <button onClick={refresh} className="rounded-xl border border-white/15 bg-white/10 p-2.5 text-white/80 hover:bg-white/15" title="Refresh"><RefreshCw size={16} /></button>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-xl border border-prootech-line bg-white p-2 shadow-card">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === item.id ? "bg-prootech-violet text-white" : "text-prootech-text-muted hover:bg-prootech-muted hover:text-prootech-black"}`}>
              <Icon size={15} /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab data={data} isAr={isAr} />}
      {tab === "receipt" && <ReceiptTab data={data} isAr={isAr} onDone={refresh} />}
      {tab === "settlements" && <SettlementsTab data={data} isAr={isAr} month={month} onDone={refresh} />}
      {tab === "templates" && <TemplatesTab data={data} isAr={isAr} onDone={refresh} />}
      {tab === "structure" && <StructureTab data={data} isAr={isAr} onDone={refresh} />}
      {tab === "saas" && <SaasTab data={data} isAr={isAr} onDone={refresh} />}
    </motion.div>
  );
}

function CurrencyCards({ values, title }: { values: Record<string, number> | undefined; title: string }) {
  const entries = Object.entries(values ?? {});
  return (
    <div>
      <p className="text-xs font-medium text-prootech-text-muted">{title}</p>
      <div className="mt-2 space-y-1">
        {entries.length ? entries.map(([currency, value]) => <strong key={currency} className="block text-xl font-semibold tracking-tight">{money(value, currency)}</strong>) : <strong className="block text-xl font-semibold">—</strong>}
      </div>
    </div>
  );
}

function OverviewTab({ data, isAr }: { data: AnyRow; isAr: boolean }) {
  const dueRows = data.settlement?.rows ?? [];
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Surface className="p-5"><CurrencyCards title={isAr ? "المقبوض هذا الشهر" : "Received this month"} values={data.kpis?.receivedByCurrency} /></Surface>
        <Surface className="p-5"><CurrencyCards title={isAr ? "إجمالي المستحق غير المدفوع" : "Outstanding beneficiary dues"} values={data.kpis?.outstandingByCurrency} /></Surface>
        <Surface className="p-5"><CurrencyCards title="SaaS MRR" values={data.kpis?.saasMrrByCurrency} /></Surface>
        <Surface className="p-5">
          <p className="text-xs font-medium text-prootech-text-muted">{isAr ? "الاشتراكات الفعالة / دفعات الشهر" : "Active subscriptions / receipts"}</p>
          <strong className="mt-2 block text-xl font-semibold">{data.kpis?.activeSubscriptions ?? 0} / {data.kpis?.receiptsCount ?? 0}</strong>
        </Surface>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Surface className="p-5">
          <SectionHeader title={isAr ? `مستحقات ${data.month}` : `Dues for ${data.month}`} subtitle={isAr ? "يتضمن الرصيد المرحّل من الأشهر السابقة" : "Includes carried outstanding balance"} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-prootech-line text-xs text-prootech-text-muted"><th className="px-2 py-2 text-start">{isAr ? "المستفيد" : "Beneficiary"}</th><th className="px-2 py-2 text-end">{isAr ? "مرحّل" : "Opening"}</th><th className="px-2 py-2 text-end">{isAr ? "استحقاق الشهر" : "Earned"}</th><th className="px-2 py-2 text-end">{isAr ? "مدفوع" : "Paid"}</th><th className="px-2 py-2 text-end">{isAr ? "المتبقي" : "Due"}</th></tr></thead>
              <tbody>
                {dueRows.slice(0, 8).map((row: AnyRow) => (
                  <tr key={`${row.beneficiaryId}-${row.currencyCode}`} className="border-b border-prootech-line/70 last:border-0">
                    <td className="px-2 py-3 font-medium">{row.beneficiaryName}</td>
                    <td className="px-2 py-3 text-end text-prootech-text-muted">{money(row.openingOutstanding, row.currencyCode)}</td>
                    <td className="px-2 py-3 text-end">{money(row.earnedThisMonth, row.currencyCode)}</td>
                    <td className="px-2 py-3 text-end text-emerald-700">{money(row.paidThisMonth, row.currencyCode)}</td>
                    <td className="px-2 py-3 text-end font-semibold text-prootech-violet">{money(row.dueNow, row.currencyCode)}</td>
                  </tr>
                ))}
                {!dueRows.length && <tr><td colSpan={5} className="py-10 text-center text-sm text-prootech-text-muted">{isAr ? "لا توجد استحقاقات بعد. سجّل أول دفعة." : "No dues yet. Receive the first payment."}</td></tr>}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeader title={isAr ? "آخر الدفعات المقبوضة" : "Recent receipts"} />
          <div className="space-y-2">
            {(data.recentReceipts ?? []).slice(0, 8).map((receipt: AnyRow) => (
              <div key={receipt.id} className="flex items-center justify-between gap-3 rounded-xl border border-prootech-line p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{receipt.clientName || receipt.sourceId || (isAr ? "دفعة" : "Payment")}</p>
                  <p className="mt-0.5 text-xs text-prootech-text-muted">{String(receipt.receivedAt ?? "").slice(0, 10)} · {receipt.sourceType}</p>
                </div>
                <strong className="shrink-0 text-sm">{money(receipt.amount, receipt.currencyCode)}</strong>
              </div>
            ))}
            {!data.recentReceipts?.length && <p className="py-8 text-center text-sm text-prootech-text-muted">{isAr ? "لا توجد دفعات." : "No receipts."}</p>}
          </div>
        </Surface>
      </section>
    </div>
  );
}

function ReceiptTab({ data, isAr, onDone }: { data: AnyRow; isAr: boolean; onDone: () => void }) {
  const [sourceType, setSourceType] = useState("project");
  const [projectId, setProjectId] = useState(data.projects?.[0]?.id ?? "");
  const [subscriptionId, setSubscriptionId] = useState(data.saasSubscriptions?.[0]?.id ?? "");
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [deductions, setDeductions] = useState("0");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [receivedAt, setReceivedAt] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [templateId, setTemplateId] = useState("");
  const [reference, setReference] = useState("");
  const [lastResult, setLastResult] = useState<AnyRow | null>(null);

  const receive = useMutation({
    mutationFn: () => api.createOwnershipReceipt({ sourceType, projectId: sourceType === "project" ? projectId : undefined, subscriptionId: sourceType === "saas" ? subscriptionId : undefined, clientName: sourceType === "other" ? clientName : undefined, amount: Number(amount), deductions: Number(deductions), currencyCode, receivedAt, paymentMethod, templateId: templateId || undefined, reference }),
    onSuccess: (result) => {
      setLastResult(result);
      setAmount("");
      setReference("");
      onDone();
    }
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Surface className="p-5">
        <SectionHeader title={isAr ? "تسجيل دفعة مقبوضة" : "Record received payment"} subtitle={isAr ? "التوزيع يتم فور الحفظ وبنسخة ثابتة من نسب اليوم." : "Distribution happens immediately using a frozen rule snapshot."} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "نوع الدفعة" : "Source"}</span><select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className={fieldClass}><option value="project">{isAr ? "مشروع" : "Project"}</option><option value="saas">SaaS</option><option value="other">{isAr ? "أخرى" : "Other"}</option></select></label>
          {sourceType === "project" && <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "المشروع" : "Project"}</span><select value={projectId} onChange={(e) => { setProjectId(e.target.value); const p = data.projects.find((x: AnyRow) => x.id === e.target.value); if (p?.currencyCode) setCurrencyCode(p.currencyCode); }} className={fieldClass}>{(data.projects ?? []).map((p: AnyRow) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
          {sourceType === "saas" && <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "الاشتراك" : "Subscription"}</span><select value={subscriptionId} onChange={(e) => { setSubscriptionId(e.target.value); const s = data.saasSubscriptions.find((x: AnyRow) => x.id === e.target.value); if (s?.currencyCode) setCurrencyCode(s.currencyCode); }} className={fieldClass}><option value="">—</option>{(data.saasSubscriptions ?? []).filter((s: AnyRow) => s.status !== "archived").map((s: AnyRow) => <option key={s.id} value={s.id}>{s.clientName} · {money(s.monthlyFee, s.currencyCode)}</option>)}</select></label>}
          {sourceType === "other" && <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "العميل / الوصف" : "Client / label"}</span><input value={clientName} onChange={(e) => setClientName(e.target.value)} className={fieldClass} /></label>}
          <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "المبلغ المقبوض" : "Amount received"}</span><input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldClass} /></label>
          <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "مصاريف تخصم قبل التوزيع (إن كان القالب Net)" : "Deductions before split (Net templates)"}</span><input type="number" min="0" step="1" value={deductions} onChange={(e) => setDeductions(e.target.value)} className={fieldClass} /></label>
          <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "العملة" : "Currency"}</span><select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className={fieldClass}><option>USD</option><option>AED</option><option>SYP</option><option>EUR</option><option>SAR</option></select></label>
          <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "تاريخ القبض" : "Received date"}</span><input type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} className={fieldClass} /></label>
          <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "طريقة الدفع" : "Method"}</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={fieldClass}><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="sham_cash">Sham Cash</option><option value="card">Card</option><option value="other">Other</option></select></label>
          <label><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "القالب" : "Template"}</span><select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={fieldClass}><option value="">{isAr ? "تلقائي حسب القسم/الخدمة" : "Auto resolve"}</option>{(data.templates ?? []).filter((t: AnyRow) => t.status !== "archived").map((t: AnyRow) => <option key={t.id} value={t.id}>{t.name} · v{t.version}</option>)}</select></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-xs text-prootech-text-muted">{isAr ? "مرجع / ملاحظة" : "Reference"}</span><input value={reference} onChange={(e) => setReference(e.target.value)} className={fieldClass} placeholder="Receipt / transfer reference" /></label>
        </div>
        {receive.error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{receive.error.message}</p>}
        <button onClick={() => receive.mutate()} disabled={receive.isPending || !amount || (sourceType === "project" && !projectId) || (sourceType === "saas" && !subscriptionId)} className={`${buttonClass} mt-5 w-full`}><CheckCircle2 size={16} />{receive.isPending ? (isAr ? "جاري التوزيع..." : "Distributing...") : (isAr ? "تأكيد القبض وتوزيع الدفعة" : "Confirm & distribute")}</button>
      </Surface>

      <Surface className="p-5">
        <SectionHeader title={isAr ? "نتيجة آخر توزيع" : "Last distribution result"} />
        {!lastResult ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-prootech-line bg-prootech-muted/40 p-8 text-center text-sm leading-7 text-prootech-text-muted">{isAr ? "بعد تسجيل الدفعة ستظهر هنا حصة كل شخص فوراً، والمجموع سيبقى مطابقاً للمبلغ القابل للتوزيع بدون فواصل." : "After receiving a payment, each beneficiary allocation will appear here immediately."}</div>
        ) : (
          <div>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-prootech-muted p-4"><p className="text-xs text-prootech-text-muted">{isAr ? "المقبوض" : "Received"}</p><strong className="mt-1 block">{money(lastResult.receipt.amount, lastResult.receipt.currencyCode)}</strong></div>
              <div className="rounded-xl bg-prootech-muted p-4"><p className="text-xs text-prootech-text-muted">{isAr ? "الخصومات" : "Deductions"}</p><strong className="mt-1 block">{money(lastResult.receipt.deductions, lastResult.receipt.currencyCode)}</strong></div>
              <div className="rounded-xl bg-prootech-violet-soft p-4"><p className="text-xs text-prootech-violet">{isAr ? "القابل للتوزيع" : "Distributed pool"}</p><strong className="mt-1 block text-prootech-violet">{money(lastResult.allocation.distributableAmount, lastResult.receipt.currencyCode)}</strong></div>
            </div>
            <div className="space-y-2">
              {(lastResult.allocation.lines ?? []).map((line: AnyRow) => (
                <div key={line.id} className="flex items-center justify-between rounded-xl border border-prootech-line p-4"><div><p className="text-sm font-semibold">{line.beneficiaryName}</p><p className="mt-0.5 text-xs text-prootech-text-muted">{line.ruleLabel}</p></div><strong>{money(line.amount, lastResult.receipt.currencyCode)}</strong></div>
              ))}
            </div>
          </div>
        )}
      </Surface>
    </div>
  );
}

function SettlementsTab({ data, isAr, month, onDone }: { data: AnyRow; isAr: boolean; month: string; onDone: () => void }) {
  const rows = data.settlement?.rows ?? [];
  const pay = useMutation({
    mutationFn: (payload: AnyRow) => api.payOwnershipSettlement(payload),
    onSuccess: onDone
  });
  const payPartial = (row: AnyRow) => {
    const entered = window.prompt(isAr ? `المستحق ${money(row.dueNow, row.currencyCode)}. أدخل المبلغ الجزئي:` : `Due ${money(row.dueNow, row.currencyCode)}. Enter partial amount:`);
    if (!entered) return;
    pay.mutate({ beneficiaryId: row.beneficiaryId, currencyCode: row.currencyCode, amount: Number(entered), paidAt: today(), paymentMethod: "manual", note: `Settlement ${month}` });
  };

  return (
    <Surface className="p-5">
      <SectionHeader title={isAr ? `تسوية شهر ${month}` : `Monthly settlement · ${month}`} subtitle={isAr ? "المتبقي القديم يترحّل تلقائياً، والمدفوع يُسجل بتاريخ الدفع." : "Prior unpaid balance carries forward automatically."} />
      {pay.error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{pay.error.message}</p>}
      <div className="space-y-3">
        {rows.map((row: AnyRow) => (
          <div key={`${row.beneficiaryId}-${row.currencyCode}`} className="rounded-xl border border-prootech-line p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2"><h3 className="font-semibold">{row.beneficiaryName}</h3><Badge variant={row.dueNow > 0 ? "warning" : "success"}>{row.currencyCode}</Badge></div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-prootech-text-muted"><span>{isAr ? "مرحّل:" : "Opening:"} <b className="text-prootech-black">{money(row.openingOutstanding, row.currencyCode)}</b></span><span>{isAr ? "استحقاق الشهر:" : "Earned:"} <b className="text-prootech-black">{money(row.earnedThisMonth, row.currencyCode)}</b></span><span>{isAr ? "مدفوع الشهر:" : "Paid:"} <b className="text-emerald-700">{money(row.paidThisMonth, row.currencyCode)}</b></span></div>
                {!!row.sources?.length && <div className="mt-3 flex flex-wrap gap-1.5">{row.sources.slice(0, 6).map((source: AnyRow, index: number) => <span key={`${source.label}-${index}`} className="rounded-full bg-prootech-muted px-2.5 py-1 text-[0.68rem] text-prootech-text-muted">{source.label}: {money(source.amount, row.currencyCode)}</span>)}</div>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <strong className="text-xl text-prootech-violet">{money(row.dueNow, row.currencyCode)}</strong>
                {row.dueNow > 0 && <div className="flex gap-2"><button disabled={pay.isPending} onClick={() => payPartial(row)} className={secondaryButton}>{isAr ? "دفع جزئي" : "Partial"}</button><button disabled={pay.isPending} onClick={() => pay.mutate({ beneficiaryId: row.beneficiaryId, currencyCode: row.currencyCode, paidAt: today(), paymentMethod: "manual", note: `Full settlement ${month}` })} className={buttonClass}>{isAr ? "تم دفع كامل المستحق" : "Pay all due"}</button></div>}
              </div>
            </div>
          </div>
        ))}
        {!rows.length && <div className="py-14 text-center text-sm text-prootech-text-muted">{isAr ? "لا توجد استحقاقات لهذا الشهر." : "No settlement rows for this month."}</div>}
      </div>
    </Surface>
  );
}

function TemplatesTab({ data, isAr, onDone }: { data: AnyRow; isAr: boolean; onDone: () => void }) {
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState("global");
  const [newScopeId, setNewScopeId] = useState("all");
  const createTemplate = useMutation({
    mutationFn: () => api.createOwnershipTemplate({ name: newName, code: newName.toUpperCase().replace(/\s+/g, "_"), scopeType: newScope, scopeId: newScopeId || "all", isDefault: false, expenseBasis: "gross", roundingMode: "nearest", roundingBeneficiaryId: "ben_office", rules: [{ id: `remaining_${Date.now()}`, label: isAr ? "الباقي" : "Remaining", beneficiaryId: "ben_office", kind: "remaining", value: 0, applyTo: "remaining", order: 100 }] }),
    onSuccess: () => { setNewName(""); onDone(); }
  });

  return (
    <div className="space-y-5">
      <Surface className="p-5">
        <SectionHeader title={isAr ? "إنشاء قالب توزيع جديد" : "Create distribution template"} subtitle={isAr ? "يمكن ربطه بالشركة كلها أو قسم أو خدمة أو مشروع أو SaaS." : "Scope it globally or to a department, service, project, or SaaS."} />
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_1fr_auto]">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className={fieldClass} placeholder={isAr ? "اسم القالب" : "Template name"} />
          <select value={newScope} onChange={(e) => setNewScope(e.target.value)} className={fieldClass}><option value="global">Global</option><option value="department">Department</option><option value="service">Service</option><option value="project">Project</option><option value="saas">SaaS</option></select>
          <ScopeSelector scopeType={newScope} value={newScopeId} onChange={setNewScopeId} data={data} />
          <button disabled={!newName || createTemplate.isPending} onClick={() => createTemplate.mutate()} className={buttonClass}><Plus size={16} />{isAr ? "إضافة" : "Add"}</button>
        </div>
      </Surface>

      <div className="grid gap-5 xl:grid-cols-2">
        {(data.templates ?? []).filter((template: AnyRow) => template.status !== "archived").map((template: AnyRow) => <TemplateEditor key={`${template.id}-${template.version}`} template={template} beneficiaries={data.beneficiaries ?? []} isAr={isAr} onDone={onDone} />)}
      </div>
    </div>
  );
}

function ScopeSelector({ scopeType, value, onChange, data }: { scopeType: string; value: string; onChange: (value: string) => void; data: AnyRow }) {
  if (scopeType === "global") return <select value="all" className={fieldClass} disabled><option value="all">All</option></select>;
  if (scopeType === "department") return <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}><option value="">—</option>{(data.structure ?? []).filter((x: AnyRow) => x.kind === "department" && x.status !== "archived").map((x: AnyRow) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  if (scopeType === "service") return <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}><option value="">—</option>{(data.structure ?? []).filter((x: AnyRow) => x.kind === "service" && x.status !== "archived").map((x: AnyRow) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  if (scopeType === "project") return <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}><option value="">—</option>{(data.projects ?? []).map((x: AnyRow) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  return <select value={value || "all"} onChange={(e) => onChange(e.target.value)} className={fieldClass}><option value="all">All SaaS</option>{(data.saasProducts ?? []).map((x: AnyRow) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>;
}

function TemplateEditor({ template, beneficiaries, isAr, onDone }: { template: AnyRow; beneficiaries: AnyRow[]; isAr: boolean; onDone: () => void }) {
  const [name, setName] = useState(String(template.name ?? ""));
  const [expenseBasis, setExpenseBasis] = useState(String(template.expenseBasis ?? "gross"));
  const [roundingBeneficiaryId, setRoundingBeneficiaryId] = useState(String(template.roundingBeneficiaryId ?? "ben_office"));
  const [rules, setRules] = useState<Rule[]>(() => (template.rules ?? []).map((rule: AnyRow, index: number) => ({ id: String(rule.id ?? `rule_${index}`), label: String(rule.label ?? ""), beneficiaryId: String(rule.beneficiaryId ?? ""), kind: rule.kind ?? "percent", value: Number(rule.value ?? 0), applyTo: rule.applyTo ?? "pool", order: Number(rule.order ?? (index + 1) * 10) })));
  const save = useMutation({ mutationFn: () => api.updateOwnershipTemplate(template.id, { name, expenseBasis, roundingBeneficiaryId, rules }), onSuccess: onDone });

  const updateRule = (index: number, patch: Partial<Rule>) => setRules((current) => current.map((rule, i) => i === index ? { ...rule, ...patch } : rule));
  const removeRule = (index: number) => setRules((current) => current.filter((_, i) => i !== index));
  const addRule = () => setRules((current) => [...current, { id: `rule_${Date.now()}`, label: isAr ? "حصة جديدة" : "New share", beneficiaryId: beneficiaries[0]?.id ?? "", kind: "percent", value: 0, applyTo: "pool", order: (current.length + 1) * 10 }]);
  const poolPercent = rules.filter((r) => r.kind === "percent" && r.applyTo === "pool").reduce((sum, r) => sum + Number(r.value || 0), 0);

  return (
    <Surface className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3"><div><input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-base font-semibold outline-none" /><p className="mt-1 text-xs text-prootech-text-muted">{template.scopeType} · {template.scopeId} · v{template.version}</p></div>{template.isDefault && <Badge variant="violet">Default</Badge>}</div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label><span className="mb-1 block text-[0.68rem] text-prootech-text-muted">{isAr ? "أساس المصاريف" : "Expense basis"}</span><select value={expenseBasis} onChange={(e) => setExpenseBasis(e.target.value)} className={fieldClass}><option value="gross">Gross · {isAr ? "النسب قبل المصاريف" : "before expenses"}</option><option value="net">Net · {isAr ? "خصم المصاريف أولاً" : "deduct first"}</option></select></label>
        <label><span className="mb-1 block text-[0.68rem] text-prootech-text-muted">{isAr ? "مستفيد فرق التقريب" : "Rounding beneficiary"}</span><select value={roundingBeneficiaryId} onChange={(e) => setRoundingBeneficiaryId(e.target.value)} className={fieldClass}>{beneficiaries.filter((b) => b.status !== "archived").map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      </div>
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <div key={rule.id} className="grid gap-2 rounded-xl border border-prootech-line p-3 sm:grid-cols-[1.1fr_1fr_0.75fr_0.65fr_0.75fr_auto]">
            <input value={rule.label} onChange={(e) => updateRule(index, { label: e.target.value })} className={fieldClass} placeholder={isAr ? "الوصف" : "Label"} />
            <select value={rule.beneficiaryId} onChange={(e) => updateRule(index, { beneficiaryId: e.target.value })} className={fieldClass}>{beneficiaries.filter((b) => b.status !== "archived").map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            <select value={rule.kind} onChange={(e) => updateRule(index, { kind: e.target.value as Rule["kind"] })} className={fieldClass}><option value="percent">%</option><option value="fixed">{isAr ? "ثابت" : "Fixed"}</option><option value="remaining">{isAr ? "الباقي" : "Remaining"}</option></select>
            <input disabled={rule.kind === "remaining"} type="number" min="0" step="1" value={rule.value} onChange={(e) => updateRule(index, { value: Number(e.target.value) })} className={fieldClass} />
            <select disabled={rule.kind !== "percent"} value={rule.applyTo} onChange={(e) => updateRule(index, { applyTo: e.target.value as Rule["applyTo"] })} className={fieldClass}><option value="pool">{isAr ? "من الأصل" : "Original pool"}</option><option value="remaining">{isAr ? "من الباقي" : "Remaining"}</option></select>
            <button onClick={() => removeRule(index)} className="rounded-xl border border-red-100 px-3 text-xs text-red-600 hover:bg-red-50">×</button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><button onClick={addRule} className={secondaryButton}><Plus size={14} />{isAr ? "إضافة حصة" : "Add rule"}</button><span className={`text-xs ${poolPercent > 100 ? "text-red-600" : "text-prootech-text-muted"}`}>{isAr ? "نسب من الأصل:" : "Pool %:"} {poolPercent}%</span></div>
        <button disabled={save.isPending || poolPercent > 100 || !rules.length} onClick={() => save.mutate()} className={buttonClass}><Save size={15} />{isAr ? "حفظ النسب" : "Save rules"}</button>
      </div>
      {save.error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{save.error.message}</p>}
    </Surface>
  );
}

function StructureTab({ data, isAr, onDone }: { data: AnyRow; isAr: boolean; onDone: () => void }) {
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState("partner");
  const [structureName, setStructureName] = useState("");
  const [kind, setKind] = useState("service");
  const [parentId, setParentId] = useState("dept_programming");
  const departments = (data.structure ?? []).filter((x: AnyRow) => x.kind === "department" && x.status !== "archived");
  const services = (data.structure ?? []).filter((x: AnyRow) => x.kind === "service" && x.status !== "archived");
  const addBeneficiary = useMutation({ mutationFn: () => api.create("/ownership/beneficiaries", { name: beneficiaryName, beneficiaryType, code: beneficiaryName.toUpperCase().replace(/\s+/g, "_"), status: "active" }), onSuccess: () => { setBeneficiaryName(""); onDone(); } });
  const addStructure = useMutation({ mutationFn: () => api.create("/ownership/structure", { name: structureName, kind, parentId: kind === "service" ? parentId : undefined, code: structureName.toUpperCase().replace(/\s+/g, "_"), status: "active" }), onSuccess: () => { setStructureName(""); onDone(); } });

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Surface className="p-5">
          <SectionHeader title={isAr ? "المستفيدون والشركاء" : "Beneficiaries & partners"} subtitle={isAr ? "أي شخص أو صندوق يمكن أن يدخل في قواعد التوزيع." : "Anyone or any pool that can receive a share."} />
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_0.7fr_auto]"><input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} className={fieldClass} placeholder={isAr ? "اسم الشخص / الجهة" : "Name"} /><select value={beneficiaryType} onChange={(e) => setBeneficiaryType(e.target.value)} className={fieldClass}><option value="partner">Partner</option><option value="manager">Manager</option><option value="office">Office</option><option value="work_pool">Work Pool</option><option value="contractor">Contractor</option></select><button disabled={!beneficiaryName} onClick={() => addBeneficiary.mutate()} className={buttonClass}><Plus size={15} /></button></div>
          <div className="grid gap-2 sm:grid-cols-2">{(data.beneficiaries ?? []).filter((b: AnyRow) => b.status !== "archived").map((b: AnyRow) => <div key={b.id} className="rounded-xl border border-prootech-line p-3"><p className="text-sm font-semibold">{b.name}</p><p className="mt-1 text-xs text-prootech-text-muted">{b.beneficiaryType} · {b.code}</p></div>)}</div>
        </Surface>

        <Surface className="p-5">
          <SectionHeader title={isAr ? "الأقسام والخدمات" : "Departments & services"} />
          <div className="mb-4 grid gap-2 sm:grid-cols-[0.65fr_1fr_1fr_auto]"><select value={kind} onChange={(e) => setKind(e.target.value)} className={fieldClass}><option value="department">{isAr ? "قسم" : "Department"}</option><option value="service">{isAr ? "خدمة / فرع" : "Service"}</option></select><input value={structureName} onChange={(e) => setStructureName(e.target.value)} className={fieldClass} placeholder={isAr ? "الاسم" : "Name"} />{kind === "service" ? <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={fieldClass}>{departments.map((d: AnyRow) => <option key={d.id} value={d.id}>{d.name}</option>)}</select> : <div />}<button disabled={!structureName} onClick={() => addStructure.mutate()} className={buttonClass}><Plus size={15} /></button></div>
          <div className="space-y-3">{departments.map((department: AnyRow) => <div key={department.id} className="rounded-xl border border-prootech-line p-3"><div className="flex items-center gap-2"><Building2 size={15} className="text-prootech-violet" /><p className="text-sm font-semibold">{department.name}</p></div><div className="mt-2 flex flex-wrap gap-1.5">{services.filter((service: AnyRow) => service.parentId === department.id).map((service: AnyRow) => <Badge key={service.id}>{service.name}</Badge>)}</div></div>)}</div>
        </Surface>
      </div>

      <Surface className="p-5">
        <SectionHeader title={isAr ? "ربط المشاريع بالقسم والخدمة والقالب" : "Project distribution profiles"} subtitle={isAr ? "هذا الربط يحدد القالب تلقائياً عند تسجيل دفعة للمشروع." : "This controls automatic template resolution when receiving project payments."} />
        <div className="space-y-2">{(data.projects ?? []).map((project: AnyRow) => <ProjectProfileRow key={project.id} project={project} data={data} onDone={onDone} isAr={isAr} />)}</div>
      </Surface>
    </div>
  );
}

function ProjectProfileRow({ project, data, onDone, isAr }: { project: AnyRow; data: AnyRow; onDone: () => void; isAr: boolean }) {
  const existing = (data.projectProfiles ?? []).find((profile: AnyRow) => profile.projectId === project.id) ?? {};
  const departments = (data.structure ?? []).filter((x: AnyRow) => x.kind === "department" && x.status !== "archived");
  const [departmentId, setDepartmentId] = useState(String(existing.departmentId ?? departments[0]?.id ?? ""));
  const services = (data.structure ?? []).filter((x: AnyRow) => x.kind === "service" && x.parentId === departmentId && x.status !== "archived");
  const [serviceId, setServiceId] = useState(String(existing.serviceId ?? ""));
  const [templateId, setTemplateId] = useState(String(existing.templateId ?? ""));
  const save = useMutation({ mutationFn: () => api.upsertProjectDistributionProfile(project.id, { departmentId, serviceId, templateId: templateId || undefined }), onSuccess: onDone });

  return (
    <div className="grid gap-2 rounded-xl border border-prootech-line p-3 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1fr_auto] lg:items-center">
      <div><p className="text-sm font-semibold">{project.name}</p><p className="text-xs text-prootech-text-muted">{project.status} · {project.currencyCode}</p></div>
      <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setServiceId(""); }} className={fieldClass}>{departments.map((d: AnyRow) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={fieldClass}><option value="">{isAr ? "الخدمة" : "Service"}</option>{services.map((s: AnyRow) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={fieldClass}><option value="">{isAr ? "تلقائي حسب القسم" : "Auto by scope"}</option>{(data.templates ?? []).filter((t: AnyRow) => t.status !== "archived").map((t: AnyRow) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <button disabled={save.isPending} onClick={() => save.mutate()} className={secondaryButton}><Save size={14} />{isAr ? "حفظ" : "Save"}</button>
    </div>
  );
}

function SaasTab({ data, isAr, onDone }: { data: AnyRow; isAr: boolean; onDone: () => void }) {
  const [productName, setProductName] = useState("");
  const [productFee, setProductFee] = useState("");
  const [productCurrency, setProductCurrency] = useState("USD");
  const [productTemplate, setProductTemplate] = useState("tpl_saas");
  const [subProductId, setSubProductId] = useState(data.saasProducts?.[0]?.id ?? "");
  const [subClient, setSubClient] = useState("");
  const [subFee, setSubFee] = useState("");
  const [subCurrency, setSubCurrency] = useState("USD");
  const [billingDay, setBillingDay] = useState("1");

  const addProduct = useMutation({ mutationFn: () => api.create("/ownership/saas-products", { name: productName, code: productName.toUpperCase().replace(/\s+/g, "_"), defaultMonthlyFee: Number(productFee), currencyCode: productCurrency, templateId: productTemplate || undefined, status: "active" }), onSuccess: (row: AnyRow) => { setProductName(""); setProductFee(""); setSubProductId(row.id); onDone(); } });
  const addSubscription = useMutation({ mutationFn: () => api.create("/ownership/saas-subscriptions", { productId: subProductId, clientName: subClient, monthlyFee: Number(subFee), currencyCode: subCurrency, billingCycle: "monthly", billingDay: Number(billingDay), nextBillingDate: today(), status: "active" }), onSuccess: () => { setSubClient(""); setSubFee(""); onDone(); } });
  const productNameById = useMemo(() => Object.fromEntries((data.saasProducts ?? []).map((product: AnyRow) => [product.id, product.name])), [data.saasProducts]);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-2">
        <Surface className="p-5">
          <SectionHeader title={isAr ? "إضافة منتج SaaS" : "Add SaaS product"} />
          <div className="grid gap-3 sm:grid-cols-2"><input value={productName} onChange={(e) => setProductName(e.target.value)} className={fieldClass} placeholder={isAr ? "اسم المنتج" : "Product name"} /><input type="number" step="1" value={productFee} onChange={(e) => setProductFee(e.target.value)} className={fieldClass} placeholder={isAr ? "السعر الشهري الافتراضي" : "Default monthly fee"} /><select value={productCurrency} onChange={(e) => setProductCurrency(e.target.value)} className={fieldClass}><option>USD</option><option>AED</option><option>SYP</option><option>SAR</option></select><select value={productTemplate} onChange={(e) => setProductTemplate(e.target.value)} className={fieldClass}>{(data.templates ?? []).filter((t: AnyRow) => t.status !== "archived").map((t: AnyRow) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <button disabled={!productName || !productFee} onClick={() => addProduct.mutate()} className={`${buttonClass} mt-4`}><Plus size={15} />{isAr ? "إضافة المنتج" : "Add product"}</button>
        </Surface>

        <Surface className="p-5">
          <SectionHeader title={isAr ? "إضافة اشتراك عميل" : "Add customer subscription"} />
          <div className="grid gap-3 sm:grid-cols-2"><select value={subProductId} onChange={(e) => { setSubProductId(e.target.value); const p = data.saasProducts.find((x: AnyRow) => x.id === e.target.value); if (p) { setSubFee(String(p.defaultMonthlyFee ?? "")); setSubCurrency(String(p.currencyCode ?? "USD")); } }} className={fieldClass}><option value="">{isAr ? "اختر المنتج" : "Select product"}</option>{(data.saasProducts ?? []).filter((p: AnyRow) => p.status !== "archived").map((p: AnyRow) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input value={subClient} onChange={(e) => setSubClient(e.target.value)} className={fieldClass} placeholder={isAr ? "اسم العميل" : "Client name"} /><input type="number" step="1" value={subFee} onChange={(e) => setSubFee(e.target.value)} className={fieldClass} placeholder={isAr ? "الاشتراك الشهري" : "Monthly fee"} /><select value={subCurrency} onChange={(e) => setSubCurrency(e.target.value)} className={fieldClass}><option>USD</option><option>AED</option><option>SYP</option><option>SAR</option></select><input type="number" min="1" max="28" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className={fieldClass} placeholder="Billing day" /></div>
          <button disabled={!subProductId || !subClient || !subFee} onClick={() => addSubscription.mutate()} className={`${buttonClass} mt-4`}><Plus size={15} />{isAr ? "إضافة الاشتراك" : "Add subscription"}</button>
        </Surface>
      </section>

      <Surface className="p-5">
        <SectionHeader title={isAr ? "الاشتراكات الشهرية" : "Monthly subscriptions"} subtitle={isAr ? "استخدم تبويب تسجيل دفعة عند قبض اشتراك، وسيطبق قالب SaaS تلقائياً." : "Receive subscription payments from the payment tab; SaaS rules resolve automatically."} />
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-prootech-line text-xs text-prootech-text-muted"><th className="px-2 py-2 text-start">{isAr ? "العميل" : "Client"}</th><th className="px-2 py-2 text-start">{isAr ? "المنتج" : "Product"}</th><th className="px-2 py-2 text-end">MRR</th><th className="px-2 py-2 text-center">{isAr ? "يوم الفوترة" : "Billing day"}</th><th className="px-2 py-2 text-center">{isAr ? "الحالة" : "Status"}</th></tr></thead><tbody>{(data.saasSubscriptions ?? []).filter((s: AnyRow) => s.status !== "archived").map((s: AnyRow) => <tr key={s.id} className="border-b border-prootech-line/70"><td className="px-2 py-3 font-medium">{s.clientName}</td><td className="px-2 py-3 text-prootech-text-muted">{productNameById[s.productId] ?? s.productId}</td><td className="px-2 py-3 text-end font-semibold">{money(s.monthlyFee, s.currencyCode)}</td><td className="px-2 py-3 text-center">{s.billingDay ?? 1}</td><td className="px-2 py-3 text-center"><Badge variant="success">{s.status}</Badge></td></tr>)}</tbody></table></div>
      </Surface>
    </div>
  );
}
