export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

export type RoleCode =
  | "super_admin"
  | "ceo"
  | "executive"
  | "sales_manager"
  | "sales_rep"
  | "pm"
  | "finance_admin"
  | "finance_ops"
  | "hr_admin"
  | "hr_ops"
  | "partner_manager"
  | "auditor"
  | "employee"
  | "ai_service_account";

export type Permission =
  | "platform:admin"
  | "users:read"
  | "users:write"
  | "crm:read"
  | "crm:write"
  | "sales:automation"
  | "projects:read"
  | "projects:write"
  | "finance:read"
  | "finance:write"
  | "finance:export"
  | "hr:read"
  | "hr:write"
  | "hr:payroll"
  | "partners:read"
  | "partners:write"
  | "analytics:read"
  | "audit:read"
  | "ai:use";

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface UserSession {
  id: string;
  organizationId: string;
  employeeId?: string;
  fullName: string;
  email: string;
  roles: RoleCode[];
  permissions: Permission[];
  locale: Locale;
  mfaEnabled: boolean;
}

export interface KpiCard {
  id: string;
  labelAr: string;
  labelEn: string;
  value: string;
  delta: string;
  tone: "good" | "watch" | "risk" | "neutral";
}

export interface DashboardPayload {
  kpis: KpiCard[];
  pipeline: Array<{ stage: string; count: number; value: number }>;
  revenue: Array<{ month: string; booked: number; collected: number }>;
  arAging: Array<{ bucket: string; amount: number }>;
  risks: Array<{ id: string; titleAr: string; titleEn: string; severity: "low" | "medium" | "high" }>;
  aiInsights: Array<{ id: string; textAr: string; textEn: string }>;
}

export interface DataTableResponse<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type AiSalesMode = "copilot" | "semi_autonomous";
export type AiSalesProspectStatus =
  | "researched"
  | "draft_ready"
  | "approval_required"
  | "approved"
  | "scheduled"
  | "sent"
  | "opened"
  | "replied"
  | "qualified"
  | "rejected";

export interface AiSalesCampaign {
  id: string;
  name: string;
  sector: string;
  region: string;
  objective: string;
  mode: AiSalesMode;
  status: "draft" | "active" | "paused" | "completed";
  targetTitle: string;
  language: Locale;
  createdAt: string;
  approvedCount: number;
  sentCount: number;
  qualifiedCount: number;
}

export interface AiSalesProspect {
  id: string;
  campaignId: string;
  companyName: string;
  website: string;
  country: string;
  industry: string;
  sizeBand: string;
  contactName: string;
  contactTitle: string;
  email: string;
  fitScore: number;
  observation: string;
  likelyImpact: string;
  suggestedAngle: string;
  draftSubject: string;
  draftBody: string;
  status: AiSalesProspectStatus;
  nextAction: string;
  deliverySignal: "none" | "queued" | "opened" | "replied";
  createdAt: string;
}

export interface AiSalesActivity {
  id: string;
  campaignId: string;
  prospectId?: string;
  type: "research" | "draft" | "approval" | "crm_push" | "send" | "open" | "reply" | "qualification";
  title: string;
  detail: string;
  createdAt: string;
}

export interface AiSalesOverview {
  metrics: Array<{
    id: string;
    labelAr: string;
    labelEn: string;
    value: string;
    delta: string;
    tone: "good" | "watch" | "risk" | "neutral";
  }>;
  campaigns: AiSalesCampaign[];
  approvalQueue: AiSalesProspect[];
  activityFeed: AiSalesActivity[];
  managerSummary: {
    topAngleAr: string;
    topAngleEn: string;
    weakPointAr: string;
    weakPointEn: string;
    recommendationAr: string;
    recommendationEn: string;
  };
}
