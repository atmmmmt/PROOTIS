import type { AiSalesCampaign, AiSalesOverview, AiSalesProspect, DashboardPayload } from "@prootech/shared-types";
import { useAppStore } from "./store";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface TableResponse<T = Record<string, unknown>> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAppStore.getState().accessToken;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });

  const body = (await response.json()) as Envelope<T> | { error: { message: string } };
  if (!response.ok) {
    throw new Error("error" in body ? body.error.message : "Request failed");
  }
  return (body as Envelope<T>).data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: any; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  // Analytics
  executiveDashboard: () => request<DashboardPayload>("/analytics/dashboard/executive"),
  salesDashboard: () => request<any>("/analytics/dashboard/sales"),
  financeDashboard: () => request<any>("/analytics/dashboard/finance"),
  hrDashboard: () => request<any>("/analytics/dashboard/hr"),
  projectsDashboard: () => request<any>("/analytics/dashboard/projects"),

  // Generic CRUD
  table: <T = Record<string, unknown>>(path: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<TableResponse<T>>(`${path}${qs}`);
  },
  getOne: <T = Record<string, unknown>>(path: string, id: string) => request<T>(`${path}/${id}`),
  create: <T = Record<string, unknown>>(path: string, payload: Record<string, unknown>) =>
    request<T>(path, { method: "POST", body: JSON.stringify(payload) }),
  update: <T = Record<string, unknown>>(path: string, id: string, payload: Record<string, unknown>) =>
    request<T>(`${path}/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (path: string, id: string) => request<{ deleted: boolean; id: string }>(`${path}/${id}`, { method: "DELETE" }),

  // Workflow actions (no body needed)
  action: <T = Record<string, unknown>>(method: "POST" | "PATCH", path: string, body?: Record<string, unknown>) =>
    request<T>(path, { method, body: body ? JSON.stringify(body) : undefined }),

  // Notifications
  notifications: () => request<TableResponse>("/platform/notifications"),
  markNotificationRead: (id: string) => api.update("/platform/notifications", id, { status: "read" }),

  // AI Sales
  aiSalesOverview: () => request<AiSalesOverview>("/ai-sales/overview"),
  aiSalesCampaigns: () => request<TableResponse<AiSalesCampaign>>("/ai-sales/campaigns"),
  aiSalesProspects: () => request<TableResponse<AiSalesProspect>>("/ai-sales/prospects"),
  createAiSalesCampaign: (payload: object) =>
    request<AiSalesCampaign>("/ai-sales/campaigns", { method: "POST", body: JSON.stringify(payload) }),
  generateAiSalesProspects: (campaignId: string) =>
    request<{ createdCount: number; rows: AiSalesProspect[] }>(`/ai-sales/campaigns/${campaignId}/generate-prospects`, { method: "POST" }),
  activateAiSalesCampaign: (campaignId: string) =>
    request<AiSalesCampaign>(`/ai-sales/campaigns/${campaignId}/activate`, { method: "POST" }),
  approveAiSalesProspect: (prospectId: string) => request(`/ai-sales/prospects/${prospectId}/approve`, { method: "POST" }),
  rejectAiSalesProspect: (prospectId: string) => request(`/ai-sales/prospects/${prospectId}/reject`, { method: "POST" }),
  sendAiSalesProspect: (prospectId: string) => request(`/ai-sales/prospects/${prospectId}/send`, { method: "POST" }),
  simulateAiSalesReply: (prospectId: string) => request(`/ai-sales/prospects/${prospectId}/simulate-reply`, { method: "POST" }),
  pushAiSalesProspectToCrm: (prospectId: string) => request(`/ai-sales/prospects/${prospectId}/push-to-crm`, { method: "POST" }),

  // Growth / Social
  growthOverview: () => request<any[]>("/growth/overview"),
  growthChannels: () => request<{ rows: any[]; total: number }>("/growth/channels"),
  growthChannelHistory: (id: string) => request<any>(`/growth/channels/${id}/history`),
  addGrowthMetrics: (channelId: string, payload: Record<string, unknown>) =>
    request(`/growth/channels/${channelId}/metrics`, { method: "POST", body: JSON.stringify(payload) }),
  addGrowthChannel: (payload: Record<string, unknown>) =>
    request("/growth/channels", { method: "POST", body: JSON.stringify(payload) }),

  // Project Hub
  projectHub: (projectId: string) => request<{ project: Record<string, unknown>; links: Record<string, unknown>[]; files: Record<string, unknown>[]; milestones: Record<string, unknown>[]; deliverables: Record<string, unknown>[]; totalHours: number; billableHours: number }>(`/projects/${projectId}/hub`),
  projectLinks: (projectId: string) => request<{ rows: any[]; total: number }>(`/projects/${projectId}/links`),
  addProjectLink: (projectId: string, payload: Record<string, unknown>) =>
    request(`/projects/${projectId}/links`, { method: "POST", body: JSON.stringify(payload) }),
  deleteProjectLink: (projectId: string, linkId: string) =>
    request(`/projects/${projectId}/links/${linkId}`, { method: "DELETE" }),
  projectFiles: (projectId: string) => request<{ rows: any[]; total: number }>(`/projects/${projectId}/files`),
  addProjectFile: (projectId: string, payload: Record<string, unknown>) =>
    request(`/projects/${projectId}/files`, { method: "POST", body: JSON.stringify(payload) }),
  deleteProjectFile: (projectId: string, fileId: string) =>
    request(`/projects/${projectId}/files/${fileId}`, { method: "DELETE" }),

  // Ownership, financial distribution, settlements, and SaaS
  ownershipOverview: (month?: string) =>
    request<any>(`/ownership/overview${month ? `?month=${encodeURIComponent(month)}` : ""}`),
  ownershipSettlement: (month: string) =>
    request<any>(`/ownership/monthly-settlement?month=${encodeURIComponent(month)}`),
  ownershipReceipts: () => request<TableResponse<any>>("/ownership/receipts"),
  createOwnershipReceipt: (payload: Record<string, unknown>) =>
    request<any>("/ownership/receipts", { method: "POST", body: JSON.stringify(payload) }),
  reverseOwnershipReceipt: (id: string, reason?: string) =>
    request<any>(`/ownership/receipts/${id}/reverse`, { method: "POST", body: JSON.stringify({ reason }) }),
  payOwnershipLine: (allocationId: string, lineId: string, payload: Record<string, unknown> = {}) =>
    request<any>(`/ownership/allocations/${allocationId}/lines/${lineId}/pay`, { method: "POST", body: JSON.stringify(payload) }),
  payOwnershipSettlement: (payload: Record<string, unknown>) =>
    request<any>("/ownership/settlements/pay", { method: "POST", body: JSON.stringify(payload) }),
  ownershipBeneficiaries: () => request<TableResponse<any>>("/ownership/beneficiaries"),
  ownershipStructure: () => request<TableResponse<any>>("/ownership/structure"),
  ownershipTemplates: () => request<TableResponse<any>>("/ownership/templates"),
  createOwnershipTemplate: (payload: Record<string, unknown>) =>
    request<any>("/ownership/templates", { method: "POST", body: JSON.stringify(payload) }),
  updateOwnershipTemplate: (id: string, payload: Record<string, unknown>) =>
    request<any>(`/ownership/templates/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  upsertProjectDistributionProfile: (projectId: string, payload: Record<string, unknown>) =>
    request<any>(`/ownership/projects/${projectId}/profile`, { method: "POST", body: JSON.stringify(payload) }),
  ownershipSaasProducts: () => request<TableResponse<any>>("/ownership/saas-products"),
  ownershipSaasSubscriptions: () => request<TableResponse<any>>("/ownership/saas-subscriptions"),

  // Accounts, permissions, and partner portal
  accessAccounts: () => request<{ rows: any[]; total: number }>("/access/accounts"),
  createAccessAccount: (payload: Record<string, unknown>) =>
    request<any>("/access/accounts", { method: "POST", body: JSON.stringify(payload) }),
  updateAccessAccount: (id: string, payload: Record<string, unknown>) =>
    request<any>(`/access/accounts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  resetAccessPassword: (id: string, password?: string) =>
    request<{ password: string }>(`/access/accounts/${id}/reset-password`, { method: "POST", body: JSON.stringify(password ? { password } : {}) }),
  createDefaultPartnerAccounts: () =>
    request<{ rows: Array<{ fullName: string; email: string; status: string; password: string | null }> }>("/access/accounts/create-default-partners", { method: "POST" }),
  partnerPortal: (month?: string) =>
    request<any>(`/access/portal${month ? `?month=${encodeURIComponent(month)}` : ""}`),
  updatePartnerProject: (projectId: string, payload: Record<string, unknown>) =>
    request<any>(`/access/portal/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(payload) }),

  // AI Chat
  aiChat: (message: string) =>
    request<{ tool: string; answerAr: string; answerEn: string; result: unknown }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message })
    }),
  aiDraftEmail: (payload: { clientName?: string; invoiceNumber?: string; amount?: string }) =>
    request<{ subjectAr: string; bodyAr: string; subjectEn: string; bodyEn: string }>("/ai/draft-email", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  aiConversations: () => request<{ rows: any[]; total: number }>("/ai/conversations"),
  aiFeedback: (conversationId: string, rating: number, note?: string) =>
    request("/ai/feedback", { method: "POST", body: JSON.stringify({ conversationId, rating, note }) })
};
