import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, RefreshCw, CheckCircle, XCircle, Calculator, Lock, Play } from "lucide-react";
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

type Tab = "employees" | "leaveRequests" | "payrollRuns" | "payslips";

const tabs: { key: Tab; path: string }[] = [
  { key: "employees", path: "/hr/employees" },
  { key: "leaveRequests", path: "/hr/leave-requests" },
  { key: "payrollRuns", path: "/hr/payroll-runs" },
  { key: "payslips", path: "/hr/payslips" }
];

const columnConfig: Record<Tab, Array<{ key: string; label: string }>> = {
  employees: [
    { key: "employeeCode", label: "Code" },
    { key: "fullName", label: "Name" },
    { key: "title", label: "Title" },
    { key: "department", label: "Department" },
    { key: "baseSalary", label: "Salary" },
    { key: "status", label: "Status" }
  ],
  leaveRequests: [
    { key: "employeeId", label: "Employee" },
    { key: "leaveType", label: "Type" },
    { key: "startDate", label: "From" },
    { key: "endDate", label: "To" },
    { key: "daysCount", label: "Days" },
    { key: "status", label: "Status" }
  ],
  payrollRuns: [
    { key: "periodStart", label: "Period Start" },
    { key: "periodEnd", label: "Period End" },
    { key: "employeesCount", label: "Employees" },
    { key: "totalGross", label: "Gross" },
    { key: "totalNet", label: "Net" },
    { key: "status", label: "Status" }
  ],
  payslips: [
    { key: "employeeId", label: "Employee" },
    { key: "payrollRunId", label: "Payroll Run" },
    { key: "netPay", label: "Net Pay" },
    { key: "issuedAt", label: "Issued At" },
    { key: "status", label: "Status" }
  ]
};

