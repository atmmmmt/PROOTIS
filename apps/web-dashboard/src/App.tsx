import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  ChevronsLeft,
  Languages,
  Menu,
  X
} from "lucide-react";
import type { DashboardPayload } from "@prootech/shared-types";
import { api } from "./lib/api";
import { useAppStore } from "./lib/store";
import { t } from "./lib/i18n";
import { KpiCard, RiskItem, SectionHeader, Surface } from "./components/ui";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { PremiumLoginPage } from "./pages/PremiumLoginPage";
import { canAccess, navGroupForPath, navGroups, type AppNavItem } from "./navigation";

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
const AccessPage = lazy(() => import("./pages/AccessPageV2").then((module) => ({ default: module.AccessPageV2 })));
const PersonalContributionsPage = lazy(() => import("./pages/PersonalContributionsPage").then((module) => ({ default: module.PersonalContributionsPage })));
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
      <div className="rounded-2xl border border-prootech-line bg-white/90 px-5 py-4 shadow-card">
        <div className="flex items-center gap-3 text-sm text-prootech-text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-prootech-line border-t-prootech-violet" />
          {locale === "ar" ? "جاري تحميل القسم..." : "Loading module..."}
        </div>
      </div>
    </div>
  );
}

function itemMatches(pathname: string, item: AppNavItem) {
  if (item.to === "/") return pathname === "/";
  if (item.end === false || item.end === undefined) return pathname === item.to || pathname.startsWith(`${item.to}/`);
  return pathname === item.to;
}

