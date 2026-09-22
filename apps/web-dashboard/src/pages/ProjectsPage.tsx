import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, RefreshCw, ExternalLink } from "lucide-react";
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

type Tab = "projects" | "milestones" | "deliverables" | "timesheets";

const tabs: { key: Tab; path: string }[] = [
  { key: "projects", path: "/projects" },
  { key: "milestones", path: "/projects/milestones" },
  { key: "deliverables", path: "/projects/deliverables" },
  { key: "timesheets", path: "/projects/timesheets" }
];

const columnConfig: Record<Tab, Array<{ key: string; label: string }>> = {
  projects: [
    { key: "name", label: "Project" },
    { key: "status", label: "Status" },
    { key: "healthStatus", label: "Health" },
    { key: "budgetAmount", label: "Budget" },
    { key: "billingModel", label: "Billing" },
    { key: "startDate", label: "Start" }
  ],
  milestones: [
    { key: "title", label: "Milestone" },
    { key: "projectId", label: "Project" },
    { key: "dueDate", label: "Due Date" },
    { key: "progressPercent", label: "Progress %" },
    { key: "amountLinked", label: "Amount" },
    { key: "status", label: "Status" }
  ],
  deliverables: [
    { key: "title", label: "Deliverable" },
    { key: "milestoneId", label: "Milestone" },
    { key: "dueDate", label: "Due Date" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" }
  ],
  timesheets: [
    { key: "employeeId", label: "Employee" },
    { key: "projectId", label: "Project" },
    { key: "date", label: "Date" },
    { key: "hours", label: "Hours" },
    { key: "taskLabel", label: "Task" },
    { key: "billable", label: "Billable" }
  ]
};

const healthColors: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100"
};

