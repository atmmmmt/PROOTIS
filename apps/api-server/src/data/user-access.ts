import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { Permission, RoleCode, UserAccessScope, UserSession } from "@prootech/shared-types";
import { expandPermissions } from "../core/permissions.js";
import { createRecord, db, updateRecord } from "./demo-store.js";
import { ownershipDb, updateOwnership } from "./ownership-store.js";

const allowedRoles: RoleCode[] = [
  "super_admin", "ceo", "executive", "sales_manager", "sales_rep", "pm",
  "finance_admin", "finance_ops", "hr_admin", "hr_ops", "partner_manager",
  "partner", "auditor", "employee", "ai_service_account"
];

const allowedPermissions: Permission[] = [
  "platform:admin", "users:read", "users:write", "crm:read", "crm:write",
  "sales:automation", "projects:read", "projects:write", "finance:read",
  "finance:write", "finance:export", "hr:read", "hr:write", "hr:payroll",
  "partners:read", "partners:write", "partner:portal", "analytics:read",
  "audit:read", "ai:use"
];

const editableProjectFields = ["status", "healthStatus", "description", "startDate", "endDate"] as const;

type UserRow = Record<string, any>;

function cleanRoles(input: unknown): RoleCode[] {
  if (!Array.isArray(input)) return [];
  return input.filter((value): value is RoleCode => allowedRoles.includes(value as RoleCode));
}

function cleanPermissions(input: unknown): Permission[] {
  if (!Array.isArray(input)) return [];
  return input.filter((value): value is Permission => allowedPermissions.includes(value as Permission));
}

function cleanScope(input: unknown): UserAccessScope {
  const scope = input && typeof input === "object" ? input as Record<string, any> : {};
  return {
    canViewAllProjects: Boolean(scope.canViewAllProjects),
    departmentIds: Array.isArray(scope.departmentIds) ? scope.departmentIds.map(String) : [],
    projectIds: Array.isArray(scope.projectIds) ? scope.projectIds.map(String) : [],
    canViewCompanyGrowth: Boolean(scope.canViewCompanyGrowth),
    canViewProjectFinancials: Boolean(scope.canViewProjectFinancials),
    editableProjectFields: Array.isArray(scope.editableProjectFields)
      ? scope.editableProjectFields.filter((field: unknown) => editableProjectFields.includes(field as any))
      : []
  };
}

function computedPermissions(row: UserRow): Permission[] {
  const base = expandPermissions(cleanRoles(row.roles));
  const overrides = cleanPermissions(row.permissionsOverrides);
  const denied = new Set(cleanPermissions(row.deniedPermissions));
  return [...new Set([...base, ...overrides])].filter((permission) => !denied.has(permission));
}

export function toUserSession(row: UserRow): UserSession {
  return {
    id: String(row.id),
    organizationId: String(row.organizationId ?? "org_prootech"),
    employeeId: row.employeeId ? String(row.employeeId) : undefined,
    fullName: String(row.fullName ?? row.email ?? "User"),
    email: String(row.email ?? ""),
    roles: cleanRoles(row.roles),
    permissions: computedPermissions(row),
    permissionsOverrides: cleanPermissions(row.permissionsOverrides),
    deniedPermissions: cleanPermissions(row.deniedPermissions),
    accessScope: cleanScope(row.accessScope),
    locale: row.locale === "en" ? "en" : "ar",
    mfaEnabled: Boolean(row.mfaEnabled)
  };
}

export function findCredentialUserByEmail(email: string) {
  const row = (db.users as UserRow[]).find((user) => String(user.email ?? "").toLowerCase() === email.toLowerCase());
  if (!row || ["inactive", "disabled", "archived"].includes(String(row.status))) return undefined;
  return row;
}

export function getUserSession(id: string) {
  const row = (db.users as UserRow[]).find((user) => String(user.id) === id);
  if (!row || ["inactive", "disabled", "archived"].includes(String(row.status))) return undefined;
  return toUserSession(row);
}

export function verifyAccessPassword(user: UserRow, password: string) {
  return typeof user.passwordHash === "string" && user.passwordHash.length > 0 && bcrypt.compareSync(password, user.passwordHash);
}

