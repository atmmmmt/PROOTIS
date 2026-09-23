import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell, Bot, BriefcaseBusiness, Building2, ChevronsLeft,
  CircleDollarSign, ClipboardList, Languages, LayoutDashboard,
  Lock, Radar, Menu, Search, Settings2, ShieldCheck, TrendingUp, Users, WalletCards
} from "lucide-react";
import type { DashboardPayload } from "@prootech/shared-types";
import { api } from "./lib/api";
import { useAppStore } from "./lib/store";
import { t } from "./lib/i18n";
import { KpiCard, RiskItem, SectionHeader, Surface } from "./components/ui";
import { NotificationsPanel } from "./components/NotificationsPanel";

const CrmPage = lazy(() => import("./pages/CrmPage").then((module) => ({ default: module.CrmPage })));
const FinancePage = lazy(() => import("./pages/FinancePage").then((module) => ({ default: module.FinancePage })));
const HrPage = lazy(() => import("./pages/HrPage").then((module) => ({ default: module.HrPage })));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage").then((module) => ({ default: module.ProjectsPage })));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage").then((module) => ({ default: module.ProjectDetailPage })));
const PartnersPage = lazy(() => import("./pages/PartnersPage").then((module) => ({ default: module.PartnersPage })));
const AuditPage = lazy(() => import("./pages/AuditPage").then((module) => ({ default: module.AuditPage })));
const GrowthPage = lazy(() => import("./pages/GrowthPage").then((module) => ({ default: module.GrowthPage })));
const OwnershipPage = lazy(() => import("./pages/OwnershipPage").then((module) => ({ default: module.OwnershipPage })));
const AiSalesPage = lazy(() => import("./pages/AiSalesPage").then((module) => ({ default: module.AiSalesPage })));
const RevenueChart = lazy(() => import("./components/Charts").then((module) => ({ default: module.RevenueChart })));
const PipelineChart = lazy(() => import("./components/Charts").then((module) => ({ default: module.PipelineChart })));

function useLocale() {
  const locale = useAppStore((state) => state.locale);
  return { locale, isAr: locale === "ar" };
}

function RouteLoader() {
  const locale = useAppStore((state) => state.locale);
  return (
    <div className="grid min-h-[320px] place-items-center">
      <div className="flex items-center gap-3 text-sm text-prootech-text-muted">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-prootech-line border-t-prootech-violet" />
        {locale === "ar" ? "جاري تحميل القسم..." : "Loading module..."}
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAppStore((state) => state.setSession);
  const { locale } = useLocale();
  const [email, setEmail] = useState("admin@prootech.agency");
  const [password, setPassword] = useState("Prootech@2026");

  const login = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (payload) => { setSession(payload); navigate("/"); }
  });

  return (
    <main className="min-h-screen bg-hero-gradient text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex min-h-[46vh] flex-col justify-between overflow-hidden px-8 py-8 sm:px-12 lg:min-h-screen">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-prootech-violet text-sm font-bold shadow-lg">P</div>
              <span className="text-sm font-semibold tracking-tight">Prootech OS</span>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-medium text-white/60">Arabic-first Platform</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl py-12">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
              Operating System for Prootech Agency
            </p>
            <h1 className="text-4xl font-semibold leading-[1.15] tracking-[-0.02em] sm:text-5xl lg:text-[3.25rem]">
              منصة تشغيل داخلية تربط المبيعات، المشاريع، المالية، الموارد البشرية، الشركاء، والذكاء الاصطناعي.
            </h1>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["CRM", "Finance", "HR", "AI"] as const).map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-medium text-white/80 backdrop-blur-sm">{item}</div>
              ))}
            </div>
          </motion.div>
          <p className="text-xs text-white/35 tracking-wide">Identity-first · Audit-first · AI with guardrails</p>
        </section>

        <section className="flex items-center bg-white px-8 py-10 text-prootech-black sm:px-12">
          <form onSubmit={(e) => { e.preventDefault(); login.mutate(); }} className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-prootech-violet text-white shadow-lg"><Lock size={20} /></div>
              <h2 className="text-2xl font-semibold tracking-tight">{t(locale, "login")}</h2>
              <p className="mt-2 text-sm leading-6 text-prootech-text-muted">استخدم بيانات demo للدخول واستعراض المنصة كاملة.</p>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{t(locale, "email")}</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-3 text-sm outline-none transition focus:border-prootech-violet focus:bg-white focus:shadow-violet-glow" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-prootech-text-muted">{t(locale, "password")}</span>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-xl border border-prootech-line bg-prootech-muted px-4 py-3 text-sm outline-none transition focus:border-prootech-violet focus:bg-white focus:shadow-violet-glow" />
              </label>
            </div>
            {login.error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{login.error.message}</p>}
            <button className="mt-6 w-full rounded-xl bg-prootech-violet px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-prootech-violet-light hover:shadow-xl active:scale-[0.98]" type="submit">
              {login.isPending ? "جاري الدخول..." : t(locale, "login")}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

