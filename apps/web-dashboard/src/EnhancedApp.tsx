import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CircleDollarSign, KeyRound, Landmark, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import type { Permission } from "@prootech/shared-types";
import { useAppStore } from "./lib/store";
import { api } from "./lib/api";

const LegacyApp = lazy(() => import("./App").then((module) => ({ default: module.App })));
const AccessPageV2 = lazy(() => import("./pages/AccessPageV2").then((module) => ({ default: module.AccessPageV2 })));
const MyPortalPage = lazy(() => import("./pages/MyPortalPage").then((module) => ({ default: module.MyPortalPage })));
const PersonalContributionsPage = lazy(() => import("./pages/PersonalContributionsPage").then((module) => ({ default: module.PersonalContributionsPage })));
const PremiumLoginPage = lazy(() => import("./pages/PremiumLoginPage").then((module) => ({ default: module.PremiumLoginPage })));

const moduleLinks: Array<{ to: string; permission: Permission; ar: string; en: string; icon: any }> = [
  { to: "/", permission: "analytics:read", ar: "لوحة الإدارة", en: "Executive", icon: LayoutDashboard },
  { to: "/crm", permission: "crm:read", ar: "CRM", en: "CRM", icon: BriefcaseBusiness },
  { to: "/projects", permission: "projects:read", ar: "المشاريع", en: "Projects", icon: BriefcaseBusiness },
  { to: "/finance", permission: "finance:read", ar: "المالية", en: "Finance", icon: CircleDollarSign },
  { to: "/personal-contributions", permission: "finance:read", ar: "مساهمة الدخل", en: "Personal Contribution", icon: Landmark },
  { to: "/ai", permission: "ai:use", ar: "المساعد الذكي", en: "AI", icon: Sparkles }
];

function requiredPermission(pathname: string): Permission | undefined {
  if (pathname === "/") return "analytics:read";
  if (pathname.startsWith("/crm")) return "crm:read";
  if (pathname.startsWith("/projects")) return "projects:read";
  if (pathname.startsWith("/finance") || pathname.startsWith("/ownership") || pathname.startsWith("/personal-contributions")) return "finance:read";
  if (pathname.startsWith("/hr")) return "hr:read";
  if (pathname.startsWith("/partners")) return "partners:read";
  if (pathname.startsWith("/ai-sales")) return "sales:automation";
  if (pathname.startsWith("/growth")) return "analytics:read";
  if (pathname.startsWith("/audit")) return "audit:read";
  if (pathname.startsWith("/ai")) return "ai:use";
  return undefined;
}

function PageLoader() {
  return (
    <div className="grid min-h-[320px] place-items-center">
      <div className="rounded-2xl border border-prootech-line bg-white/90 px-5 py-4 shadow-card">
        <div className="flex items-center gap-3 text-sm text-prootech-text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-prootech-line border-t-prootech-violet" />
          جاري تحميل القسم...
        </div>
      </div>
    </div>
  );
}

