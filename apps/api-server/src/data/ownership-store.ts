import {
  DistributionAllocationModel,
  DistributionReceiptModel,
  DistributionTemplateModel,
  OwnershipBeneficiaryModel,
  PayoutEventModel,
  ProjectDistributionProfileModel,
  SaasProductModel,
  SaasSubscriptionModel,
  ServiceCatalogModel
} from "../models/ownership.models.js";
import { logger } from "../core/logger.js";
import mongoose from "mongoose";

export const ownershipDb = {
  beneficiaries: [] as Array<Record<string, any>>,
  serviceCatalog: [] as Array<Record<string, any>>,
  templates: [] as Array<Record<string, any>>,
  projectProfiles: [] as Array<Record<string, any>>,
  receipts: [] as Array<Record<string, any>>,
  allocations: [] as Array<Record<string, any>>,
  payoutEvents: [] as Array<Record<string, any>>,
  saasProducts: [] as Array<Record<string, any>>,
  saasSubscriptions: [] as Array<Record<string, any>>
};

type OwnershipCollection = keyof typeof ownershipDb;

const models = {
  beneficiaries: OwnershipBeneficiaryModel,
  serviceCatalog: ServiceCatalogModel,
  templates: DistributionTemplateModel,
  projectProfiles: ProjectDistributionProfileModel,
  receipts: DistributionReceiptModel,
  allocations: DistributionAllocationModel,
  payoutEvents: PayoutEventModel,
  saasProducts: SaasProductModel,
  saasSubscriptions: SaasSubscriptionModel
} as const;

const organizationId = "org_prootech";

function connected() {
  return mongoose.connection.readyState === 1;
}

function normalize(doc: Record<string, any>) {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id ?? rest.id ?? ""), ...rest };
}

export function listOwnership(name: OwnershipCollection): Array<Record<string, any>> {
  return ownershipDb[name];
}

