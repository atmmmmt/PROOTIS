import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, ExternalLink, GitBranch, LayoutDashboard, HardDrive,
  FigmaIcon, Server, Globe, FileText, Plus, Trash2, Eye, EyeOff,
  Copy, Check, Upload, ChevronRight, Clock, Layers
} from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { Surface, SectionHeader, StatusPill } from "../components/ui";
import { Modal } from "../components/Modal";

function useLocale() {
  return useAppStore((s) => s.locale);
}

// ── Icon map for link types ────────────────────────────────────────────────────
const linkTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  gitlab:    { icon: GitBranch,       label: "GitLab",     color: "text-orange-500 bg-orange-50 border-orange-100" },
  dashboard: { icon: LayoutDashboard, label: "Dashboard",  color: "text-blue-600 bg-blue-50 border-blue-100" },
  drive:     { icon: HardDrive,       label: "Drive",      color: "text-green-600 bg-green-50 border-green-100" },
  figma:     { icon: Layers,          label: "Figma",      color: "text-purple-600 bg-purple-50 border-purple-100" },
  server:    { icon: Server,          label: "Server",     color: "text-red-600 bg-red-50 border-red-100" },
  staging:   { icon: Server,          label: "Staging",    color: "text-amber-600 bg-amber-50 border-amber-100" },
  production:{ icon: Globe,           label: "Production", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  other:     { icon: ExternalLink,    label: "Link",       color: "text-gray-500 bg-gray-50 border-gray-100" }
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  brief:    { label: "Brief",    color: "bg-blue-50 text-blue-700" },
  contract: { label: "Contract", color: "bg-purple-50 text-purple-700" },
  design:   { label: "Design",   color: "bg-pink-50 text-pink-700" },
  report:   { label: "Report",   color: "bg-green-50 text-green-700" },
  log:      { label: "Log",      color: "bg-amber-50 text-amber-700" },
  other:    { label: "File",     color: "bg-gray-50 text-gray-600" }
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Copy to clipboard button ───────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handle} className="rounded-md p-1 text-prootech-text-muted hover:bg-prootech-muted" title="Copy">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

// ── Server Credential row ──────────────────────────────────────────────────────
function ServerCredRow({ label, value, masked = false }: { label: string; value: string; masked?: boolean }) {
  const [visible, setVisible] = useState(false);
  const display = masked ? (visible ? value : "••••••••") : value;
  return (
    <div className="flex items-center justify-between rounded-lg border border-prootech-line bg-prootech-muted px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[0.65rem] font-medium uppercase tracking-wide text-prootech-text-muted w-16 shrink-0">{label}</span>
        <code className="text-[0.8125rem] font-mono text-prootech-black truncate">{display}</code>
      </div>
      <div className="flex items-center gap-1">
        {masked && (
          <button onClick={() => setVisible((v) => !v)} className="rounded-md p-1 text-prootech-text-muted hover:bg-white" title={visible ? "Hide" : "Reveal"}>
            {visible ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
        {(!masked || visible) && <CopyButton value={value} />}
      </div>
    </div>
  );
}

// ── Add Link Modal ─────────────────────────────────────────────────────────────
function AddLinkModal({ open, onClose, onSubmit, isPending }: { open: boolean; onClose: () => void; onSubmit: (d: Record<string, unknown>) => void; isPending: boolean }) {
  const locale = useLocale();
  const [type, setType] = useState("other");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (v) data[k] = v; });
    onSubmit(data);
  };
  return (
    <Modal open={open} onClose={onClose} title={locale === "ar" ? "إضافة رابط" : "Add Link"} size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium hover:bg-prootech-muted">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
          <button form="add-link-form" type="submit" disabled={isPending} className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">
            {isPending ? "..." : locale === "ar" ? "حفظ" : "Save"}
          </button>
        </>
      }
    >
      <form id="add-link-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "التسمية" : "Label"}</span>
          <input name="label" required className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" placeholder={locale === "ar" ? "مثال: GitLab Repository" : "e.g. GitLab Repository"} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">URL</span>
          <input name="url" type="url" required className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" placeholder="https://" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "النوع" : "Type"}</span>
          <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet">
            {Object.entries(linkTypeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "وصف" : "Description"}</span>
          <input name="description" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
        </label>
        {(type === "server" || type === "staging" || type === "production") && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">Host / IP</span>
                <input name="host" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">Username</span>
                <input name="username" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">Port</span>
                <input name="port" defaultValue="22" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">Platform</span>
                <input name="platform" placeholder="DigitalOcean, AWS..." className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "ملاحظة الوصول" : "Access Note"}</span>
              <input name="accessNote" placeholder={locale === "ar" ? "مثال: SSH key في 1Password" : "e.g. SSH key in 1Password"} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
            </label>
          </>
        )}
      </form>
    </Modal>
  );
}