function StandaloneShell({ children, showBack = true }: { children: ReactNode; showBack?: boolean }) {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const storeLogout = useAppStore((state) => state.logout);
  const logout = () => { api.logout().catch(() => {}); storeLogout(); navigate("/login"); };
  const availableModules = moduleLinks.filter((item) => user?.permissions?.includes(item.permission));

  return (
    <div className="min-h-screen bg-prootech-canvas text-prootech-black">
      <header className="sticky top-0 z-30 border-b border-prootech-line bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-violet-gradient text-sm font-bold text-white shadow-[0_10px_28px_rgba(99,0,255,.28)]">P</div>
            <div className="hidden sm:block">
              <span className="block text-sm font-semibold tracking-[-0.02em]">Prootech OS</span>
              <span className="mt-0.5 block text-[0.62rem] uppercase tracking-[0.12em] text-prootech-text-subtle">Partner Workspace</span>
            </div>
            {showBack && (
              <button onClick={() => navigate("/")} className="ms-2 inline-flex items-center gap-2 rounded-xl border border-prootech-line bg-white px-3 py-2 text-xs font-medium text-prootech-text-muted shadow-sm hover:border-prootech-violet/20 hover:bg-prootech-violet-soft hover:text-prootech-violet">
                <LayoutDashboard size={14} /> {locale === "ar" ? "الرئيسية" : "Home"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="rounded-xl border border-prootech-line bg-white px-3 py-2 text-xs font-medium shadow-sm hover:bg-prootech-muted">{locale === "ar" ? "EN" : "AR"}</button>
            <span className="hidden rounded-xl bg-prootech-muted px-3 py-2 text-xs font-medium text-prootech-text-muted md:inline">{user?.fullName}</span>
            <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-xl border border-prootech-line bg-white text-prootech-text-muted shadow-sm hover:border-red-100 hover:bg-red-50 hover:text-red-600" title="Logout"><LogOut size={15} /></button>
          </div>
        </div>
        {user?.permissions?.includes("partner:portal") && availableModules.length > 0 && (
          <div className="border-t border-prootech-line/80 bg-white/65">
            <div className="mx-auto flex max-w-[1480px] gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
              <button onClick={() => navigate("/my-portal")} className="shrink-0 rounded-xl bg-prootech-violet px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(99,0,255,.20)]">{locale === "ar" ? "حسابي" : "My Portal"}</button>
              {availableModules.map((item) => {
                const Icon = item.icon;
                return <button key={item.to} onClick={() => navigate(item.to)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-prootech-line bg-white px-3.5 py-2 text-xs font-medium text-prootech-text-muted shadow-sm hover:border-prootech-violet/20 hover:bg-prootech-violet-soft hover:text-prootech-violet"><Icon size={13} />{locale === "ar" ? item.ar : item.en}</button>;
              })}
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:py-9">{children}</main>
    </div>
  );
}

function PartnerPortalRoute() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.permissions?.includes("partner:portal")) return <Navigate to="/" replace />;
  return <StandaloneShell showBack={Boolean(user.permissions.includes("analytics:read"))}><Suspense fallback={<PageLoader />}><MyPortalPage /></Suspense></StandaloneShell>;
}

function AccessRoute() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.permissions?.includes("users:read")) return <Navigate to="/" replace />;
  return <StandaloneShell><Suspense fallback={<PageLoader />}><AccessPageV2 /></Suspense></StandaloneShell>;
}

function PersonalContributionsRoute() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.permissions?.includes("finance:read")) return <Navigate to="/" replace />;
  return <StandaloneShell><Suspense fallback={<PageLoader />}><PersonalContributionsPage /></Suspense></StandaloneShell>;
}

function PermissionNavGuard() {
  const user = useAppStore((state) => state.user);
  const location = useLocation();
  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>("nav a[href]");
    links.forEach((link) => {
      const path = new URL(link.href, window.location.origin).pathname;
      const permission = requiredPermission(path);
      link.style.display = permission && !user?.permissions?.includes(permission) ? "none" : "";
    });
  }, [location.pathname, user?.permissions]);
  return null;
}

function SmartLegacy() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  const location = useLocation();
  const isPartner = Boolean(token && user?.permissions?.includes("partner:portal"));
  const required = requiredPermission(location.pathname);

  if (isPartner && location.pathname === "/" && !user?.permissions?.includes("analytics:read")) return <Navigate to="/my-portal" replace />;
  if (isPartner && required && !user?.permissions?.includes(required)) return <Navigate to="/my-portal" replace />;

  return (
    <>
      <Suspense fallback={<PageLoader />}><LegacyApp /></Suspense>
      <PermissionNavGuard />
      {token && user?.permissions?.includes("users:read") && (
        <a href="/access" className="fixed bottom-5 start-5 z-50 inline-flex items-center gap-2 rounded-2xl bg-prootech-black px-4 py-3 text-xs font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-prootech-violet">
          <KeyRound size={15} />
          الحسابات والصلاحيات
        </a>
      )}
      {token && user?.permissions?.includes("finance:read") && (
        <a href="/personal-contributions" className="fixed bottom-5 end-5 z-50 inline-flex items-center gap-2 rounded-2xl bg-violet-gradient px-4 py-3 text-xs font-semibold text-white shadow-xl transition hover:-translate-y-0.5">
          <Landmark size={15} />
          مساهمة الدخل الشخصي
        </a>
      )}
    </>
  );
}

export function EnhancedApp() {
  return (
    <Routes>
      <Route path="/login" element={<Suspense fallback={<PageLoader />}><PremiumLoginPage /></Suspense>} />
      <Route path="/access" element={<AccessRoute />} />
      <Route path="/my-portal" element={<PartnerPortalRoute />} />
      <Route path="/personal-contributions" element={<PersonalContributionsRoute />} />
      <Route path="/*" element={<SmartLegacy />} />
    </Routes>
  );
}