function SidebarSections({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { locale } = useLocale();
  const user = useAppStore((state) => state.user);

  return (
    <nav className="flex-1 overflow-y-auto px-2.5 py-4 scrollbar-thin">
      <div className="space-y-5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => canAccess(user?.permissions, item.permission));
          if (!visibleItems.length) return null;
          return (
            <section key={group.id}>
              {!collapsed ? (
                <p className="mb-2 px-3 text-[0.61rem] font-semibold uppercase tracking-[0.16em] text-white/30">
                  {locale === "ar" ? group.ar : group.en}
                </p>
              ) : (
                <div className="mx-auto mb-2 h-px w-7 bg-white/10" />
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={Boolean(item.end)}
                      onClick={onNavigate}
                      title={collapsed ? (locale === "ar" ? item.ar : item.en) : undefined}
                      className={({ isActive }) => `flex min-h-10 items-center rounded-xl border transition-all duration-150 ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${isActive ? "border-white/10 bg-prootech-violet text-white shadow-[0_10px_28px_rgba(99,0,255,.28)]" : "border-transparent text-white/55 hover:border-white/[0.06] hover:bg-white/[0.055] hover:text-white"}`}
                    >
                      <Icon size={17} strokeWidth={2} className="shrink-0" />
                      {!collapsed && <span className="truncate text-[0.79rem] font-medium">{locale === "ar" ? item.ar : item.en}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </nav>
  );
}

function AppShell() {
  const { locale, isAr } = useLocale();
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const setLocale = useAppStore((state) => state.setLocale);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const storeLogout = useAppStore((state) => state.logout);
  const logout = () => { api.logout().catch(() => {}); storeLogout(); };
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificationsReady, setNotificationsReady] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isAr ? "rtl" : "ltr";
  }, [isAr, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => setNotificationsReady(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications,
    enabled: notificationsReady,
    staleTime: 2 * 60_000,
    refetchInterval: 2 * 60_000
  });
  const unreadCount = (notifData?.rows ?? []).filter((n) => n.status === "unread").length;

  const activeGroup = navGroupForPath(location.pathname);
  const visibleContextItems = activeGroup?.items.filter((item) => canAccess(user?.permissions, item.permission)) ?? [];
  const activeItem = visibleContextItems.find((item) => itemMatches(location.pathname, item));

  return (
    <div className="min-h-screen bg-prootech-canvas text-prootech-black">
      <aside className={`fixed inset-y-0 z-40 hidden border-prootech-line bg-[#0b090f] shadow-card transition-all duration-300 lg:flex lg:flex-col ${isAr ? "right-0 border-l" : "left-0 border-r"} ${sidebarOpen ? "w-[248px]" : "w-[72px]"}`}>
        <div className={`flex h-16 shrink-0 items-center border-b border-white/[0.08] ${sidebarOpen ? "justify-between px-4" : "justify-center px-2"}`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-gradient text-xs font-bold text-white shadow-[0_10px_28px_rgba(99,0,255,.28)]">P</div>
            {sidebarOpen && (
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-white">PROOTECH</span>
                <span className="block truncate text-[0.58rem] uppercase tracking-[0.15em] text-white/30">Operating System</span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button aria-label="collapse sidebar" onClick={toggleSidebar} className="rounded-lg p-1.5 text-white/45 hover:bg-white/[0.06] hover:text-white">
              <ChevronsLeft size={16} className={isAr ? "rotate-180" : ""} />
            </button>
          )}
        </div>

        <SidebarSections collapsed={!sidebarOpen} />

        <div className="border-t border-white/[0.08] p-2.5">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.035] p-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-semibold text-white">
                {(user?.fullName?.trim()?.[0] ?? "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white/85">{user?.fullName ?? "User"}</p>
                <p className="mt-0.5 truncate text-[0.62rem] text-white/35">{user?.email ?? ""}</p>
              </div>
            </div>
          ) : (
            <button onClick={toggleSidebar} className="mx-auto grid h-10 w-10 place-items-center rounded-xl text-white/45 hover:bg-white/[0.06] hover:text-white" title="Expand navigation">
              <ChevronsLeft size={16} className={isAr ? "" : "rotate-180"} />
            </button>
          )}
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="close menu" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className={`absolute inset-y-0 w-[286px] bg-[#0b090f] shadow-2xl ${isAr ? "right-0" : "left-0"}`}>
            <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-gradient text-xs font-bold text-white">P</div>
                <div>
                  <p className="text-sm font-semibold text-white">PROOTECH</p>
                  <p className="text-[0.58rem] uppercase tracking-[0.15em] text-white/30">Operating System</p>
                </div>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white/55"><X size={17} /></button>
            </div>
            <SidebarSections collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className={`transition-all duration-300 ${sidebarOpen ? (isAr ? "lg:mr-[248px]" : "lg:ml-[248px]") : isAr ? "lg:mr-[72px]" : "lg:ml-[72px]"}`}>
        <header className="sticky top-0 z-30 border-b border-prootech-line bg-white/85 shadow-sm backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button className="grid h-9 w-9 place-items-center rounded-xl border border-prootech-line bg-white text-prootech-text-muted shadow-sm hover:bg-prootech-muted lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="menu">
              <Menu size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[0.64rem] font-medium uppercase tracking-[0.11em] text-prootech-text-subtle">
                <Building2 size={12} />
                <span>Prootech Agency</span>
                {activeGroup && <><span className="text-prootech-line-strong">/</span><span>{locale === "ar" ? activeGroup.ar : activeGroup.en}</span></>}
              </div>
              <h1 className="mt-0.5 truncate text-sm font-semibold tracking-[-0.02em] text-prootech-black">
                {activeItem ? (locale === "ar" ? activeItem.ar : activeItem.en) : (locale === "ar" ? "نظام إدارة الشركة" : "Company Operating System")}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="rounded-xl border border-prootech-line bg-white px-3 py-2 text-xs font-medium text-prootech-text-muted shadow-sm hover:bg-prootech-muted" aria-label="language">
                <Languages size={15} className="inline me-1.5" />{locale === "ar" ? "EN" : "AR"}
              </button>
              <div className="relative">
                <button onClick={() => setNotifOpen((open) => !open)} className="relative grid h-9 w-9 place-items-center rounded-xl border border-prootech-line bg-white text-prootech-text-muted shadow-sm hover:bg-prootech-muted" aria-label="alerts">
                  <Bell size={16} />
                  {unreadCount > 0 && <span className="absolute -top-1 -end-1 grid h-4 min-w-4 place-items-center rounded-full bg-prootech-violet px-1 text-[0.52rem] font-bold text-white ring-2 ring-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
                <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
              </div>
              <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-xl bg-prootech-black text-xs font-semibold text-white shadow-sm hover:bg-prootech-violet" title={locale === "ar" ? "تسجيل الخروج" : "Logout"}>
                {(user?.fullName?.trim()?.[0] ?? "U").toUpperCase()}
              </button>
            </div>
          </div>

          {visibleContextItems.length > 1 && (
            <div className="border-t border-prootech-line/80 bg-white/60 px-4 sm:px-6">
              <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-thin">
                {visibleContextItems.map((item) => {
                  const Icon = item.icon;
                  const active = itemMatches(location.pathname, item);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={Boolean(item.end)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${active ? "bg-prootech-violet-soft text-prootech-violet shadow-[inset_0_0_0_1px_rgba(99,0,255,.12)]" : "text-prootech-text-muted hover:bg-prootech-muted hover:text-prootech-black"}`}
                    >
                      <Icon size={14} />
                      {locale === "ar" ? item.ar : item.en}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:py-8">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route index element={<ExecutivePage />} />
              <Route path="/crm" element={<CrmPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />

              <Route path="/finance" element={<FinancePage />} />
              <Route path="/finance/distribution" element={<OwnershipPage />} />
              <Route path="/finance/contributions" element={<PersonalContributionsPage />} />

              <Route path="/team" element={<Navigate to="/team/employees" replace />} />
              <Route path="/team/employees" element={<HrPage />} />
              <Route path="/team/partners" element={<PartnersPage />} />

              <Route path="/intelligence/growth" element={<GrowthPage />} />
              <Route path="/intelligence/sales" element={<AiSalesPage />} />
              <Route path="/intelligence/assistant" element={<AiPage />} />

              <Route path="/admin/audit" element={<AuditPage />} />
              <Route path="/admin/access" element={<AccessPage />} />

              <Route path="/ownership" element={<Navigate to="/finance/distribution" replace />} />
              <Route path="/personal-contributions" element={<Navigate to="/finance/contributions" replace />} />
              <Route path="/hr" element={<Navigate to="/team/employees" replace />} />
              <Route path="/partners" element={<Navigate to="/team/partners" replace />} />
              <Route path="/growth" element={<Navigate to="/intelligence/growth" replace />} />
              <Route path="/ai-sales" element={<Navigate to="/intelligence/sales" replace />} />
              <Route path="/ai" element={<Navigate to="/intelligence/assistant" replace />} />
              <Route path="/audit" element={<Navigate to="/admin/audit" replace />} />
              <Route path="/access" element={<Navigate to="/admin/access" replace />} />
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
        <Surface className="p-5">
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
    <section className="overflow-hidden rounded-[26px] bg-hero-gradient text-white">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-medium text-white/60">
            Prootech Agency &nbsp;·&nbsp; {new Date().toLocaleDateString(locale === "ar" ? "ar-SY" : "en-US")}
          </p>
          <h1 className="max-w-2xl text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.025em] sm:text-[2.35rem]">
            {locale === "ar"
              ? "صورة واحدة واضحة لتشغيل الشركة: العمل، التحصيل، الفريق، التسليم، والشركاء."
              : "One clear operating view across work, cash, people, delivery, and partners."}
          </h1>
        </div>
        <div className="grid content-end gap-3">
          {dashboard.aiInsights.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-[0.8125rem] leading-[1.7] text-white/80 backdrop-blur-sm">
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
    <Surface className="p-5">
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
        <section className="overflow-hidden rounded-[26px] bg-hero-gradient p-8 text-white">
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
        <Surface className="p-5"><AiChat /></Surface>
      </div>
      {conversations && conversations.rows.length > 0 && (
        <Surface className="p-5">
          <SectionHeader title={locale === "ar" ? "سجل المحادثات" : "Conversation History"} />
          <div className="space-y-2">
            {conversations.rows.slice(0, 8).map((c) => (
              <div key={String(c.id)} className="rounded-xl border border-prootech-line p-3">
                <p className="truncate text-[0.8125rem] font-medium text-prootech-black">{String(c.title)}</p>
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
        <button onClick={() => chat.mutate(message)} disabled={chat.isPending || !message.trim()} className="shrink-0 rounded-xl bg-prootech-violet px-4 py-2.5 text-sm font-medium text-white hover:bg-prootech-violet-light disabled:opacity-60">
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
                  <button key={r} onClick={() => { setRating((prev) => ({ ...prev, [item.id]: r })); feedback.mutate({ id: item.id, r }); }} className={`text-sm ${(rating[item.id] ?? 0) >= r ? "text-amber-400" : "text-prootech-line hover:text-amber-300"}`}>★</button>
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
      <div className="h-80 animate-pulse rounded-2xl bg-prootech-muted-strong" />
      <div className="h-80 animate-pulse rounded-2xl bg-prootech-muted-strong" />
    </section>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-5">
      <div className="h-52 animate-pulse rounded-[26px] bg-prootech-muted-strong" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-prootech-muted-strong" />)}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-prootech-muted-strong" />
        <div className="h-72 animate-pulse rounded-2xl bg-prootech-muted-strong" />
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
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <PremiumLoginPage />} />
      <Route path="/*" element={protectedApp} />
    </Routes>
  );
}