export function listAccessUsers() {
  return (db.users as UserRow[]).map((row) => {
    const session = toUserSession(row);
    const beneficiary = ownershipDb.beneficiaries.find((item) => item.relatedUserId === row.id);
    return {
      ...session,
      status: row.status ?? "active",
      beneficiaryId: beneficiary?.id,
      beneficiaryName: beneficiary?.name,
      hasPassword: Boolean(row.passwordHash),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  });
}

function linkBeneficiary(userId: string, beneficiaryId?: string) {
  for (const beneficiary of ownershipDb.beneficiaries) {
    if (beneficiary.relatedUserId === userId && beneficiary.id !== beneficiaryId) {
      updateOwnership("beneficiaries", String(beneficiary.id), { relatedUserId: undefined }, userId);
    }
  }
  if (!beneficiaryId) return;
  const beneficiary = ownershipDb.beneficiaries.find((item) => item.id === beneficiaryId);
  if (beneficiary) updateOwnership("beneficiaries", beneficiaryId, { relatedUserId: userId }, userId);
}

export function createAccessUser(payload: Record<string, any>, actorId?: string) {
  const email = String(payload.email ?? "").trim().toLowerCase();
  const fullName = String(payload.fullName ?? "").trim();
  const password = String(payload.password ?? "");
  if (!email || !email.includes("@")) throw new Error("A valid email is required.");
  if (!fullName) throw new Error("Full name is required.");
  if (password.length < 8) throw new Error("Password must contain at least 8 characters.");
  if ((db.users as UserRow[]).some((user) => String(user.email ?? "").toLowerCase() === email)) throw new Error("Email already exists.");

  const roles = cleanRoles(payload.roles?.length ? payload.roles : ["partner"]);
  const row = createRecord("users", {
    fullName,
    email,
    phone: payload.phone ?? "",
    passwordHash: bcrypt.hashSync(password, 10),
    roles,
    permissionsOverrides: cleanPermissions(payload.permissionsOverrides),
    deniedPermissions: cleanPermissions(payload.deniedPermissions),
    accessScope: cleanScope(payload.accessScope),
    locale: payload.locale === "en" ? "en" : "ar",
    mfaEnabled: Boolean(payload.mfaEnabled),
    status: payload.status ?? "active"
  }, actorId) as UserRow;
  linkBeneficiary(String(row.id), payload.beneficiaryId ? String(payload.beneficiaryId) : undefined);
  return { ...toUserSession(row), beneficiaryId: payload.beneficiaryId, status: row.status };
}

export function updateAccessUser(id: string, payload: Record<string, any>, actorId?: string) {
  const existing = (db.users as UserRow[]).find((user) => String(user.id) === id);
  if (!existing) return undefined;
  const update: Record<string, any> = {};
  if (payload.fullName !== undefined) update.fullName = String(payload.fullName).trim();
  if (payload.email !== undefined) update.email = String(payload.email).trim().toLowerCase();
  if (payload.phone !== undefined) update.phone = String(payload.phone);
  if (payload.roles !== undefined && (cleanRoles(existing.roles).includes("partner") || payload.allowRoleChange === true)) update.roles = cleanRoles(payload.roles);
  if (payload.permissionsOverrides !== undefined) update.permissionsOverrides = cleanPermissions(payload.permissionsOverrides);
  if (payload.deniedPermissions !== undefined) update.deniedPermissions = cleanPermissions(payload.deniedPermissions);
  if (payload.accessScope !== undefined) update.accessScope = cleanScope(payload.accessScope);
  if (payload.locale !== undefined) update.locale = payload.locale === "en" ? "en" : "ar";
  if (payload.mfaEnabled !== undefined) update.mfaEnabled = Boolean(payload.mfaEnabled);
  if (payload.status !== undefined && !cleanRoles(existing.roles).includes("super_admin")) update.status = String(payload.status);
  if (payload.password !== undefined && String(payload.password).length >= 8) update.passwordHash = bcrypt.hashSync(String(payload.password), 10);
  const row = updateRecord("users", id, update) as UserRow | undefined;
  if (!row) return undefined;
  if (payload.beneficiaryId !== undefined) linkBeneficiary(id, payload.beneficiaryId ? String(payload.beneficiaryId) : undefined);
  const beneficiary = ownershipDb.beneficiaries.find((item) => item.relatedUserId === id);
  return { ...toUserSession(row), beneficiaryId: beneficiary?.id, beneficiaryName: beneficiary?.name, status: row.status };
}

export function resetAccessPassword(id: string, requestedPassword?: string) {
  const password = requestedPassword && requestedPassword.length >= 8 ? requestedPassword : generateTemporaryPassword();
  const row = updateRecord("users", id, { passwordHash: bcrypt.hashSync(password, 10) });
  if (!row) return undefined;
  return { password };
}

export function generateTemporaryPassword() {
  return `Pr!${randomBytes(9).toString("base64url")}9a`;
}

const defaultPartnerAccounts = [
  {
    fullName: "أحمد لامع",
    email: "ahmad@prootech.agency",
    beneficiaryId: "ben_ahmad",
    accessScope: {
      canViewAllProjects: true,
      departmentIds: [],
      projectIds: [],
      canViewCompanyGrowth: true,
      canViewProjectFinancials: false,
      editableProjectFields: []
    }
  },
  {
    fullName: "محمد أبو دان",
    email: "aboudan@prootech.agency",
    beneficiaryId: "ben_aboudan",
    accessScope: {
      canViewAllProjects: true,
      departmentIds: [],
      projectIds: [],
      canViewCompanyGrowth: true,
      canViewProjectFinancials: false,
      editableProjectFields: []
    }
  },
  {
    fullName: "عبد اللطيف رضا",
    email: "abdullatif@prootech.agency",
    beneficiaryId: "ben_abdullatif",
    accessScope: {
      canViewAllProjects: false,
      departmentIds: ["dept_architecture"],
      projectIds: [],
      canViewCompanyGrowth: true,
      canViewProjectFinancials: false,
      editableProjectFields: ["status", "healthStatus"]
    }
  }
];

export function createDefaultPartnerAccounts(actorId?: string) {
  return defaultPartnerAccounts.map((definition) => {
    const beneficiary = ownershipDb.beneficiaries.find((item) => item.id === definition.beneficiaryId);
    const linked = beneficiary?.relatedUserId ? (db.users as UserRow[]).find((user) => user.id === beneficiary.relatedUserId) : undefined;
    const existing = linked ?? (db.users as UserRow[]).find((user) => String(user.email ?? "").toLowerCase() === definition.email);
    if (existing) {
      linkBeneficiary(String(existing.id), definition.beneficiaryId);
      updateAccessUser(String(existing.id), { roles: ["partner"], accessScope: definition.accessScope, allowRoleChange: true }, actorId);
      return { fullName: definition.fullName, email: definition.email, status: "existing", password: null };
    }
    const password = generateTemporaryPassword();
    createAccessUser({
      ...definition,
      password,
      roles: ["partner"],
      permissionsOverrides: [],
      deniedPermissions: [],
      locale: "ar",
      status: "active"
    }, actorId);
    return { fullName: definition.fullName, email: definition.email, status: "created", password };
  });
}