export function HrPage() {
  const { locale } = useLocale();
  const [tab, setTab] = useState<Tab>("employees");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const currentTab = tabs.find((t) => t.key === tab)!;

  const { data, isLoading } = useQuery({
    queryKey: ["hr", tab, search],
    queryFn: () => api.table(currentTab.path, search ? { search } : undefined)
  });

  const { data: hrDash } = useQuery({ queryKey: ["hr-dashboard"], queryFn: api.hrDashboard });

  const rows = data?.rows ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.create(currentTab.path, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr", tab] }); setCreateOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(currentTab.path, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr", tab] }); setDeleteOpen(false); }
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (id: string) => api.action("PATCH", `/hr/leave-requests/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr", tab] })
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: (id: string) => api.action("PATCH", `/hr/leave-requests/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr", tab] })
  });

  const calculatePayrollMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/hr/payroll-runs/${id}/calculate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr", tab] })
  });

  const approvePayrollMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/hr/payroll-runs/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr", tab] })
  });

  const finalizePayrollMutation = useMutation({
    mutationFn: (id: string) => api.action("POST", `/hr/payroll-runs/${id}/finalize`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr", tab] }); qc.invalidateQueries({ queryKey: ["hr", "payslips"] }); }
  });

  const pendingLeave = rows.filter((r) => tab === "leaveRequests" && r.status === "pending");
  const headcount = hrDash?.headcount ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero */}
      <section className="flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">HR</p>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
            {locale === "ar" ? "الموارد البشرية والرواتب" : "HR and Payroll"}
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

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label={locale === "ar" ? "إجمالي الموظفين" : "Total Employees"} value={String(headcount || "—")} delta="active" tone="good" />
        <KpiCard label={locale === "ar" ? "إجازات معلقة" : "Pending Leave"} value={String(hrDash?.leaveRequests?.filter((l: any) => l.status === "pending").length ?? 0)} delta="review" tone="watch" />
        <KpiCard label={locale === "ar" ? "مسيرات الرواتب" : "Payroll Runs"} value={String(hrDash?.payrollRuns?.length ?? 0)} delta="this period" tone="neutral" />
        <KpiCard label={locale === "ar" ? "عقود منتهية" : "Expiring Contracts"} value={String(hrDash?.contractExpiries?.filter((c: any) => c.status === "active" && c.endDate && new Date(c.endDate as string) < new Date(Date.now() + 30 * 86400000)).length ?? 0)} delta="next 30 days" tone="watch" />
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
              {item.key === "leaveRequests" && (pendingLeave.length > 0 || (hrDash?.leaveRequests?.filter((l: any) => l.status === "pending").length ?? 0) > 0) && (
                <span className="ms-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                  {hrDash?.leaveRequests?.filter((l: any) => l.status === "pending").length ?? pendingLeave.length}
                </span>
              )}
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
            <button onClick={() => qc.invalidateQueries({ queryKey: ["hr", tab] })} className="rounded-xl border border-prootech-line p-2 text-prootech-text-muted hover:bg-prootech-muted">
              <RefreshCw size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-prootech-muted-strong" />
          ) : (
            <>
              <DataTable title={t(locale, tab)} rows={rows} columns={columnConfig[tab]} />

              {/* Leave Request Actions */}
              {tab === "leaveRequests" && rows.filter((r) => r.status === "pending").length > 0 && (
                <div className="mt-4">
                  <SectionHeader title={locale === "ar" ? "طلبات الإجازة المعلقة" : "Pending Leave Requests"} />
                  <div className="space-y-2">
                    {rows.filter((r) => r.status === "pending").map((row) => (
                      <div key={String(row.id)} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <div>
                          <span className="text-sm font-medium">{String(row.employeeId)}</span>
                          <span className="mx-2 text-xs text-prootech-text-muted">·</span>
                          <span className="text-sm text-prootech-text-muted">{String(row.leaveType)} · {String(row.daysCount)} days</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveLeaveMutation.mutate(String(row.id))}
                            disabled={approveLeaveMutation.isPending}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                          >
                            <CheckCircle size={13} /> {t(locale, "approve")}
                          </button>
                          <button
                            onClick={() => rejectLeaveMutation.mutate(String(row.id))}
                            disabled={rejectLeaveMutation.isPending}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            <XCircle size={13} /> {t(locale, "reject")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payroll Run Actions */}
              {tab === "payrollRuns" && rows.length > 0 && (
                <div className="mt-4">
                  <SectionHeader title={locale === "ar" ? "إجراءات مسيرة الرواتب" : "Payroll Run Actions"} />
                  <div className="space-y-2">
                    {rows.map((row) => (
                      <div key={String(row.id)} className="flex items-center justify-between rounded-xl border border-prootech-line p-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium">{String(row.periodStart).slice(0, 7)}</p>
                            <p className="text-xs text-prootech-text-muted">{String(row.employeesCount)} employees · ${String(row.totalNet)} net</p>
                          </div>
                          <StatusPill value={row.status} />
                        </div>
                        <div className="flex gap-2">
                          {row.status === "draft" || row.status === "pending" ? (
                            <button
                              onClick={() => calculatePayrollMutation.mutate(String(row.id))}
                              disabled={calculatePayrollMutation.isPending}
                              className="flex items-center gap-1.5 rounded-lg border border-prootech-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-prootech-muted disabled:opacity-60"
                            >
                              <Calculator size={13} /> {t(locale, "calculate")}
                            </button>
                          ) : null}
                          {row.status === "calculated" && (
                            <button
                              onClick={() => approvePayrollMutation.mutate(String(row.id))}
                              disabled={approvePayrollMutation.isPending}
                              className="flex items-center gap-1.5 rounded-lg bg-prootech-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-prootech-violet-light disabled:opacity-60"
                            >
                              <Lock size={13} /> {t(locale, "approve")}
                            </button>
                          )}
                          {row.status === "approved" && (
                            <button
                              onClick={() => finalizePayrollMutation.mutate(String(row.id))}
                              disabled={finalizePayrollMutation.isPending}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                            >
                              <Play size={13} /> {t(locale, "finalize")}
                            </button>
                          )}
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

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={`${t(locale, "create")} ${t(locale, tab)}`}
        size="md"
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium text-prootech-text-muted hover:bg-prootech-muted">{t(locale, "cancel")}</button>
            <button form="hr-create-form" type="submit" disabled={createMutation.isPending} className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">
              {createMutation.isPending ? "..." : t(locale, "save")}
            </button>
          </>
        }
      >
        <HrCreateForm tab={tab} onSubmit={(d) => createMutation.mutate(d)} locale={locale} />
      </Modal>

      <ConfirmModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => deleteMutation.mutate(selectedId)}
        title={locale === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={locale === "ar" ? "هل أنت متأكد من حذف هذا السجل؟" : "Are you sure?"}
        confirmLabel={locale === "ar" ? "حذف" : "Delete"} variant="danger" isPending={deleteMutation.isPending} />
    </motion.div>
  );
}

function HrCreateForm({ tab, onSubmit, locale }: { tab: Tab; onSubmit: (d: Record<string, unknown>) => void; locale: string }) {
  const fields: Record<Tab, Array<{ key: string; label: string; type?: string; options?: string[] }>> = {
    employees: [
      { key: "fullName", label: locale === "ar" ? "الاسم الكامل" : "Full Name" },
      { key: "email", label: "Email", type: "email" },
      { key: "title", label: locale === "ar" ? "المسمى الوظيفي" : "Job Title" },
      { key: "department", label: locale === "ar" ? "القسم" : "Department", options: ["Sales", "Delivery", "Finance", "HR", "Tech"] },
      { key: "employmentType", label: locale === "ar" ? "نوع العقد" : "Employment Type", options: ["full_time", "part_time", "contractor", "freelance"] },
      { key: "joinDate", label: locale === "ar" ? "تاريخ الانضمام" : "Join Date", type: "date" },
      { key: "baseSalary", label: locale === "ar" ? "الراتب الأساسي" : "Base Salary", type: "number" },
      { key: "currencyCode", label: locale === "ar" ? "العملة" : "Currency", options: ["USD", "AED", "SAR"] }
    ],
    leaveRequests: [
      { key: "leaveType", label: locale === "ar" ? "نوع الإجازة" : "Leave Type", options: ["annual", "sick", "unpaid", "maternity", "paternity", "emergency"] },
      { key: "startDate", label: locale === "ar" ? "تاريخ البداية" : "Start Date", type: "date" },
      { key: "endDate", label: locale === "ar" ? "تاريخ النهاية" : "End Date", type: "date" },
      { key: "daysCount", label: locale === "ar" ? "عدد الأيام" : "Days Count", type: "number" },
      { key: "reason", label: locale === "ar" ? "السبب" : "Reason" }
    ],
    payrollRuns: [
      { key: "periodStart", label: locale === "ar" ? "بداية الفترة" : "Period Start", type: "date" },
      { key: "periodEnd", label: locale === "ar" ? "نهاية الفترة" : "Period End", type: "date" },
      { key: "currencyCode", label: locale === "ar" ? "العملة" : "Currency", options: ["USD", "AED", "SAR"] }
    ],
    payslips: [
      { key: "employeeId", label: locale === "ar" ? "معرف الموظف" : "Employee ID" },
      { key: "payrollRunId", label: locale === "ar" ? "معرف المسيرة" : "Payroll Run ID" }
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
    <form id="hr-create-form" onSubmit={handleSubmit} className="space-y-4">
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