export function ProjectsPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("projects");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const currentTab = tabs.find((t) => t.key === tab)!;

  const { data, isLoading } = useQuery({
    queryKey: ["projects", tab, search],
    queryFn: () => api.table(currentTab.path, search ? { search } : undefined)
  });

  const { data: projDash } = useQuery({ queryKey: ["projects-dashboard"], queryFn: api.projectsDashboard });

  const rows = data?.rows ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.create(currentTab.path, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects", tab] }); setCreateOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(currentTab.path, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects", tab] }); setDeleteOpen(false); }
  });

  const updateHealthMutation = useMutation({
    mutationFn: ({ id, health }: { id: string; health: string }) => api.update("/projects", id, { healthStatus: health }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", tab] })
  });

  const projects = projDash?.projects ?? [];
  const amber = projects.filter((p: any) => p.healthStatus === "amber").length;
  const red = projects.filter((p: any) => p.healthStatus === "red").length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero */}
      <section className="flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">Projects</p>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
            {locale === "ar" ? "مساحة المشاريع والتسليم" : "Projects and Delivery"}
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
        <KpiCard label={locale === "ar" ? "المشاريع النشطة" : "Active Projects"} value={String(projects.filter((p: any) => p.status === "active").length)} delta="active" tone="good" />
        <KpiCard label={locale === "ar" ? "تحت المراقبة" : "Amber Health"} value={String(amber)} delta={amber > 0 ? "needs attention" : "all good"} tone={amber > 0 ? "watch" : "good"} />
        <KpiCard label={locale === "ar" ? "في خطر" : "At Risk"} value={String(red)} delta={red > 0 ? "critical" : "none"} tone={red > 0 ? "risk" : "good"} />
        <KpiCard label={locale === "ar" ? "المعالم النشطة" : "Active Milestones"} value={String(projDash?.milestones?.filter((m: any) => m.status === "in_progress").length ?? 0)} delta="in progress" tone="neutral" />
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
            <button onClick={() => qc.invalidateQueries({ queryKey: ["projects", tab] })} className="rounded-xl border border-prootech-line p-2 text-prootech-text-muted hover:bg-prootech-muted">
              <RefreshCw size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-prootech-muted-strong" />
          ) : (
            <>
              <DataTable title={t(locale, tab)} rows={rows} columns={columnConfig[tab]} />

              {/* Project Health Actions */}
              {tab === "projects" && rows.length > 0 && (
                <div className="mt-4">
                  <SectionHeader title={locale === "ar" ? "إدارة صحة المشاريع" : "Project Health Management"} />
                  <div className="space-y-2">
                    {rows.map((row) => (
                      <div key={String(row.id)} className="flex items-center justify-between rounded-xl border border-prootech-line p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{String(row.name)}</span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium ${healthColors[String(row.healthStatus ?? "green")] ?? healthColors.green}`}>
                            {String(row.healthStatus ?? "green")}
                          </span>
                          <StatusPill value={row.status} />
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => navigate(`/projects/${String(row.id)}`)}
                            className="flex items-center gap-1 rounded-lg border border-prootech-violet px-2.5 py-1 text-[0.7rem] font-medium text-prootech-violet hover:bg-prootech-violet hover:text-white transition-colors"
                          >
                            <ExternalLink size={10} />
                            {locale === "ar" ? "مركز المشروع" : "Hub"}
                          </button>
                          {["green", "amber", "red"].map((h) => (
                            <button
                              key={h}
                              onClick={() => updateHealthMutation.mutate({ id: String(row.id), health: h })}
                              className={`rounded-lg border px-2.5 py-1 text-[0.7rem] font-medium transition ${h === "green" ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : h === "amber" ? "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-red-100 bg-red-50 text-red-700 hover:bg-red-100"}`}
                            >
                              {h}
                            </button>
                          ))}
                          <button
                            onClick={() => { setSelectedId(String(row.id)); setDeleteOpen(true); }}
                            className="rounded-lg border border-prootech-line px-2.5 py-1 text-[0.7rem] font-medium text-prootech-text-muted hover:bg-prootech-muted"
                          >
                            {t(locale, "delete")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestone progress bars */}
              {tab === "milestones" && rows.length > 0 && (
                <div className="mt-4">
                  <SectionHeader title={locale === "ar" ? "تقدم المعالم" : "Milestone Progress"} />
                  <div className="space-y-3">
                    {rows.slice(0, 5).map((row) => (
                      <div key={String(row.id)} className="rounded-xl border border-prootech-line p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">{String(row.title)}</span>
                          <StatusPill value={row.status} />
                        </div>
                        <div className="h-2 w-full rounded-full bg-prootech-muted">
                          <div
                            className="h-2 rounded-full bg-prootech-violet transition-all"
                            style={{ width: `${Math.min(100, Number(row.progressPercent ?? 0))}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-prootech-text-muted">{Number(row.progressPercent ?? 0)}% complete · Due {String(row.dueDate ?? "—")}</p>
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
            <button form="projects-create-form" type="submit" disabled={createMutation.isPending} className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">
              {createMutation.isPending ? "..." : t(locale, "save")}
            </button>
          </>
        }
      >
        <ProjectsCreateForm tab={tab} onSubmit={(d) => createMutation.mutate(d)} locale={locale} />
      </Modal>

      <ConfirmModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => deleteMutation.mutate(selectedId)}
        title={locale === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        message={locale === "ar" ? "هل أنت متأكد من حذف هذا السجل؟" : "Are you sure?"}
        confirmLabel={locale === "ar" ? "حذف" : "Delete"} variant="danger" isPending={deleteMutation.isPending} />
    </motion.div>
  );
}

function ProjectsCreateForm({ tab, onSubmit, locale }: { tab: Tab; onSubmit: (d: Record<string, unknown>) => void; locale: string }) {
  const fields: Record<Tab, Array<{ key: string; label: string; type?: string; options?: string[] }>> = {
    projects: [
      { key: "name", label: locale === "ar" ? "اسم المشروع" : "Project Name" },
      { key: "type", label: locale === "ar" ? "النوع" : "Type", options: ["retainer", "project", "consultancy"] },
      { key: "billingModel", label: locale === "ar" ? "نموذج الفوترة" : "Billing Model", options: ["retainer", "fixed", "hourly", "milestone"] },
      { key: "startDate", label: locale === "ar" ? "تاريخ البداية" : "Start Date", type: "date" },
      { key: "endDate", label: locale === "ar" ? "تاريخ النهاية" : "End Date", type: "date" },
      { key: "budgetAmount", label: locale === "ar" ? "الميزانية" : "Budget", type: "number" },
      { key: "currencyCode", label: locale === "ar" ? "العملة" : "Currency", options: ["USD", "AED", "SAR"] }
    ],
    milestones: [
      { key: "title", label: locale === "ar" ? "اسم المعلم" : "Milestone Title" },
      { key: "dueDate", label: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date", type: "date" },
      { key: "amountLinked", label: locale === "ar" ? "المبلغ المرتبط" : "Linked Amount", type: "number" },
      { key: "progressPercent", label: locale === "ar" ? "نسبة التقدم" : "Progress %", type: "number" }
    ],
    deliverables: [
      { key: "title", label: locale === "ar" ? "اسم التسليمة" : "Deliverable Title" },
      { key: "description", label: locale === "ar" ? "الوصف" : "Description" },
      { key: "dueDate", label: locale === "ar" ? "تاريخ الاستحقاق" : "Due Date", type: "date" },
      { key: "priority", label: locale === "ar" ? "الأولوية" : "Priority", options: ["low", "medium", "high", "critical"] },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status", options: ["todo", "in_progress", "review", "done"] }
    ],
    timesheets: [
      { key: "date", label: locale === "ar" ? "التاريخ" : "Date", type: "date" },
      { key: "hours", label: locale === "ar" ? "الساعات" : "Hours", type: "number" },
      { key: "taskLabel", label: locale === "ar" ? "وصف المهمة" : "Task Label" },
      { key: "billable", label: locale === "ar" ? "قابل للفوترة" : "Billable", options: ["true", "false"] }
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
    <form id="projects-create-form" onSubmit={handleSubmit} className="space-y-4">
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
