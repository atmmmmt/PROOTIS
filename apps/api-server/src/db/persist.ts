import mongoose from "mongoose";
import { logger } from "../core/logger.js";
import type { db as DbType } from "../data/demo-store.js";

// Map collection names to Mongoose model names
const collectionModelMap: Record<string, string> = {
  leads: "Lead",
  accounts: "Account",
  contacts: "Contact",
  opportunities: "Opportunity",
  activities: "CrmActivity",
  proposals: "Proposal",
  contracts: "Contract",
  projects: "Project",
  milestones: "ProjectMilestone",
  deliverables: "Deliverable",
  timesheets: "Timesheet",
  invoices: "Invoice",
  invoiceLines: "InvoiceLine",
  payments: "Payment",
  expenses: "Expense",
  revenueSnapshots: "RevenueSnapshot",
  employees: "Employee",
  employmentContracts: "EmploymentContract",
  leaveRequests: "LeaveRequest",
  payrollRuns: "PayrollRun",
  payrollItems: "PayrollItem",
  payslips: "Payslip",
  partners: "Partner",
  partnerAgreements: "PartnerAgreement",
  partnerShareRules: "PartnerShareRule",
  partnerSettlements: "PartnerSettlement",
  aiConversations: "AiConversation",
  aiMessages: "AiMessage",
  aiToolCalls: "AiToolCall",
  aiFeedback: "AiFeedback",
  aiSalesCampaigns: "AiSalesCampaign",
  aiSalesProspects: "AiSalesProspect",
  aiSalesActivities: "AiSalesActivity",
  auditLogs: "AuditLog",
  organizations: "Organization",
  users: "User",
  roles: "Role",
  notifications: "Notification",
  files: "File",
  projectLinks: "ProjectLink",
  projectFiles: "ProjectFile",
  growthChannels: "GrowthChannel",
  growthMetrics: "GrowthMetric"
};

function isConnected() {
  return mongoose.connection.readyState === 1;
}

function getModel(collectionName: string): mongoose.Model<mongoose.Document> | undefined {
  const modelName = collectionModelMap[collectionName];
  if (!modelName) return undefined;
  try {
    return mongoose.model(modelName) as mongoose.Model<mongoose.Document>;
  } catch {
    return undefined;
  }
}

function toMongoDoc(record: Record<string, unknown>): Record<string, unknown> {
  const { id, ...rest } = record;
  return { _id: id, ...rest };
}

function fromMongoDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id ?? ""), ...rest };
}

export function persistCreate(collectionName: string, record: Record<string, unknown>): void {
  if (!isConnected()) return;
  const model = getModel(collectionName);
  if (!model) return;
  model.create(toMongoDoc(record)).catch((err) => {
    logger.warn({ err, collectionName, id: record.id }, "MongoDB persistCreate failed");
  });
}

export function persistUpdate(collectionName: string, id: string, record: Record<string, unknown>): void {
  if (!isConnected()) return;
  const model = getModel(collectionName);
  if (!model) return;
  const { id: _id, ...update } = record;
  model.findByIdAndUpdate(id, { $set: update }).catch((err) => {
    logger.warn({ err, collectionName, id }, "MongoDB persistUpdate failed");
  });
}

export function persistDelete(collectionName: string, id: string): void {
  if (!isConnected()) return;
  const model = getModel(collectionName);
  if (!model) return;
  model.findByIdAndDelete(id).catch((err) => {
    logger.warn({ err, collectionName, id }, "MongoDB persistDelete failed");
  });
}

export async function hydrateFromMongo(db: typeof DbType): Promise<void> {
  if (!isConnected()) return;
  logger.info("Hydrating in-memory store from MongoDB...");

  const collectionKeys = Object.keys(collectionModelMap) as Array<keyof typeof DbType>;
  await Promise.allSettled(
    collectionKeys.map(async (key) => {
      const model = getModel(key as string);
      if (!model) return;
      const docs = await model.find({}).lean();
      if (docs.length === 0) return;
      const collection = db[key] as Array<Record<string, unknown>>;
      collection.splice(0, collection.length, ...(docs as Array<Record<string, unknown>>).map(fromMongoDoc));
      logger.info({ collection: key, count: docs.length }, "Hydrated from MongoDB");
    })
  );

  logger.info("MongoDB hydration complete.");
}