export function createOwnership(name: OwnershipCollection, payload: Record<string, any>, actorId?: string): Record<string, any> {
  const id = String(payload.id ?? `${name.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const now = new Date().toISOString();
  const row: Record<string, any> = {
    organizationId,
    status: payload.status ?? "active",
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    ...payload,
    id
  };
  ownershipDb[name].unshift(row);
  if (connected()) {
    const Model = models[name] as any;
    Model.create({ ...row, _id: id, id: undefined }).catch((error: unknown) =>
      logger.warn({ error, collection: name, id }, "Ownership persist create failed")
    );
  }
  return row;
}

export function updateOwnership(name: OwnershipCollection, id: string, payload: Record<string, any>, actorId?: string): Record<string, any> | undefined {
  const rows = ownershipDb[name];
  const index = rows.findIndex((item) => String(item.id) === id);
  if (index < 0) return undefined;
  rows[index] = { ...rows[index], ...payload, id, updatedAt: new Date().toISOString(), updatedBy: actorId };
  if (connected()) {
    const Model = models[name] as any;
    const { id: _id, ...update } = rows[index];
    Model.findByIdAndUpdate(id, { $set: update }, { upsert: true }).catch((error: unknown) =>
      logger.warn({ error, collection: name, id }, "Ownership persist update failed")
    );
  }
  return rows[index];
}

export function deleteOwnership(name: OwnershipCollection, id: string) {
  const rows = ownershipDb[name];
  const index = rows.findIndex((item) => String(item.id) === id);
  if (index < 0) return false;
  rows.splice(index, 1);
  if (connected()) {
    const Model = models[name] as any;
    Model.findByIdAndDelete(id).catch((error: unknown) =>
      logger.warn({ error, collection: name, id }, "Ownership persist delete failed")
    );
  }
  return true;
}

export async function hydrateOwnershipFromMongo() {
  if (!connected()) return;
  logger.info("Hydrating ownership and distribution data from MongoDB...");
  for (const name of Object.keys(ownershipDb) as OwnershipCollection[]) {
    const Model = models[name] as any;
    const docs = await Model.find({ organizationId }).lean();
    if (!docs.length) continue;
    ownershipDb[name].splice(0, ownershipDb[name].length, ...docs.map((doc: any) => normalize(doc)));
  }
  logger.info("Ownership data hydration complete.");
}

function ensure(name: OwnershipCollection, id: string, payload: Record<string, any>) {
  const existing = ownershipDb[name].find((item) => item.id === id);
  if (existing) return existing;
  return createOwnership(name, { id, ...payload }, "system");
}

export function ensureOwnershipDefaults() {
  ensure("beneficiaries", "ben_office", { name: "المكتب", code: "OFFICE", beneficiaryType: "office", status: "active" });
  ensure("beneficiaries", "ben_manager", { name: "المدير", code: "MANAGER", beneficiaryType: "manager", status: "active" });
  ensure("beneficiaries", "ben_ahmad", { name: "أحمد لامع", code: "AHMAD", beneficiaryType: "manager", status: "active" });
  ensure("beneficiaries", "ben_aboudan", { name: "محمد أبو دان", code: "ABU_DAN", beneficiaryType: "partner", status: "active", notes: "صاحب العقار / شريك حسب الاتفاق" });
  ensure("beneficiaries", "ben_abdullatif", { name: "عبد اللطيف رضا", code: "ABDULLATIF", beneficiaryType: "architecture_partner", status: "active", notes: "مسؤول قسم العمارة" });
  ensure("beneficiaries", "ben_work", { name: "فريق العمل / التنفيذ", code: "WORK_POOL", beneficiaryType: "work_pool", status: "active" });
  ensure("beneficiaries", "ben_product", { name: "صندوق المنتج / التشغيل", code: "PRODUCT_POOL", beneficiaryType: "product_pool", status: "active" });

  ensure("serviceCatalog", "dept_programming", { kind: "department", name: "البرمجة", code: "PROGRAMMING", sortOrder: 10, status: "active" });
  ensure("serviceCatalog", "svc_web", { kind: "service", parentId: "dept_programming", name: "مواقع وأنظمة ويب", code: "WEB", sortOrder: 11, status: "active" });
  ensure("serviceCatalog", "svc_mobile", { kind: "service", parentId: "dept_programming", name: "تطبيقات موبايل", code: "MOBILE", sortOrder: 12, status: "active" });
  ensure("serviceCatalog", "svc_saas", { kind: "service", parentId: "dept_programming", name: "SaaS / Products", code: "SAAS", sortOrder: 13, status: "active" });
  ensure("serviceCatalog", "svc_support", { kind: "service", parentId: "dept_programming", name: "صيانة ودعم", code: "SUPPORT", sortOrder: 14, status: "active" });

  ensure("serviceCatalog", "dept_design", { kind: "department", name: "التصميم", code: "DESIGN", sortOrder: 20, status: "active" });
  ensure("serviceCatalog", "svc_uiux", { kind: "service", parentId: "dept_design", name: "UI/UX", code: "UIUX", sortOrder: 21, status: "active" });
  ensure("serviceCatalog", "svc_branding", { kind: "service", parentId: "dept_design", name: "هوية بصرية", code: "BRANDING", sortOrder: 22, status: "active" });
  ensure("serviceCatalog", "svc_graphic", { kind: "service", parentId: "dept_design", name: "تصميم غرافيك", code: "GRAPHIC", sortOrder: 23, status: "active" });

  ensure("serviceCatalog", "dept_marketing", { kind: "department", name: "التسويق", code: "MARKETING", sortOrder: 30, status: "active" });
  ensure("serviceCatalog", "svc_social", { kind: "service", parentId: "dept_marketing", name: "إدارة سوشيال ميديا", code: "SOCIAL", sortOrder: 31, status: "active" });
  ensure("serviceCatalog", "svc_ads", { kind: "service", parentId: "dept_marketing", name: "إعلانات ممولة", code: "ADS", sortOrder: 32, status: "active" });
  ensure("serviceCatalog", "svc_content", { kind: "service", parentId: "dept_marketing", name: "محتوى واستراتيجية", code: "CONTENT", sortOrder: 33, status: "active" });

  ensure("serviceCatalog", "dept_architecture", { kind: "department", name: "العمارة", code: "ARCHITECTURE", managerBeneficiaryId: "ben_abdullatif", sortOrder: 40, status: "active" });
  ensure("serviceCatalog", "svc_interior", { kind: "service", parentId: "dept_architecture", name: "تصميم داخلي", code: "INTERIOR", sortOrder: 41, status: "active" });
  ensure("serviceCatalog", "svc_exterior", { kind: "service", parentId: "dept_architecture", name: "تصميم خارجي", code: "EXTERIOR", sortOrder: 42, status: "active" });
  ensure("serviceCatalog", "svc_plans", { kind: "service", parentId: "dept_architecture", name: "مخططات", code: "PLANS", sortOrder: 43, status: "active" });
  ensure("serviceCatalog", "svc_3d", { kind: "service", parentId: "dept_architecture", name: "3D", code: "3D", sortOrder: 44, status: "active" });
  ensure("serviceCatalog", "svc_supervision", { kind: "service", parentId: "dept_architecture", name: "إشراف وتنفيذ", code: "SUPERVISION", sortOrder: 45, status: "active" });

  const standardRules = [
    { id: "std_office", label: "المكتب", beneficiaryId: "ben_office", kind: "percent", value: 0, applyTo: "pool", order: 10 },
    { id: "std_aboudan", label: "محمد أبو دان", beneficiaryId: "ben_aboudan", kind: "percent", value: 0, applyTo: "pool", order: 20 },
    { id: "std_manager", label: "الإدارة - المدير", beneficiaryId: "ben_manager", kind: "percent", value: 0, applyTo: "pool", order: 30 },
    { id: "std_ahmad", label: "الإدارة - أحمد لامع", beneficiaryId: "ben_ahmad", kind: "percent", value: 0, applyTo: "pool", order: 40 },
    { id: "std_work", label: "فريق العمل", beneficiaryId: "ben_work", kind: "remaining", value: 0, applyTo: "remaining", order: 100 }
  ];
  ensure("templates", "tpl_standard", { name: "المشاريع العادية", code: "STANDARD", scopeType: "global", scopeId: "all", version: 1, isDefault: true, expenseBasis: "gross", roundingMode: "nearest", roundingBeneficiaryId: "ben_office", rules: standardRules, status: "active" });

  ensure("templates", "tpl_architecture", { name: "مشاريع العمارة", code: "ARCHITECTURE", scopeType: "department", scopeId: "dept_architecture", version: 1, isDefault: false, expenseBasis: "gross", roundingMode: "nearest", roundingBeneficiaryId: "ben_office", rules: [
    { id: "arch_office", label: "المكتب", beneficiaryId: "ben_office", kind: "percent", value: 0, applyTo: "pool", order: 10 },
    { id: "arch_aboudan", label: "محمد أبو دان", beneficiaryId: "ben_aboudan", kind: "percent", value: 0, applyTo: "pool", order: 20 },
    { id: "arch_manager", label: "الإدارة - المدير", beneficiaryId: "ben_manager", kind: "percent", value: 0, applyTo: "pool", order: 30 },
    { id: "arch_ahmad", label: "الإدارة - أحمد لامع", beneficiaryId: "ben_ahmad", kind: "percent", value: 0, applyTo: "pool", order: 40 },
    { id: "arch_abdullatif", label: "عبد اللطيف رضا", beneficiaryId: "ben_abdullatif", kind: "percent", value: 0, applyTo: "pool", order: 50 },
    { id: "arch_work", label: "فريق التنفيذ", beneficiaryId: "ben_work", kind: "remaining", value: 0, applyTo: "remaining", order: 100 }
  ], status: "active" });

  ensure("templates", "tpl_saas", { name: "اشتراكات SaaS", code: "SAAS", scopeType: "saas", scopeId: "all", version: 1, isDefault: false, expenseBasis: "gross", roundingMode: "nearest", roundingBeneficiaryId: "ben_office", rules: [
    { id: "saas_office", label: "المكتب", beneficiaryId: "ben_office", kind: "percent", value: 0, applyTo: "pool", order: 10 },
    { id: "saas_aboudan", label: "محمد أبو دان", beneficiaryId: "ben_aboudan", kind: "percent", value: 0, applyTo: "pool", order: 20 },
    { id: "saas_manager", label: "الإدارة - المدير", beneficiaryId: "ben_manager", kind: "percent", value: 0, applyTo: "pool", order: 30 },
    { id: "saas_ahmad", label: "الإدارة - أحمد لامع", beneficiaryId: "ben_ahmad", kind: "percent", value: 0, applyTo: "pool", order: 40 },
    { id: "saas_product", label: "صندوق المنتج / التشغيل", beneficiaryId: "ben_product", kind: "remaining", value: 0, applyTo: "remaining", order: 100 }
  ], status: "active" });
}
