import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useAppStore } from "./lib/store";
import { api } from "./lib/api";
import { allNavItems, canAccess, firstAllowedPath, permissionForPath } from "./navigation";

const LegacyApp = lazy(() => import("./App").then((module) => ({ default: module.App })));
const MyPortalPage = lazy(() => import("./pages/MyPortalPage").then((module) => ({ default: module.MyPortalPage })));
const PremiumLoginPage = lazy(() => import("./pages/PremiumLoginPage").then((module) => ({ default: module.PremiumLoginPage })));

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

const partnerPrimaryPaths = new Set(["/", "/crm", "/projects", "/finance", "/intelligence/assistant"]);

function StandaloneShell({ children, showBack = true }: { children: ReactNode; showBack?: boolean }) {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const storeLogout = useAppStore((state) => state.logout);
  const logout = () => { api.logout().catch(() => {}); storeLogout(); navigate("/login"); };
  const availableModules = allNavItems.filter((item) => partnerPrimaryPaths.has(item.to) && canAccess(user?.permissions, item.permission));

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
              <button onClick={() => navigate(firstAllowedPath(user?.permissions))} className="ms-2 inline-flex items-center gap-2 rounded-xl border border-prootech-line bg-white px-3 py-2 text-xs text-prootech-text-muted shadow-sm hover:bg-prootech-muted">
                <LayoutDashboard size={14} /> {locale === "ar" ? "النظام" : "Workspace"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="rounded-xl border border-prootech-line bg-white px-3 py-2 text-xs font-medium shadow-sm hover:bg-prootech-muted">{locale === "ar" ? "EN" : "AR"}</button>
            <span className="hidden rounded-xl bg-prootech-muted px-3 py-2 text-xs font-medium text-prootech-text-muted md:inline">{user?.fullName}</span>
            <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-xl border border-prootech-line bg-white text-prootech-text-muted shadow-sm hover:border-red-100 hover:bg-red-50 hover:text-red-600" title="Logout"><LogOut size={15} /></button>
          </div>
        </div>
        {availableModules.length > 0 && (
          <div className="border-t border-prootech-line/80 bg-white/65">
            <div className="mx-auto flex max-w-[1480px] gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
              <button onClick={() => navigate("/my-portal")} className="shrink-0 rounded-xl bg-prootech-violet px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(99,0,255,.20)]">{locale === "ar" ? "حسابي" : "My Portal"}</button>
              {availableModules.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.to} onClick={() => navigate(item.to)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-prootech-line bg-white px-3.5 py-2 text-xs font-medium text-prootech-text-muted shadow-sm hover:border-prootech-violet/20 hover:bg-prootech-violet-soft hover:text-prootech-violet">
                    <Icon size={13} />{locale === "ar" ? item.ar : item.en}
                  </button>
                );
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
  if (!user?.permissions?.includes("partner:portal")) return <Navigate to={firstAllowedPath(user?.permissions)} replace />;
  return <StandaloneShell showBack={Boolean(firstAllowedPath(user.permissions) !== "/login")}><Suspense fallback={<PageLoader />}><MyPortalPage /></Suspense></StandaloneShell>;
}

function SmartLegacy() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  const location = useLocation();
  const required = permissionForPath(location.pathname);
  const isPartner = Boolean(user?.permissions?.includes("partner:portal"));

  if (token && required && !user?.permissions?.includes(required)) {
    return <Navigate to={isPartner ? "/my-portal" : firstAllowedPath(user?.permissions)} replace />;
  }

  return <Suspense fallback={<PageLoader />}><LegacyApp /></Suspense>;
}

export function EnhancedApp() {
  return (
    <Routes>
      <Route path="/login" element={<Suspense fallback={<PageLoader />}><PremiumLoginPage /></Suspense>} />
      <Route path="/my-portal" element={<PartnerPortalRoute />} />
      <Route path="/*" element={<SmartLegacy />} />
    </Routes>
  );
}