const navItems = [
  { to: "/", label: "executive", icon: LayoutDashboard },
  { to: "/crm", label: "crm", icon: BriefcaseBusiness },
  { to: "/projects", label: "projects", icon: ClipboardList },
  { to: "/finance", label: "finance", icon: CircleDollarSign },
  { to: "/ownership", label: "shareRules", icon: Settings2 },
  { to: "/hr", label: "hr", icon: Users },
  { to: "/partners", label: "partners", icon: WalletCards },
  { to: "/ai-sales", label: "aiSales", icon: Radar },
  { to: "/growth", label: "growth", icon: TrendingUp },
  { to: "/audit", label: "audit", icon: ShieldCheck },
  { to: "/ai", label: "ai", icon: Bot }
] as const;

function AppShell() {
  const { locale, isAr } = useLocale();
  const user = useAppStore((state) => state.user);
  const setLocale = useAppStore((state) => state.setLocale);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const storeLogout = useAppStore((state) => state.logout);
  const logout = () => { api.logout().catch(() => {}); storeLogout(); };
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificationsReady, setNotificationsReady] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isAr ? "rtl" : "ltr";
  }, [isAr, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => setNotificationsReady(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications,
    enabled: notificationsReady,
    staleTime: 2 * 60_000,
    refetchInterval: 2 * 60_000
  });
  const unreadCount = (notifData?.rows ?? []).filter((n) => n.status === "unread").length;

  return (
    <div className="min-h-screen bg-prootech-muted text-prootech-black">
      <aside className={`fixed inset-y-0 z-40 hidden border-prootech-line bg-white shadow-card transition-all duration-300 lg:flex lg:flex-col ${isAr ? "right-0 border-l" : "left-0 border-r"} ${sidebarOpen ? "w-[220px]" : "w-[60px]"}`}>
        <div className={`flex h-14 shrink-0 items-center border-b border-prootech-line ${sidebarOpen ? "justify-between px-4" : "justify-center px-2"}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-prootech-violet text-xs font-bold text-white">P</div>
            {sidebarOpen && <span className="truncate text-sm font-semibold tracking-tight">Prootech OS</span>}
          </div>
          {sidebarOpen && (
            <button aria-label="toggle sidebar" onClick={toggleSidebar} className="rounded-lg p-1.5 text-prootech-text-muted hover:bg-prootech-muted">
              <ChevronsLeft size={16} />
            </button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} end={item.to === "/"} title={!sidebarOpen ? t(locale, item.label) : undefined}
                  className={({ isActive }) => `flex items-center rounded-lg transition-all duration-150 ${sidebarOpen ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"} ${isActive ? "bg-prootech-violet text-white shadow-sm" : "text-prootech-text-muted hover:bg-prootech-muted hover:text-prootech-black"}`}
                >
                  <Icon size={17} strokeWidth={2} />
                  {sidebarOpen && <span className="text-[0.8125rem] font-medium">{t(locale, item.label)}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>
        {!sidebarOpen && (
          <button onClick={toggleSidebar} className="flex h-10 items-center justify-center border-t border-prootech-line text-prootech-text-muted hover:bg-prootech-muted">
            <ChevronsLeft size={16} className="rotate-180" />
          </button>
        )}
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? (isAr ? "lg:mr-[220px]" : "lg:ml-[220px]") : isAr ? "lg:mr-[60px]" : "lg:ml-[60px]"}`}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-prootech-line bg-white/95 px-4 shadow-sm backdrop-blur-md">
          <button className="rounded-lg p-1.5 text-prootech-text-muted hover:bg-prootech-muted lg:hidden" onClick={toggleSidebar} aria-label="menu">
            <Menu size={18} />
          </button>
          <label className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-prootech-line bg-prootech-muted px-3 py-2 text-xs text-prootech-text-muted transition-colors focus-within:border-prootech-violet focus-within:bg-white md:flex">
            <Search size={14} strokeWidth={2} className="shrink-0" />
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder={t(locale, "search_placeholder")}
              className="w-full bg-transparent text-xs outline-none placeholder:text-prootech-text-subtle"
            />
          </label>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-prootech-line bg-white px-3 py-1.5 text-xs font-medium text-prootech-text-muted hover:bg-prootech-muted">
              <Building2 size={14} />
              <span className="hidden sm:inline">Prootech Agency</span>
            </button>
            <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="rounded-lg border border-prootech-line bg-white p-1.5 text-prootech-text-muted hover:bg-prootech-muted" aria-label="language">
              <Languages size={16} />
            </button>
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative rounded-lg border border-prootech-line bg-white p-1.5 text-prootech-text-muted hover:bg-prootech-muted"
                aria-label="alerts"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-prootech-violet text-[0.55rem] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-prootech-black text-xs font-semibold text-white hover:bg-prootech-violet"
              title="Logout"
            >
              {(user?.fullName?.split(" ")[0] ?? "U")[0]}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route index element={<ExecutivePage />} />
              <Route path="/crm" element={<CrmPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/ownership" element={<OwnershipPage />} />
              <Route path="/hr" element={<HrPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/ai-sales" element={<AiSalesPage />} />
              <Route path="/growth" element={<GrowthPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/ai" element={<AiPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function ExecutivePage() {
  const { locale } = useLocale();
  const { data, isLoading } = useQuery({ queryKey: ["executive"], queryFn: api.executiveDashboard, staleTime: 90_000 });
  if (isLoading || !data) return <SkeletonDashboard />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Hero dashboard={data} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} label={locale === "ar" ? kpi.labelAr : kpi.labelEn} value={kpi.value} delta={kpi.delta} tone={kpi.tone} />
        ))}
      </section>
      <Suspense fallback={<ChartSkeleton />}>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RevenueChart data={data.revenue} />
          <PipelineChart data={data.pipeline} />
        </section>
      </Suspense>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Surface className="p-4">
          <SectionHeader title={t(locale, "risks")} />
          <div className="grid gap-3">
            {data.risks.map((risk) => (
              <RiskItem key={risk.id} title={locale === "ar" ? risk.titleAr : risk.titleEn} severity={risk.severity} />
            ))}
          </div>
        </Surface>
        <AiPanelInline />
      </section>
    </motion.div>
  );
}

function Hero({ dashboard }: { dashboard: DashboardPayload }) {
  const { locale } = useLocale();
  return (
    <section className="overflow-hidden rounded-2xl bg-hero-gradient text-white">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-medium text-white/60">
            Prootech Agency &nbsp;·&nbsp; {new Date().toLocaleDateString(locale === "ar" ? "ar-SY" : "en-US")}
          </p>
          <h1 className="max-w-2xl text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[2.25rem]">
            {locale === "ar"
              ? "قيادة الشركة من لوحة واحدة: الإيراد، التحصيل، الفريق، التسليم، والشركاء."
              : "Run the company from one command view: revenue, collection, team, delivery, and partners."}
          </h1>
        </div>
        <div className="grid content-end gap-3">
          {dashboard.aiInsights.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/6 p-4 text-[0.8125rem] leading-[1.7] text-white/80 backdrop-blur-sm">
              {locale === "ar" ? item.textAr : item.textEn}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiPanelInline() {
  return (
    <Surface className="p-4">
      <SectionHeader title="AI Assistant" />
      <AiChat compact />
    </Surface>
  );
}

function AiPage() {
  const { locale } = useLocale();
  const { data: conversations } = useQuery({ queryKey: ["ai-conversations"], queryFn: api.aiConversations, staleTime: 2 * 60_000 });
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl bg-hero-gradient p-8 text-white">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-medium text-white/60">
            Tool-based assistant
          </p>
          <h1 className="text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.02em]">
            مساعد تنفيذي مقيد بالصلاحيات، لا يصل للداتا إلا عبر أدوات آمنة.
          </h1>
          <p className="mt-4 text-[0.8125rem] leading-7 text-white/60">
            يمكنه الإجابة عن أسئلة مالية، مبيعات، موارد بشرية، ومشاريع — عبر أدوات محدودة الصلاحيات.
          </p>
        </section>
        <Surface className="p-5">
          <AiChat />
        </Surface>
      </div>
      {conversations && conversations.rows.length > 0 && (
        <Surface className="p-5">
          <SectionHeader title={locale === "ar" ? "سجل المحادثات" : "Conversation History"} />
          <div className="space-y-2">
            {conversations.rows.slice(0, 8).map((c) => (
              <div key={String(c.id)} className="rounded-xl border border-prootech-line p-3">
                <p className="text-[0.8125rem] font-medium text-prootech-black truncate">{String(c.title)}</p>
                <p className="mt-0.5 text-[0.75rem] text-prootech-text-muted">{new Date(String(c.createdAt)).toLocaleString(locale === "ar" ? "ar-SY" : "en-US")}</p>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </div>
  );
}

function AiChat({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();
  const [message, setMessage] = useState(locale === "ar" ? "ليش collection rate نازل هذا الشهر؟" : "Why is the gross margin down this month?");
  const [history, setHistory] = useState<Array<{ q: string; a: string; tool: string; id: string }>>([]);
  const [rating, setRating] = useState<Record<string, number>>({});

  const chat = useMutation({
    mutationFn: api.aiChat,
    onSuccess: (payload, question) => {
      const id = `msg_${Date.now()}`;
      setHistory((items) => [{ q: question, a: locale === "ar" ? payload.answerAr : payload.answerEn, tool: payload.tool, id }, ...items].slice(0, 6));
    }
  });

  const feedback = useMutation({ mutationFn: ({ id, r }: { id: string; r: number }) => api.aiFeedback(id, r) });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && chat.mutate(message)}
          className="min-w-0 flex-1 rounded-xl border border-prootech-line bg-prootech-muted px-4 py-2.5 text-sm outline-none transition focus:border-prootech-violet focus:bg-white"
          placeholder={locale === "ar" ? "اسأل عن أي مؤشر أو سجل..." : "Ask about any metric or record..."}
        />
        <button
          onClick={() => chat.mutate(message)}
          disabled={chat.isPending || !message.trim()}
          className="shrink-0 rounded-xl bg-prootech-violet px-4 py-2.5 text-sm font-medium text-white hover:bg-prootech-violet-light disabled:opacity-60"
        >
          {chat.isPending ? "..." : "Ask"}
        </button>
      </div>
      <div className={`space-y-2 ${compact ? "max-h-72 overflow-y-auto scrollbar-thin" : ""}`}>
        {history.map((item) => (
          <div key={item.id} className="rounded-xl border border-prootech-line bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-prootech-violet">{item.tool}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRating((prev) => ({ ...prev, [item.id]: r })); feedback.mutate({ id: item.id, r }); }}
                    className={`text-sm ${(rating[item.id] ?? 0) >= r ? "text-amber-400" : "text-prootech-line hover:text-amber-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[0.8125rem] font-semibold text-prootech-black">{item.q}</p>
            <p className="mt-2 text-[0.8125rem] leading-6 text-prootech-text-muted">{item.a}</p>
          </div>
        ))}
        {history.length === 0 && (
          <div className="rounded-xl bg-prootech-muted px-4 py-5 text-[0.8125rem] leading-7 text-prootech-text-muted">
            {locale === "ar" ? "اسأل عن التحصيل، الهامش، صحة المشاريع، أو الخطوة التالية." : "Ask about collection, margin, project health, or next best action."}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="h-80 animate-pulse rounded-xl bg-prootech-muted-strong" />
      <div className="h-80 animate-pulse rounded-xl bg-prootech-muted-strong" />
    </section>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-5">
      <div className="h-52 animate-pulse rounded-2xl bg-prootech-muted-strong" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-prootech-muted-strong" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-prootech-muted-strong" />
        <div className="h-72 animate-pulse rounded-xl bg-prootech-muted-strong" />
      </div>
    </div>
  );
}

export function App() {
  const token = useAppStore((state) => state.accessToken);
  const locale = useAppStore((state) => state.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const protectedApp = useMemo(() => (token ? <AppShell /> : <Navigate to="/login" replace />), [token]);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={protectedApp} />
    </Routes>
  );
}
