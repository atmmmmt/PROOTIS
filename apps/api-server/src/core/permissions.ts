import type { Permission, RoleCode } from "@prootech/shared-types";

export const rolePermissions: Record<RoleCode, Permission[]> = {
  super_admin: [
    "platform:admin",
    "users:read",
    "users:write",
    "crm:read",
    "crm:write",
    "sales:automation",
    "projects:read",
    "projects:write",
    "finance:read",
    "finance:write",
    "finance:export",
    "hr:read",
    "hr:write",
    "hr:payroll",
    "partners:read",
    "partners:write",
    "analytics:read",
    "audit:read",
    "ai:use"
  ],
  ceo: ["users:read", "crm:read", "sales:automation", "projects:read", "finance:read", "hr:read", "partners:read", "analytics:read", "audit:read", "ai:use"],
  executive: ["crm:read", "sales:automation", "projects:read", "finance:read", "hr:read", "partners:read", "analytics:read", "ai:use"],
  sales_manager: ["crm:read", "crm:write", "sales:automation", "projects:read", "finance:read", "analytics:read", "ai:use"],
  sales_rep: ["crm:read", "crm:write", "sales:automation", "projects:read", "ai:use"],
  pm: ["crm:read", "projects:read", "projects:write", "analytics:read", "ai:use"],
  finance_admin: ["finance:read", "finance:write", "finance:export", "partners:read", "partners:write", "analytics:read", "audit:read", "ai:use"],
  finance_ops: ["finance:read", "finance:write", "partners:read", "analytics:read", "ai:use"],
  hr_admin: ["hr:read", "hr:write", "hr:payroll", "analytics:read", "audit:read", "ai:use"],
  hr_ops: ["hr:read", "hr:write", "analytics:read", "ai:use"],
  partner_manager: ["partners:read", "partners:write", "crm:read", "finance:read", "analytics:read", "ai:use"],
  auditor: ["crm:read", "projects:read", "finance:read", "hr:read", "partners:read", "analytics:read", "audit:read"],
  employee: ["projects:read", "hr:read", "ai:use"],
  ai_service_account: ["ai:use"]
};

export function expandPermissions(roles: RoleCode[]): Permission[] {
  return [...new Set(roles.flatMap((role) => rolePermissions[role] ?? []))];
}
