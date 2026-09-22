import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Plus, ExternalLink, RefreshCw,
  Users, Eye, MousePointer, BarChart2, Globe
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { Surface, SectionHeader } from "../components/ui";
import { Modal } from "../components/Modal";

function useLocale() {
  return useAppStore((s) => s.locale);
}

// ── Platform display config ────────────────────────────────────────────────────
const platformConfig: Record<string, { label: string; color: string; bg: string; textColor: string; icon: string }> = {
  facebook:  { label: "Facebook",  color: "#1877F2", bg: "bg-blue-50",   textColor: "text-blue-700",   icon: "f" },
  instagram: { label: "Instagram", color: "#E1306C", bg: "bg-pink-50",   textColor: "text-pink-700",   icon: "ig" },
  linkedin:  { label: "LinkedIn",  color: "#0A66C2", bg: "bg-sky-50",    textColor: "text-sky-700",    icon: "in" },
  website:   { label: "Website",   color: "#6C47FF", bg: "bg-violet-50", textColor: "text-violet-700", icon: "w" },
  tiktok:    { label: "TikTok",    color: "#010101", bg: "bg-gray-100",  textColor: "text-gray-700",   icon: "tt" },
  twitter:   { label: "X / Twitter", color: "#000000", bg: "bg-gray-100", textColor: "text-gray-700", icon: "x" },
  youtube:   { label: "YouTube",   color: "#FF0000", bg: "bg-red-50",    textColor: "text-red-700",    icon: "yt" }
};

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function Delta({ val }: { val: number | null }) {
  if (val == null) return null;
  const positive = val >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-[0.7rem] font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {positive ? "+" : ""}{fmt(val)}
    </span>
  );
}

