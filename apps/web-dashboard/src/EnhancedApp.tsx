import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { KeyRound, LayoutDashboard, LogOut } from "lucide-react";
import { App as LegacyApp } from "./App";
import { AccessPage } from "./pages/AccessPage";
import { MyPortalPage } from "./pages/MyPortalPage";
import { useAppStore } from "./lib/store";
import { api } from "./lib/api";

function StandaloneShell({ children, showBack = true }: { children: React.ReactNode; showBack?: boolean }) {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const storeLogout = useAppStore((state) => state.logout);
  const logout = () => { api.logout().catch(() => {}); storeLogout(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-prootech-muted text-prootech-black">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-prootech-line bg-white px-4 shadow-sm sm:px-6">
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
  return <StandaloneShell><AccessPage /></StandaloneShell>;
}

function SmartLegacy() {
  const token = useAppStore((state) => state.accessToken);
  const user = useAppStore((state) => state.user);
  const partnerOnly = Boolean(token && user?.permissions?.includes("partner:portal") && !user.permissions.includes("analytics:read"));
  if (partnerOnly) return <Navigate to="/my-portal" replace />;
  return (
    <>
      <LegacyApp />
      {token && user?.permissions?.includes("users:read") && (
        <a href="/access" className="fixed bottom-5 start-5 z-50 inline-flex items-center gap-2 rounded-xl bg-prootech-black px-4 py-2.5 text-xs font-semibold text-white shadow-xl transition hover:bg-prootech-violet">
          <KeyRound size={15} />
          الحسابات والصلاحيات
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
      <Route path="/*" element={<SmartLegacy />} />
    </Routes>
  );
}
