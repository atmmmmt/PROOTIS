import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CircleDollarSign, KeyRound, Landmark, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import type { Permission } from "@prootech/shared-types";
import { App as LegacyApp } from "./App";
import { AccessPageV2 } from "./pages/AccessPageV2";
import { MyPortalPage } from "./pages/MyPortalPage";
import { PersonalContributionsPage } from "./pages/PersonalContributionsPage";
import { useAppStore } from "./lib/store";
import { api } from "./lib/api";

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

function StandaloneShell({ children, showBack = true }: { children: ReactNode; showBack?: boolean }) {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const storeLogout = useAppStore((state) => state.logout);
  const logout = () => { api.logout().catch(() => {}); storeLogout(); navigate("/login"); };
  const availableModules = moduleLinks.filter((item) => user?.permissions?.includes(item.permission));

  return (
    <div className="min-h-screen bg-prootech-muted text-prootech-black">
      <header className="sticky top-0 z-30 border-b border-prootech-line bg-white shadow-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-prootech-violet text-xs font-bold text-white">P</div>
            <span className="text-sm font-semibold">Prootech OS</span>
            {showBack && (
              <button onClick={() => navigate("/")} className="ms-2 inline-flex items-center gap-2 rounded-lg border border-prootech-line px-3 py-1.5 text-xs text-prootech-text-muted hover:bg-prootech-muted">
                <LayoutDashboard size={14} /> {locale === "ar" ? "الرئيسية" : "Home"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocale(locale === "ar" ? "en" : "ar")} className="rounded-lg border border-prootech-line px-3 py-1.5 text-xs font-medium">{locale === "ar" ? "EN" : "AR"}</button>
            <span className="hidden text-xs text-prootech-text-muted sm:inline">{user?.fullName}</span>
            <button onClick={logout} className="rounded-lg border border-prootech-line p-2 text-prootech-text-muted hover:bg-prootech-muted" title="Logout"><LogOut size={15} /></button>
          </div>
        </div>
        {user?.permissions?.includes("partner:portal") && availableModules.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-t border-prootech-line px-4 py-2 sm:px-6">
            <button onClick={() => navigate("/my-portal")} className="shrink-0 rounded-lg bg-prootech-violet-soft px-3 py-1.5 text-xs font-medium text-prootech-violet">{locale === "ar" ? "حسابي" : "My Portal"}</button>
            {availableModules.map((item) => {
              const Icon = item.icon;
              return <button key={item.to} onClick={() => navigate(item.to)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-prootech-line px-3 py-1.5 text-xs text-prootech-text-muted hover:bg-prootech-muted"><Icon size={13} />{locale === "ar" ? item.ar : item.en}</button>;
            })}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

function PartnerPortalRoute() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.permissions?.includes("partner:portal")) return <Navigate to="/" replace />;
  return <StandaloneShell showBack={Boolean(user.permissions.includes("analytics:read"))}><MyPortalPage /></StandaloneShell>;
}

function AccessRoute() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.permissions?.includes("users:read")) return <Navigate to="/" replace />;
  return <StandaloneShell><AccessPageV2 /></StandaloneShell>;
}

function PersonalContributionsRoute() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.permissions?.includes("finance:read")) return <Navigate to="/" replace />;
  return <StandaloneShell><PersonalContributionsPage /></StandaloneShell>;
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
      <LegacyApp />
      <PermissionNavGuard />
      {token && user?.permissions?.includes("users:read") && (
        <a href="/access" className="fixed bottom-5 start-5 z-50 inline-flex items-center gap-2 rounded-xl bg-prootech-black px-4 py-2.5 text-xs font-semibold text-white shadow-xl transition hover:bg-prootech-violet">
          <KeyRound size={15} />
          الحسابات والصلاحيات
        </a>
      )}
      {token && user?.permissions?.includes("finance:read") && (
        <a href="/personal-contributions" className="fixed bottom-5 end-5 z-50 inline-flex items-center gap-2 rounded-xl bg-prootech-violet px-4 py-2.5 text-xs font-semibold text-white shadow-xl transition hover:bg-prootech-violet-light">
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
      <Route path="/access" element={<AccessRoute />} />
      <Route path="/my-portal" element={<PartnerPortalRoute />} />
      <Route path="/personal-contributions" element={<PersonalContributionsRoute />} />
      <Route path="/*" element={<SmartLegacy />} />
    </Routes>
  );
}