// ── Channel card ───────────────────────────────────────────────────────────────
function ChannelCard({ item, selected, onClick }: {
  item: { channel: Record<string, unknown>; latest: Record<string, unknown> | null; followersDelta: number | null };
  selected: boolean;
  onClick: () => void;
}) {
  const locale = useLocale();
  const platform = String(item.channel.platform ?? "other");
  const cfg = platformConfig[platform] ?? { label: platform, color: "#888", bg: "bg-gray-50", textColor: "text-gray-600", icon: "?" };
  const latest = item.latest;
  const isWebsite = platform === "website";

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-5 text-start transition-all ${selected ? "border-prootech-violet shadow-md bg-white" : "border-prootech-line bg-white hover:shadow-card"}`}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white text-xs font-bold shadow-sm" style={{ backgroundColor: cfg.color }}>
          {cfg.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-prootech-black truncate">{String(item.channel.name ?? "")}</p>
          <p className={`text-[0.7rem] font-medium ${cfg.textColor}`}>{cfg.label}</p>
        </div>
        {Boolean(item.channel.url) && (
          <a href={String(item.channel.url)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-prootech-text-muted hover:text-prootech-black">
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {latest && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {!isWebsite ? (
            <>
              <Stat label={locale === "ar" ? "المتابعون" : "Followers"} value={fmt(latest.followers as number)} delta={<Delta val={item.followersDelta} />} />
              <Stat label={locale === "ar" ? "الوصول" : "Reach"} value={fmt(latest.reach as number)} />
              <Stat label={locale === "ar" ? "الإنغيجمينت" : "Engagement"} value={latest.engagementRate != null ? `${Number(latest.engagementRate).toFixed(1)}%` : "—"} />
              <Stat label={locale === "ar" ? "المشاهدات" : "Impressions"} value={fmt(latest.impressions as number)} />
            </>
          ) : (
            <>
              <Stat label={locale === "ar" ? "الجلسات" : "Sessions"} value={fmt(latest.sessions as number)} />
              <Stat label={locale === "ar" ? "المشاهدات" : "Pageviews"} value={fmt(latest.pageviews as number)} />
              <Stat label={locale === "ar" ? "المستخدمون" : "Users"} value={fmt(latest.uniqueUsers as number)} />
              <Stat label="Bounce Rate" value={latest.bounceRate != null ? `${Number(latest.bounceRate).toFixed(1)}%` : "—"} />
            </>
          )}
        </div>
      )}
    </button>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-prootech-muted px-3 py-2">
      <p className="text-[0.6rem] uppercase tracking-wide text-prootech-text-muted">{label}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <p className="text-sm font-semibold text-prootech-black">{value}</p>
        {delta}
      </div>
    </div>
  );
}

// ── History Chart ──────────────────────────────────────────────────────────────
function HistoryChart({ channelId, platform }: { channelId: string; platform: string }) {
  const locale = useLocale();
  const cfg = platformConfig[platform] ?? { color: "#6C47FF", label: platform };
  const isWebsite = platform === "website";

  const { data, isLoading } = useQuery({
    queryKey: ["growth-history", channelId],
    queryFn: () => api.growthChannelHistory(channelId) as Promise<{ channel: Record<string, unknown>; history: Record<string, unknown>[]; total: number }>
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-prootech-muted-strong" />;
  const history = (data?.history ?? []).map((m) => ({
    date: String(m.date ?? "").slice(0, 7),
    ...m
  }));
  if (history.length < 2) return <div className="py-8 text-center text-sm text-prootech-text-muted">{locale === "ar" ? "لا توجد بيانات كافية للرسم البياني." : "Not enough data for chart."}</div>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={48} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {!isWebsite ? (
          <>
            <Line type="monotone" dataKey="followers" stroke={cfg.color} strokeWidth={2} dot={{ r: 3 }} name={locale === "ar" ? "المتابعون" : "Followers"} />
            <Line type="monotone" dataKey="reach" stroke="#94a3b8" strokeWidth={1.5} dot={false} name={locale === "ar" ? "الوصول" : "Reach"} strokeDasharray="4 2" />
          </>
        ) : (
          <>
            <Line type="monotone" dataKey="sessions" stroke={cfg.color} strokeWidth={2} dot={{ r: 3 }} name={locale === "ar" ? "الجلسات" : "Sessions"} />
            <Line type="monotone" dataKey="uniqueUsers" stroke="#94a3b8" strokeWidth={1.5} dot={false} name={locale === "ar" ? "المستخدمون" : "Users"} strokeDasharray="4 2" />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Add Metrics Modal ──────────────────────────────────────────────────────────
function AddMetricsModal({ open, onClose, channelId, platform, onSubmit, isPending }: {
  open: boolean; onClose: () => void; channelId: string; platform: string; onSubmit: (d: Record<string, unknown>) => void; isPending: boolean;
}) {
  const locale = useLocale();
  const isWebsite = platform === "website";
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (v !== "") data[k] = isNaN(Number(v)) ? v : Number(v); });
    onSubmit(data);
  };
  return (
    <Modal open={open} onClose={onClose} title={locale === "ar" ? "إضافة أرقام شهرية" : "Add Monthly Metrics"} size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium hover:bg-prootech-muted">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
          <button form="add-metrics-form" type="submit" disabled={isPending} className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">
            {isPending ? "..." : locale === "ar" ? "حفظ" : "Save"}
          </button>
        </>
      }
    >
      <form id="add-metrics-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "الشهر" : "Month (YYYY-MM-DD)"}</span>
          <input name="date" type="date" required className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
        </label>
        {!isWebsite ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "المتابعون" : "Followers"}</span><input name="followers" type="number" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "الوصول" : "Reach"}</span><input name="reach" type="number" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "المشاهدات" : "Impressions"}</span><input name="impressions" type="number" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "نسبة الإنغيجمينت" : "Engagement %"}</span><input name="engagementRate" type="number" step="0.1" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "النقرات" : "Clicks"}</span><input name="clicks" type="number" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "المنشورات" : "Posts"}</span><input name="postsCount" type="number" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "الجلسات" : "Sessions"}</span><input name="sessions" type="number" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "مشاهدات الصفحة" : "Pageviews"}</span><input name="pageviews" type="number" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "المستخدمون" : "Unique Users"}</span><input name="uniqueUsers" type="number" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">Bounce Rate %</span><input name="bounceRate" type="number" step="0.1" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" /></label>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

// ── Add Channel Modal ──────────────────────────────────────────────────────────
function AddChannelModal({ open, onClose, onSubmit, isPending }: { open: boolean; onClose: () => void; onSubmit: (d: Record<string, unknown>) => void; isPending: boolean }) {
  const locale = useLocale();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { if (v) data[k] = v; });
    onSubmit(data);
  };
  return (
    <Modal open={open} onClose={onClose} title={locale === "ar" ? "إضافة قناة" : "Add Channel"} size="sm"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl border border-prootech-line px-4 py-2 text-sm font-medium hover:bg-prootech-muted">{locale === "ar" ? "إلغاء" : "Cancel"}</button>
          <button form="add-channel-form" type="submit" disabled={isPending} className="rounded-xl bg-prootech-violet px-4 py-2 text-sm font-semibold text-white hover:bg-prootech-violet-light disabled:opacity-60">
            {isPending ? "..." : locale === "ar" ? "إضافة" : "Add"}
          </button>
        </>
      }
    >
      <form id="add-channel-form" onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "المنصة" : "Platform"}</span>
          <select name="platform" required className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet">
            {Object.entries(platformConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "الاسم / الهاندل" : "Name / Handle"}</span>
          <input name="name" required placeholder="@prootechagency" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">URL</span>
          <input name="url" type="url" placeholder="https://" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none focus:border-prootech-violet focus:bg-white" />
        </label>
      </form>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function GrowthPage() {
  const locale = useLocale();
  const qc = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [addMetricsOpen, setAddMetricsOpen] = useState(false);
  const [addChannelOpen, setAddChannelOpen] = useState(false);

  const { data: overviewData, isLoading, refetch } = useQuery({
    queryKey: ["growth-overview"],
    queryFn: () => api.growthOverview() as Promise<Array<{
      channel: Record<string, unknown>;
      latest: Record<string, unknown> | null;
      followersDelta: number | null;
      historyCount: number;
    }>>
  });

  const overview = overviewData ?? [];
  const selectedItem = overview.find(o => o.channel.id === selectedChannelId) ?? overview[0] ?? null;

  const addMetricsMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.addGrowthMetrics(String(selectedItem?.channel.id ?? ""), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["growth-overview"] });
      qc.invalidateQueries({ queryKey: ["growth-history"] });
      setAddMetricsOpen(false);
    }
  });

  const addChannelMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.addGrowthChannel(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["growth-overview"] }); setAddChannelOpen(false); }
  });

  // Totals across all channels (latest month)
  const totalFollowers = overview.filter(o => o.latest?.followers != null).reduce((s, o) => s + Number(o.latest!.followers), 0);
  const totalReach = overview.filter(o => o.latest?.reach != null).reduce((s, o) => s + Number(o.latest!.reach), 0);
  const websiteItem = overview.find(o => String(o.channel.platform) === "website");
  const webSessions = Number(websiteItem?.latest?.sessions ?? 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">
              {locale === "ar" ? "مؤشرات النمو" : "Company Growth"}
            </p>
            <h1 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.02em]">
              {locale === "ar" ? "تطور الشركة على وسائل التواصل والويب" : "Social media & web growth tracker"}
            </h1>
            <p className="mt-2 text-[0.8125rem] text-white/60">
              {locale === "ar"
                ? "تتبع تطور المتابعين، الوصول، والإنغيجمينت شهراً بشهر."
                : "Track follower growth, reach, and engagement month by month."}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setAddChannelOpen(true)} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20">
              <Plus size={14} />
              {locale === "ar" ? "قناة جديدة" : "Add Channel"}
            </button>
          </div>
        </div>

        {/* Top-level KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-white/50 text-[0.65rem] uppercase tracking-wide"><Users size={11} />{locale === "ar" ? "إجمالي المتابعين" : "Total Followers"}</div>
            <p className="mt-1 text-xl font-bold">{fmt(totalFollowers)}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-white/50 text-[0.65rem] uppercase tracking-wide"><Eye size={11} />{locale === "ar" ? "إجمالي الوصول" : "Total Reach"}</div>
            <p className="mt-1 text-xl font-bold">{fmt(totalReach)}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-white/50 text-[0.65rem] uppercase tracking-wide"><Globe size={11} />{locale === "ar" ? "جلسات الموقع" : "Web Sessions"}</div>
            <p className="mt-1 text-xl font-bold">{fmt(webSessions)}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <div className="flex items-center gap-2 text-white/50 text-[0.65rem] uppercase tracking-wide"><BarChart2 size={11} />{locale === "ar" ? "القنوات النشطة" : "Active Channels"}</div>
            <p className="mt-1 text-xl font-bold">{overview.filter(o => o.channel.status === "active").length}</p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-52 animate-pulse rounded-2xl bg-prootech-muted-strong" />)}
        </div>
      ) : (
        <>
          {/* Channel Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overview.map((item) => (
              <ChannelCard
                key={String(item.channel.id)}
                item={item}
                selected={selectedChannelId === item.channel.id || (!selectedChannelId && item === overview[0])}
                onClick={() => setSelectedChannelId(String(item.channel.id))}
              />
            ))}
          </div>

          {/* Selected Channel Chart */}
          {selectedItem && (
            <Surface className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <SectionHeader
                  title={`${locale === "ar" ? "تطور" : "Growth —"} ${String(selectedItem.channel.name ?? "")}`}
                />
                <button
                  onClick={() => setAddMetricsOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-prootech-line px-3 py-1.5 text-xs font-medium text-prootech-text-muted hover:bg-prootech-muted"
                >
                  <Plus size={12} />
                  {locale === "ar" ? "إضافة أرقام" : "Add Month"}
                </button>
              </div>
              <HistoryChart
                channelId={String(selectedItem.channel.id)}
                platform={String(selectedItem.channel.platform)}
              />

              {/* Recent metrics table */}
              {selectedItem.historyCount > 0 && (
                <div className="mt-5">
                  <SectionHeader title={locale === "ar" ? "سجل الأرقام الشهرية" : "Monthly History"} />
                  <div className="overflow-x-auto">
                    <table className="w-full text-[0.8125rem]">
                      <thead>
                        <tr className="border-b border-prootech-line">
                          <th className="py-2 text-start text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "الشهر" : "Month"}</th>
                          {String(selectedItem.channel.platform) !== "website" ? (
                            <>
                              <th className="py-2 text-end text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "المتابعون" : "Followers"}</th>
                              <th className="py-2 text-end text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "الوصول" : "Reach"}</th>
                              <th className="py-2 text-end text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "الإنغيجمينت" : "Eng. %"}</th>
                              <th className="py-2 text-end text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "المشاهدات" : "Impressions"}</th>
                            </>
                          ) : (
                            <>
                              <th className="py-2 text-end text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "الجلسات" : "Sessions"}</th>
                              <th className="py-2 text-end text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "مشاهدات الصفحة" : "Pageviews"}</th>
                              <th className="py-2 text-end text-xs font-medium text-prootech-text-muted">{locale === "ar" ? "المستخدمون" : "Users"}</th>
                              <th className="py-2 text-end text-xs font-medium text-prootech-text-muted">Bounce %</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {/* History comes from the chart query; use overview data for last entry */}
                        <tr className="border-b border-prootech-line last:border-0">
                          <td className="py-2 font-medium text-prootech-black">{String(selectedItem.latest?.date ?? "").slice(0, 7)}</td>
                          {String(selectedItem.channel.platform) !== "website" ? (
                            <>
                              <td className="py-2 text-end text-prootech-black">{fmt(selectedItem.latest?.followers as number)}</td>
                              <td className="py-2 text-end text-prootech-black">{fmt(selectedItem.latest?.reach as number)}</td>
                              <td className="py-2 text-end text-prootech-black">{selectedItem.latest?.engagementRate != null ? `${Number(selectedItem.latest.engagementRate).toFixed(1)}%` : "—"}</td>
                              <td className="py-2 text-end text-prootech-black">{fmt(selectedItem.latest?.impressions as number)}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 text-end text-prootech-black">{fmt(selectedItem.latest?.sessions as number)}</td>
                              <td className="py-2 text-end text-prootech-black">{fmt(selectedItem.latest?.pageviews as number)}</td>
                              <td className="py-2 text-end text-prootech-black">{fmt(selectedItem.latest?.uniqueUsers as number)}</td>
                              <td className="py-2 text-end text-prootech-black">{selectedItem.latest?.bounceRate != null ? `${Number(selectedItem.latest.bounceRate).toFixed(1)}%` : "—"}</td>
                            </>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Surface>
          )}
        </>
      )}

      {/* Modals */}
      {selectedItem && (
        <AddMetricsModal
          open={addMetricsOpen}
          onClose={() => setAddMetricsOpen(false)}
          channelId={String(selectedItem.channel.id)}
          platform={String(selectedItem.channel.platform)}
          onSubmit={(d) => addMetricsMutation.mutate(d)}
          isPending={addMetricsMutation.isPending}
        />
      )}
      <AddChannelModal
        open={addChannelOpen}
        onClose={() => setAddChannelOpen(false)}
        onSubmit={(d) => addChannelMutation.mutate(d)}
        isPending={addChannelMutation.isPending}
      />
    </motion.div>
  );
}