// ── Add File Modal ─────────────────────────────────────────────────────────────
function AddFileModal({ open, onClose, onSubmit, isPending }: { open: boolean; onClose: () => void; onSubmit: (d: Record<string, unknown>) => void; isPending: boolean }) {
  const locale = useLocale();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (v) data[k] = v; });
    data.sizeBytes = 0;
    onSubmit(data);
  };
  return (
    <Modal open={open} onClose={onClose} title={locale === "ar" ? "إضافة ملف" : "Add File"} size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium hover:bg-prootech-muted">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
          <button form="add-file-form" type="submit" disabled={isPending} className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">
            {isPending ? "..." : locale === "ar" ? "حفظ" : "Save"}
          </button>
        </>
      }
    >
      <form id="add-file-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "اسم الملف" : "File Name"}</span>
          <input name="name" required className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" placeholder="Project Brief.pdf" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "رابط التنزيل (اختياري)" : "Download URL (optional)"}</span>
          <input name="downloadUrl" type="url" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" placeholder="https://drive.google.com/..." />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "التصنيف" : "Category"}</span>
          <select name="category" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet">
            {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "ملاحظة" : "Note"}</span>
          <input name="note" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "نوع الملف" : "MIME Type"}</span>
          <select name="mimeType" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet">
            <option value="application/pdf">PDF</option>
            <option value="image/png">Image (PNG)</option>
            <option value="image/jpeg">Image (JPEG)</option>
            <option value="application/zip">ZIP</option>
            <option value="text/plain">Text</option>
            <option value="application/vnd.ms-excel">Excel</option>
          </select>
        </label>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locale = useLocale();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "links" | "files" | "server">("overview");
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["project-hub", id],
    queryFn: () => api.projectHub(id!),
    enabled: Boolean(id)
  });

  const addLinkMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.addProjectLink(id!, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project-hub", id] }); setAddLinkOpen(false); }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: string) => api.deleteProjectLink(id!, linkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-hub", id] })
  });

  const addFileMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.addProjectFile(id!, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project-hub", id] }); setAddFileOpen(false); }
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => api.deleteProjectFile(id!, fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-hub", id] })
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-36 animate-pulse rounded-2xl bg-prootech-muted-strong" />
      <div className="h-64 animate-pulse rounded-xl bg-prootech-muted-strong" />
    </div>
  );

  const project = data?.project ?? {};
  const links = data?.links ?? [];
  const files = data?.files ?? [];
  const milestones = data?.milestones ?? [];
  const deliverables = data?.deliverables ?? [];

  const serverLinks = links.filter((l) => ["server", "staging", "production"].includes(String(l.type)));
  const regularLinks = links.filter((l) => !["server", "staging", "production"].includes(String(l.type)));

  const tabs = [
    { key: "overview", label: locale === "ar" ? "نظرة عامة" : "Overview" },
    { key: "links",    label: locale === "ar" ? `الروابط (${regularLinks.length})` : `Links (${regularLinks.length})` },
    { key: "files",    label: locale === "ar" ? `الملفات (${files.length})` : `Files (${files.length})` },
    { key: "server",   label: locale === "ar" ? `السيرفرات (${serverLinks.length})` : `Servers (${serverLinks.length})` }
  ] as const;

  const healthColors: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Back + Hero */}
      <div>
        <button onClick={() => navigate("/projects")} className="mb-3 flex items-center gap-1.5 text-sm text-prootech-text-muted hover:text-prootech-black transition-colors">
          <ArrowLeft size={14} />
          {locale === "ar" ? "العودة للمشاريع" : "Back to Projects"}
        </button>

        <section className="overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">
                {locale === "ar" ? "تفاصيل المشروع" : "Project Hub"}
              </p>
              <h1 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.02em] leading-tight">
                {String(project.name ?? "")}
              </h1>
              <p className="mt-2 text-[0.8125rem] leading-6 text-white/65 max-w-2xl">
                {String(project.description ?? "")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-medium ${healthColors[String(project.healthStatus ?? "green")] ?? healthColors.green}`}>
                {String(project.healthStatus ?? "green").toUpperCase()}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.7rem] font-medium text-white/80">
                {String(project.type ?? "project")}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.7rem] font-medium text-white/80">
                {String(project.billingModel ?? "")}
              </span>
            </div>
          </div>
          {/* Tech stack */}
          {Array.isArray(project.techStack) && project.techStack.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(project.techStack as string[]).map((tech) => (
                <span key={tech} className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-0.5 text-[0.65rem] font-medium text-white/80">
                  {tech}
                </span>
              ))}
            </div>
          )}
          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <p className="text-[0.65rem] text-white/50">{locale === "ar" ? "الميزانية" : "Budget"}</p>
              <p className="text-base font-semibold">${Number(project.budgetAmount ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <p className="text-[0.65rem] text-white/50">{locale === "ar" ? "المعالم" : "Milestones"}</p>
              <p className="text-base font-semibold">{milestones.length}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <p className="text-[0.65rem] text-white/50">{locale === "ar" ? "التسليمات" : "Deliverables"}</p>
              <p className="text-base font-semibold">{deliverables.length}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <p className="text-[0.65rem] text-white/50">{locale === "ar" ? "الساعات" : "Hours"}</p>
              <p className="text-base font-semibold">{data?.totalHours ?? 0}h</p>
            </div>
          </div>
        </section>
      </div>

      {/* Tabs */}
      <Surface className="overflow-hidden">
        <div className="flex gap-0 overflow-x-auto border-b border-prootech-line">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-4 py-3 text-[0.8125rem] font-medium transition-colors ${tab === t.key ? "border-b-2 border-prootech-violet text-prootech-violet" : "text-prootech-text-muted hover:text-prootech-black"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Quick links row */}
              {regularLinks.length > 0 && (
                <div>
                  <SectionHeader title={locale === "ar" ? "الروابط السريعة" : "Quick Links"} />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {regularLinks.map((link) => {
                      const cfg = linkTypeConfig[String(link.type)] ?? linkTypeConfig.other;
                      const Icon = cfg.icon;
                      return (
                        <a key={String(link.id)} href={String(link.url)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-prootech-line bg-prootech-muted p-3 transition hover:bg-white hover:shadow-card"
                        >
                          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs ${cfg.color}`}>
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-prootech-black truncate">{String(link.label)}</p>
                            <p className="text-[0.7rem] text-prootech-text-muted truncate">{String(link.url)}</p>
                          </div>
                          <ExternalLink size={13} className="shrink-0 text-prootech-text-muted" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {milestones.length > 0 && (
                <div>
                  <SectionHeader title={locale === "ar" ? "المعالم" : "Milestones"} />
                  <div className="space-y-2">
                    {milestones.map((m) => (
                      <div key={String(m.id)} className="flex items-center gap-4 rounded-xl border border-prootech-line p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-prootech-black">{String(m.title)}</p>
                          <p className="text-xs text-prootech-text-muted">{String(m.dueDate)}</p>
                        </div>
                        <div className="w-24">
                          <div className="h-1.5 w-full rounded-full bg-prootech-muted-strong">
                            <div className="h-1.5 rounded-full bg-prootech-violet" style={{ width: `${Number(m.progressPercent ?? 0)}%` }} />
                          </div>
                          <p className="mt-0.5 text-right text-[0.65rem] text-prootech-text-muted">{Number(m.progressPercent ?? 0)}%</p>
                        </div>
                        <StatusPill value={m.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables */}
              {deliverables.length > 0 && (
                <div>
                  <SectionHeader title={locale === "ar" ? "التسليمات" : "Deliverables"} />
                  <div className="space-y-2">
                    {deliverables.map((d) => (
                      <div key={String(d.id)} className="flex items-center gap-3 rounded-xl border border-prootech-line p-3">
                        <ChevronRight size={14} className="shrink-0 text-prootech-text-muted" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-prootech-black">{String(d.title)}</p>
                          <p className="text-xs text-prootech-text-muted">{String(d.description ?? "")}</p>
                        </div>
                        <StatusPill value={d.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drive link */}
              {Boolean(project.driveUrl) && (
                <div>
                  <SectionHeader title={locale === "ar" ? "Google Drive" : "Google Drive"} />
                  <a href={String(project.driveUrl)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-prootech-line bg-prootech-muted p-4 transition hover:bg-white hover:shadow-card"
                  >
                    <HardDrive size={18} className="text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-prootech-black">{locale === "ar" ? "فتح مجلد Drive" : "Open Drive Folder"}</p>
                      <p className="text-xs text-prootech-text-muted truncate">{String(project.driveUrl)}</p>
                    </div>
                    <ExternalLink size={13} className="ms-auto text-prootech-text-muted" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── LINKS ── */}
          {tab === "links" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-prootech-text-muted">{locale === "ar" ? "جميع الروابط المرتبطة بالمشروع." : "All links associated with this project."}</p>
                <button onClick={() => setAddLinkOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-prootech-violet px-3 py-2 text-xs font-medium text-white hover:bg-prootech-violet-light">
                  <Plus size={13} />
                  {locale === "ar" ? "إضافة رابط" : "Add Link"}
                </button>
              </div>
              {regularLinks.length === 0 ? (
                <div className="rounded-xl bg-prootech-muted py-12 text-center text-sm text-prootech-text-muted">
                  {locale === "ar" ? "لا توجد روابط بعد." : "No links yet."}
                </div>
              ) : (
                <div className="space-y-2">
                  {regularLinks.map((link) => {
                    const cfg = linkTypeConfig[String(link.type)] ?? linkTypeConfig.other;
                    const Icon = cfg.icon;
                    return (
                      <div key={String(link.id)} className="flex items-start gap-4 rounded-xl border border-prootech-line p-4">
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm ${cfg.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-prootech-black">{String(link.label)}</p>
                            <span className={`rounded-md border px-1.5 py-0.5 text-[0.6rem] font-medium ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          {Boolean(link.description) && <p className="mt-0.5 text-xs text-prootech-text-muted">{String(link.description)}</p>}
                          <a href={String(link.url)} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[0.75rem] text-prootech-violet hover:underline">
                            <ExternalLink size={11} />
                            {String(link.url)}
                          </a>
                        </div>
                        <button onClick={() => deleteLinkMutation.mutate(String(link.id))} className="rounded-lg border border-prootech-line p-1.5 text-prootech-text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── FILES ── */}
          {tab === "files" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-prootech-text-muted">{locale === "ar" ? "المستندات والملفات المرفقة بالمشروع." : "Documents and files attached to this project."}</p>
                <button onClick={() => setAddFileOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-prootech-violet px-3 py-2 text-xs font-medium text-white hover:bg-prootech-violet-light">
                  <Upload size={13} />
                  {locale === "ar" ? "إضافة ملف" : "Add File"}
                </button>
              </div>
              {files.length === 0 ? (
                <div className="rounded-xl bg-prootech-muted py-12 text-center text-sm text-prootech-text-muted">
                  {locale === "ar" ? "لا توجد ملفات بعد." : "No files yet."}
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => {
                    const cat = categoryConfig[String(file.category)] ?? categoryConfig.other;
                    return (
                      <div key={String(file.id)} className="flex items-center gap-4 rounded-xl border border-prootech-line p-3 hover:bg-prootech-muted transition-colors">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 border border-red-100">
                          <FileText size={18} className="text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-prootech-black truncate">{String(file.name)}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-prootech-text-muted">
                            <span className={`rounded-md px-1.5 py-0.5 text-[0.6rem] font-medium ${cat.color}`}>{cat.label}</span>
                            {Boolean(file.sizeBytes) && <span>{formatBytes(Number(file.sizeBytes))}</span>}
                            {Boolean(file.note) && <span>· {String(file.note)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {Boolean(file.downloadUrl) && (
                            <a href={String(file.downloadUrl)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-lg border border-prootech-line px-2.5 py-1.5 text-xs font-medium text-prootech-text-muted hover:bg-prootech-muted">
                              <ExternalLink size={11} />
                              {locale === "ar" ? "فتح" : "Open"}
                            </a>
                          )}
                          <button onClick={() => deleteFileMutation.mutate(String(file.id))} className="rounded-lg border border-prootech-line p-1.5 text-prootech-text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SERVER ACCESS ── */}
          {tab === "server" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-prootech-text-muted">{locale === "ar" ? "معلومات الوصول للسيرفرات — انتبه لخصوصية هذه المعلومات." : "Server access credentials — handle with care."}</p>
                <button onClick={() => setAddLinkOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-prootech-violet px-3 py-2 text-xs font-medium text-white hover:bg-prootech-violet-light">
                  <Plus size={13} />
                  {locale === "ar" ? "إضافة سيرفر" : "Add Server"}
                </button>
              </div>
              {serverLinks.length === 0 ? (
                <div className="rounded-xl bg-prootech-muted py-12 text-center text-sm text-prootech-text-muted">
                  {locale === "ar" ? "لا توجد معلومات سيرفر بعد." : "No server info yet."}
                </div>
              ) : (
                <div className="space-y-4">
                  {serverLinks.map((link) => {
                    const cfg = linkTypeConfig[String(link.type)] ?? linkTypeConfig.server;
                    const Icon = cfg.icon;
                    return (
                      <div key={String(link.id)} className="rounded-xl border border-prootech-line overflow-hidden">
                        <div className={`flex items-center gap-3 px-4 py-3 border-b border-prootech-line ${cfg.color.split(" ").slice(1).join(" ")}`}>
                          <Icon size={15} className={cfg.color.split(" ")[0]} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{String(link.label)}</p>
                            {Boolean(link.platform) && <p className="text-xs opacity-60">{String(link.platform)}</p>}
                          </div>
                          {Boolean(link.url) && (
                            <a href={String(link.url)} target="_blank" rel="noopener noreferrer" className="text-[0.7rem] underline opacity-60 hover:opacity-100">
                              {String(link.url)}
                            </a>
                          )}
                        </div>
                        <div className="space-y-2 p-4">
                          {Boolean(link.host) && <ServerCredRow label="Host" value={String(link.host)} />}
                          {Boolean(link.username) && <ServerCredRow label="User" value={String(link.username)} />}
                          {Boolean(link.port) && <ServerCredRow label="Port" value={String(link.port)} />}
                          {Boolean(link.description) && (
                            <div className="rounded-lg border border-prootech-line bg-prootech-muted px-3 py-2">
                              <p className="text-[0.65rem] font-medium uppercase tracking-wide text-prootech-text-muted">{locale === "ar" ? "وصف" : "Description"}</p>
                              <p className="mt-0.5 text-[0.8125rem] text-prootech-black">{String(link.description)}</p>
                            </div>
                          )}
                          {Boolean(link.accessNote) && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                              <Clock size={13} className="mt-0.5 shrink-0 text-amber-600" />
                              <div>
                                <p className="text-[0.65rem] font-medium uppercase tracking-wide text-amber-700">{locale === "ar" ? "ملاحظة الوصول" : "Access Note"}</p>
                                <p className="mt-0.5 text-[0.8125rem] text-amber-800">{String(link.accessNote)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end border-t border-prootech-line px-4 py-2">
                          <button onClick={() => deleteLinkMutation.mutate(String(link.id))} className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-red-500 hover:bg-red-50">
                            <Trash2 size={12} />
                            {locale === "ar" ? "حذف" : "Remove"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Surface>

      <AddLinkModal open={addLinkOpen} onClose={() => setAddLinkOpen(false)} onSubmit={(d) => addLinkMutation.mutate(d)} isPending={addLinkMutation.isPending} />
      <AddFileModal open={addFileOpen} onClose={() => setAddFileOpen(false)} onSubmit={(d) => addFileMutation.mutate(d)} isPending={addFileMutation.isPending} />
    </motion.div>
  );
}
