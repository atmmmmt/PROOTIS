import type { LucideIcon } from "lucide-react";
import {
  Bot,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Radar,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards
} from "lucide-react";
import type { Permission } from "@prootech/shared-types";

export type AppNavItem = {
  to: string;
  ar: string;
  en: string;
  icon: LucideIcon;
  permission: Permission;
  end?: boolean;
};

export type AppNavGroup = {
  id: "overview" | "work" | "finance" | "people" | "intelligence" | "admin";
  ar: string;
  en: string;
  items: AppNavItem[];
};

export const navGroups: AppNavGroup[] = [
  {
    id: "overview",
    ar: "الرئيسية",
    en: "Overview",
    items: [
      { to: "/", ar: "لوحة الإدارة", en: "Executive Dashboard", icon: LayoutDashboard, permission: "analytics:read", end: true }
    ]
  },
  {
    id: "work",
    ar: "العمل",
    en: "Work",
    items: [
      { to: "/crm", ar: "العملاء والمبيعات", en: "CRM & Sales", icon: BriefcaseBusiness, permission: "crm:read", end: true },
      { to: "/projects", ar: "المشاريع والتسليم", en: "Projects & Delivery", icon: ClipboardList, permission: "projects:read" }
    ]
  },
  {
    id: "finance",
    ar: "المالية",
    en: "Finance",
    items: [
      { to: "/finance", ar: "المركز المالي", en: "Finance Center", icon: CircleDollarSign, permission: "finance:read", end: true },
      { to: "/finance/distribution", ar: "الحصص والتسويات", en: "Shares & Settlements", icon: Scale, permission: "finance:read", end: true },
      { to: "/finance/contributions", ar: "مساهمات الدخل", en: "Income Contributions", icon: Landmark, permission: "finance:read", end: true }
    ]
  },
  {
    id: "people",
    ar: "الفريق",
    en: "People",
    items: [
      { to: "/team/employees", ar: "الموظفون والرواتب", en: "Employees & Payroll", icon: Users, permission: "hr:read", end: true },
      { to: "/team/partners", ar: "الشركاء والاتفاقيات", en: "Partners & Agreements", icon: WalletCards, permission: "partners:read", end: true }
    ]
  },
  {
    id: "intelligence",
    ar: "النمو والذكاء",
    en: "Growth & Intelligence",
    items: [
      { to: "/intelligence/growth", ar: "النمو والتحليلات", en: "Growth & Analytics", icon: TrendingUp, permission: "analytics:read", end: true },
      { to: "/intelligence/sales", ar: "المبيعات الذكية", en: "AI Sales", icon: Radar, permission: "sales:automation", end: true },
      { to: "/intelligence/assistant", ar: "المساعد الذكي", en: "AI Assistant", icon: Bot, permission: "ai:use", end: true }
    ]
  },
  {
    id: "admin",
    ar: "الإدارة",
    en: "Administration",
    items: [
      { to: "/admin/audit", ar: "سجل التدقيق", en: "Audit Log", icon: ShieldCheck, permission: "audit:read", end: true },
      { to: "/admin/access", ar: "الحسابات والصلاحيات", en: "Accounts & Permissions", icon: KeyRound, permission: "users:read", end: true }
    ]
  }
];

export const allNavItems = navGroups.flatMap((group) => group.items);

export function canAccess(permissions: Permission[] | undefined, permission: Permission) {
  return Boolean(permissions?.includes(permission));
}

export function permissionForPath(pathname: string): Permission | undefined {
  if (pathname === "/") return "analytics:read";
  if (pathname.startsWith("/crm")) return "crm:read";
  if (pathname.startsWith("/projects")) return "projects:read";
  if (pathname.startsWith("/finance") || pathname.startsWith("/ownership") || pathname.startsWith("/personal-contributions")) return "finance:read";
  if (pathname.startsWith("/team/employees") || pathname.startsWith("/hr")) return "hr:read";
  if (pathname.startsWith("/team/partners") || pathname.startsWith("/partners")) return "partners:read";
  if (pathname.startsWith("/intelligence/sales") || pathname.startsWith("/ai-sales")) return "sales:automation";
  if (pathname.startsWith("/intelligence/growth") || pathname.startsWith("/growth")) return "analytics:read";
  if (pathname.startsWith("/intelligence/assistant") || pathname.startsWith("/ai")) return "ai:use";
  if (pathname.startsWith("/admin/audit") || pathname.startsWith("/audit")) return "audit:read";
  if (pathname.startsWith("/admin/access") || pathname.startsWith("/access")) return "users:read";
  return undefined;
}

export function navGroupForPath(pathname: string): AppNavGroup | undefined {
  if (pathname === "/") return navGroups.find((group) => group.id === "overview");
  if (pathname.startsWith("/crm") || pathname.startsWith("/projects")) return navGroups.find((group) => group.id === "work");
  if (pathname.startsWith("/finance") || pathname.startsWith("/ownership") || pathname.startsWith("/personal-contributions")) return navGroups.find((group) => group.id === "finance");
  if (pathname.startsWith("/team") || pathname.startsWith("/hr") || pathname.startsWith("/partners")) return navGroups.find((group) => group.id === "people");
  if (pathname.startsWith("/intelligence") || pathname.startsWith("/growth") || pathname.startsWith("/ai-sales") || pathname.startsWith("/ai")) return navGroups.find((group) => group.id === "intelligence");
  if (pathname.startsWith("/admin") || pathname.startsWith("/audit") || pathname.startsWith("/access")) return navGroups.find((group) => group.id === "admin");
  return undefined;
}

export function firstAllowedPath(permissions: Permission[] | undefined) {
  const item = allNavItems.find((candidate) => canAccess(permissions, candidate.permission));
  return item?.to ?? "/login";
}
