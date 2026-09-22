import bcrypt from "bcryptjs";
import type { AiSalesActivity, AiSalesCampaign, AiSalesMode, AiSalesProspect, DashboardPayload, UserSession } from "@prootech/shared-types";
import { expandPermissions } from "../core/permissions.js";
import { persistCreate, persistUpdate, persistDelete } from "../db/persist.js";

const organizationId = "org_prootech";
const now = new Date().toISOString();

type DemoUser = UserSession & { passwordHash: string };

export const demoPassword = "Prootech@2026";
const passwordHash = bcrypt.hashSync(demoPassword, 10);

const users: DemoUser[] = [
  {
    id: "usr_admin",
    organizationId,
    employeeId: "emp_001",
    fullName: "Prootech Admin",
    email: "admin@prootech.agency",
    passwordHash,
    roles: ["super_admin"],
    permissions: expandPermissions(["super_admin"]),
    locale: "ar",
    mfaEnabled: false
  },
  {
    id: "usr_ceo",
    organizationId,
    employeeId: "emp_002",
    fullName: "Sara Executive",
    email: "ceo@prootech.agency",
    passwordHash,
    roles: ["ceo"],
    permissions: expandPermissions(["ceo"]),
    locale: "ar",
    mfaEnabled: true
  }
];

const roles = [
  { id: "role_super_admin", organizationId, name: "Super Admin", code: "super_admin", permissions: expandPermissions(["super_admin"]), status: "active" },
  { id: "role_ceo", organizationId, name: "Founder / CEO", code: "ceo", permissions: expandPermissions(["ceo"]), status: "active" },
  { id: "role_finance_admin", organizationId, name: "Finance Admin", code: "finance_admin", permissions: expandPermissions(["finance_admin"]), status: "active" },
  { id: "role_hr_admin", organizationId, name: "HR Admin", code: "hr_admin", permissions: expandPermissions(["hr_admin"]), status: "active" }
];

const organizations = [
  {
    id: organizationId,
    name: "Prootech Agency",
    slug: "prootech",
    status: "active",
    defaultCurrency: "USD",
    supportedLanguages: ["ar", "en"],
    timezone: "Asia/Damascus",
    createdAt: now,
    updatedAt: now
  }
];

const legalEntities = [
  { id: "le_sy", organizationId, name: "Prootech Syria", countryCode: "SY", currencyCode: "USD", status: "active" },
  { id: "le_ae", organizationId, name: "Prootech UAE", countryCode: "AE", currencyCode: "AED", status: "active" }
];

const businessUnits = [
  { id: "bu_growth", organizationId, legalEntityId: "le_ae", name: "Growth", code: "GROWTH", managerUserId: "usr_ceo", status: "active" },
  { id: "bu_delivery", organizationId, legalEntityId: "le_sy", name: "Delivery", code: "DELIVERY", managerUserId: "usr_admin", status: "active" }
];

const settings = [
  { id: "set_locale", organizationId, key: "default_locale", value: "ar", category: "localization", status: "active", createdAt: now, updatedAt: now },
  { id: "set_currency", organizationId, key: "default_currency", value: "USD", category: "finance", status: "active", createdAt: now, updatedAt: now }
];

const departments = [
  { id: "dep_sales", organizationId, businessUnitId: "bu_growth", name: "Sales", code: "SALES", status: "active", createdAt: now, updatedAt: now },
  { id: "dep_delivery", organizationId, businessUnitId: "bu_delivery", name: "Delivery", code: "DELIVERY", status: "active", createdAt: now, updatedAt: now },
  { id: "dep_finance", organizationId, businessUnitId: "bu_growth", name: "Finance", code: "FINANCE", status: "active", createdAt: now, updatedAt: now }
];

const featureFlags = [
  { id: "flag_ai", organizationId, key: "ai_assistant", enabled: true, rollout: "internal", status: "active", createdAt: now, updatedAt: now },
  { id: "flag_dark", organizationId, key: "dark_mode_ready", enabled: false, rollout: "planned", status: "active", createdAt: now, updatedAt: now }
];

const leads = [
  {
    id: "lead_001",
    organizationId,
    businessUnitId: "bu_growth",
    source: "Website",
    fullName: "Omar Haddad",
    companyName: "Levant Retail Group",
    email: "omar@example.com",
    phone: "+963900000001",
    country: "SY",
    notes: "Interested in a full commerce growth retainer.",
    status: "qualified",
    assignedTo: "usr_admin",
    score: 86,
    tags: ["retainer", "priority"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "lead_002",
    organizationId,
    businessUnitId: "bu_growth",
    source: "Partner",
    fullName: "Maya Al-Khatib",
    companyName: "Pearl Clinics",
    email: "maya@example.com",
    phone: "+971500000002",
    country: "AE",
    notes: "Needs CRM automation and paid media.",
    status: "contacted",
    assignedTo: "usr_admin",
    score: 71,
    tags: ["healthcare"],
    createdAt: now,
    updatedAt: now
  }
];

const accounts = [
  { id: "acc_001", organizationId, businessUnitId: "bu_growth", name: "Levant Retail Group", industry: "Retail", country: "SY", website: "https://example.com", size: "120", ownerUserId: "usr_admin", tags: ["vip"], status: "active", createdAt: now, updatedAt: now },
  { id: "acc_002", organizationId, businessUnitId: "bu_growth", name: "Pearl Clinics", industry: "Healthcare", country: "AE", website: "https://example.org", size: "40", ownerUserId: "usr_admin", tags: ["growth"], status: "active", createdAt: now, updatedAt: now }
];

const contacts = [
  { id: "con_001", organizationId, accountId: "acc_001", fullName: "Omar Haddad", title: "Managing Partner", email: "omar@example.com", phone: "+963900000001", whatsapp: "+963900000001", isPrimary: true, createdAt: now, updatedAt: now },
  { id: "con_002", organizationId, accountId: "acc_002", fullName: "Maya Al-Khatib", title: "Operations Director", email: "maya@example.com", phone: "+971500000002", whatsapp: "+971500000002", isPrimary: true, createdAt: now, updatedAt: now }
];

const opportunities = [
  {
    id: "opp_001",
    organizationId,
    businessUnitId: "bu_growth",
    accountId: "acc_001",
    primaryContactId: "con_001",
    title: "Commerce Growth Retainer",
    stage: "proposal",
    estimatedAmount: 24000,
    currencyCode: "USD",
    probability: 0.68,
    expectedCloseDate: "2026-05-20",
    ownerUserId: "usr_admin",
    sourceLeadId: "lead_001",
    partnerAttribution: { partnerId: "par_001", ruleCode: "referral_standard" },
    status: "open",
    tags: ["hot"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "opp_002",
    organizationId,
    businessUnitId: "bu_growth",
    accountId: "acc_002",
    primaryContactId: "con_002",
    title: "Clinic Acquisition System",
    stage: "qualified",
    estimatedAmount: 18000,
    currencyCode: "USD",
    probability: 0.42,
    expectedCloseDate: "2026-06-08",
    ownerUserId: "usr_admin",
    status: "open",
    tags: ["automation"],
    createdAt: now,
    updatedAt: now
  }
];

const proposals = [
  { id: "prop_001", organizationId, opportunityId: "opp_001", version: 2, title: "Commerce Growth Retainer", summary: "Paid media, CRM, CRO, reporting.", lineItems: [], totalAmount: 24000, currencyCode: "USD", marginEstimate: 0.36, approvalStatus: "approved", fileId: "file_001", createdBy: "usr_admin", createdAt: now, updatedAt: now }
];

const contracts = [
  { id: "ctr_001", organizationId, opportunityId: "opp_001", accountId: "acc_001", contractType: "retainer", startDate: "2026-06-01", endDate: "2026-11-30", billingTerms: "monthly", paymentTerms: "net_10", renewalType: "manual", partnerRuleSnapshot: { ruleCode: "referral_standard", percentage: 10 }, status: "draft", fileId: "file_002", createdAt: now, updatedAt: now }
];

const activities = [
  { id: "act_001", organizationId, entityType: "opportunity", entityId: "opp_001", type: "meeting", title: "Proposal review", description: "Client requested a phased plan.", dueDate: "2026-04-24", ownerUserId: "usr_admin", status: "open", createdAt: now, updatedAt: now }
];

const projects = [
  {
    id: "prj_001",
    organizationId,
    businessUnitId: "bu_delivery",
    accountId: "acc_001",
    opportunityId: "opp_001",
    contractId: "ctr_001",
    name: "Levant Retail Growth OS",
    description: "منظومة نمو متكاملة لـ Levant Retail Group: إدارة CRM، أتمتة البريد الإلكتروني، تحسين معدل التحويل، لوحة تحليلات مخصصة، وإدارة الكمبيينات الإعلانية عبر Meta وGoogle. الهدف الرئيسي رفع معدل التحويل من 1.4% إلى 2.8% ورفع LTV بنسبة 35% خلال 6 أشهر.",
    type: "retainer",
    status: "active",
    projectManagerId: "usr_admin",
    techStack: ["React", "Node.js", "Shopify", "HubSpot", "Google Analytics 4", "Meta Ads API"],
    startDate: "2026-04-01",
    endDate: "2026-09-30",
    budgetAmount: 24000,
    currencyCode: "USD",
    billingModel: "retainer",
    healthStatus: "amber",
    driveUrl: "https://drive.google.com/drive/folders/demo-levant",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "prj_002",
    organizationId,
    businessUnitId: "bu_delivery",
    accountId: "acc_002",
    opportunityId: "opp_002",
    contractId: undefined,
    name: "Pearl Clinics Acquisition System",
    description: "نظام اكتساب مرضى متكامل لـ Pearl Clinics: صفحات هبوط محسّنة، نموذج حجز متكامل مع CRM، أتمتة المتابعة عبر WhatsApp والبريد، ولوحة تقارير أداء الكمبيينات.",
    type: "project",
    status: "active",
    projectManagerId: "usr_admin",
    techStack: ["Vue.js", "Supabase", "n8n", "WhatsApp Business API"],
    startDate: "2026-05-01",
    endDate: "2026-07-31",
    budgetAmount: 18000,
    currencyCode: "USD",
    billingModel: "fixed_milestone",
    healthStatus: "green",
    driveUrl: "https://drive.google.com/drive/folders/demo-pearl",
    createdAt: now,
    updatedAt: now
  }
];

const projectLinks = [
  { id: "pl_001", organizationId, projectId: "prj_001", label: "GitLab Repository", url: "https://gitlab.com/prootech/levant-retail", type: "gitlab", description: "الكودبيس الرئيسي للمشروع", isCredential: false, createdBy: "usr_admin", createdAt: now },
  { id: "pl_002", organizationId, projectId: "prj_001", label: "Analytics Dashboard", url: "https://analytics.prootech.agency/levant", type: "dashboard", description: "لوحة تحليلات Google Analytics + Looker Studio", isCredential: false, createdBy: "usr_admin", createdAt: now },
  { id: "pl_003", organizationId, projectId: "prj_001", label: "Design Files (Figma)", url: "https://figma.com/file/demo-levant", type: "figma", description: "جميع التصاميم والـ wireframes", isCredential: false, createdBy: "usr_admin", createdAt: now },
  { id: "pl_004", organizationId, projectId: "prj_001", label: "Google Drive", url: "https://drive.google.com/drive/folders/demo-levant", type: "drive", description: "ملفات المشروع، الريبورتات، التسجيلات", isCredential: false, createdBy: "usr_admin", createdAt: now },
  { id: "pl_005", organizationId, projectId: "prj_001", label: "Production Server", url: "https://levantretail.com", type: "server", description: "Production VPS", host: "157.245.12.34", username: "deploy", port: "22", platform: "DigitalOcean", accessNote: "SSH key محفوظة في 1Password > Prootech > Levant Retail", isCredential: true, createdBy: "usr_admin", createdAt: now },
  { id: "pl_006", organizationId, projectId: "prj_001", label: "Staging Server", url: "https://staging.levantretail.com", type: "staging", description: "بيئة الاختبار", host: "157.245.12.35", username: "deploy", port: "22", platform: "DigitalOcean", accessNote: "نفس SSH key كالـ production", isCredential: true, createdBy: "usr_admin", createdAt: now },
  { id: "pl_007", organizationId, projectId: "prj_002", label: "GitLab Repository", url: "https://gitlab.com/prootech/pearl-clinics", type: "gitlab", description: "كودبيس Pearl Clinics", isCredential: false, createdBy: "usr_admin", createdAt: now },
  { id: "pl_008", organizationId, projectId: "prj_002", label: "n8n Automation Dashboard", url: "https://n8n.prootech.agency", type: "dashboard", description: "لوحة إدارة الـ workflows والأتمتة", isCredential: false, createdBy: "usr_admin", createdAt: now },
  { id: "pl_009", organizationId, projectId: "prj_002", label: "Google Drive", url: "https://drive.google.com/drive/folders/demo-pearl", type: "drive", description: "ملفات التصاميم والتسليمات", isCredential: false, createdBy: "usr_admin", createdAt: now }
];

const projectFiles = [
  { id: "pf_001", organizationId, projectId: "prj_001", name: "Project Brief - Levant Retail.pdf", mimeType: "application/pdf", sizeBytes: 245000, category: "brief", uploadedBy: "usr_admin", note: "الموجز الأولي من العميل يتضمن الأهداف والتوقعات", downloadUrl: null, createdAt: now },
  { id: "pf_002", organizationId, projectId: "prj_001", name: "April 2026 Progress Report.pdf", mimeType: "application/pdf", sizeBytes: 189000, category: "report", uploadedBy: "usr_admin", note: "ريبورت نهاية أبريل: KPIs والتقدم على المعالم", downloadUrl: null, createdAt: now },
  { id: "pf_003", organizationId, projectId: "prj_001", name: "Email Automation Map.pdf", mimeType: "application/pdf", sizeBytes: 512000, category: "design", uploadedBy: "usr_admin", note: "خريطة رحلات البريد الإلكتروني الكاملة", downloadUrl: null, createdAt: now },
  { id: "pf_004", organizationId, projectId: "prj_002", name: "Pearl Clinics - Scope of Work.pdf", mimeType: "application/pdf", sizeBytes: 178000, category: "contract", uploadedBy: "usr_admin", note: "نطاق العمل والجدول الزمني المتفق عليه", downloadUrl: null, createdAt: now },
  { id: "pf_005", organizationId, projectId: "prj_002", name: "Landing Page Wireframes.pdf", mimeType: "application/pdf", sizeBytes: 890000, category: "design", uploadedBy: "usr_admin", note: "الـ wireframes الأولية لصفحة الهبوط", downloadUrl: null, createdAt: now }
];

const growthChannels = [
  { id: "gc_fb", organizationId, platform: "facebook", name: "Prootech Agency", url: "https://facebook.com/prootechagency", status: "active", color: "#1877F2", createdAt: now, updatedAt: now },
  { id: "gc_ig", organizationId, platform: "instagram", name: "@prootechagency", url: "https://instagram.com/prootechagency", status: "active", color: "#E1306C", createdAt: now, updatedAt: now },
  { id: "gc_li", organizationId, platform: "linkedin", name: "Prootech Agency", url: "https://linkedin.com/company/prootech", status: "active", color: "#0A66C2", createdAt: now, updatedAt: now },
  { id: "gc_web", organizationId, platform: "website", name: "prootech.agency", url: "https://prootech.agency", status: "active", color: "#6C47FF", createdAt: now, updatedAt: now }
];

const growthMetrics = [
  // Facebook - 6 months history
  { id: "gm_fb_jan", organizationId, channelId: "gc_fb", date: "2026-01-01", followers: 820, reach: 2100, impressions: 5400, engagementRate: 2.8, postsCount: 8, clicks: 95, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_fb_feb", organizationId, channelId: "gc_fb", date: "2026-02-01", followers: 910, reach: 2450, impressions: 6200, engagementRate: 3.1, postsCount: 9, clicks: 118, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_fb_mar", organizationId, channelId: "gc_fb", date: "2026-03-01", followers: 1020, reach: 2800, impressions: 7100, engagementRate: 3.4, postsCount: 10, clicks: 132, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_fb_apr", organizationId, channelId: "gc_fb", date: "2026-04-01", followers: 1105, reach: 3100, impressions: 8200, engagementRate: 3.2, postsCount: 11, clicks: 148, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_fb_may", organizationId, channelId: "gc_fb", date: "2026-05-01", followers: 1240, reach: 3600, impressions: 9400, engagementRate: 3.7, postsCount: 12, clicks: 165, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  // Instagram
  { id: "gm_ig_jan", organizationId, channelId: "gc_ig", date: "2026-01-01", followers: 540, reach: 1800, impressions: 4200, engagementRate: 5.2, postsCount: 10, clicks: 78, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_ig_feb", organizationId, channelId: "gc_ig", date: "2026-02-01", followers: 620, reach: 2100, impressions: 5000, engagementRate: 5.8, postsCount: 11, clicks: 95, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_ig_mar", organizationId, channelId: "gc_ig", date: "2026-03-01", followers: 740, reach: 2500, impressions: 6100, engagementRate: 6.1, postsCount: 12, clicks: 112, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_ig_apr", organizationId, channelId: "gc_ig", date: "2026-04-01", followers: 880, reach: 3000, impressions: 7300, engagementRate: 6.4, postsCount: 14, clicks: 134, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_ig_may", organizationId, channelId: "gc_ig", date: "2026-05-01", followers: 1050, reach: 3700, impressions: 8900, engagementRate: 6.9, postsCount: 15, clicks: 158, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  // LinkedIn
  { id: "gm_li_jan", organizationId, channelId: "gc_li", date: "2026-01-01", followers: 310, reach: 1200, impressions: 2800, engagementRate: 4.1, postsCount: 6, clicks: 62, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_li_feb", organizationId, channelId: "gc_li", date: "2026-02-01", followers: 360, reach: 1450, impressions: 3300, engagementRate: 4.5, postsCount: 7, clicks: 74, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_li_mar", organizationId, channelId: "gc_li", date: "2026-03-01", followers: 420, reach: 1700, impressions: 4100, engagementRate: 5.0, postsCount: 8, clicks: 88, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_li_apr", organizationId, channelId: "gc_li", date: "2026-04-01", followers: 490, reach: 2000, impressions: 4900, engagementRate: 5.3, postsCount: 8, clicks: 101, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  { id: "gm_li_may", organizationId, channelId: "gc_li", date: "2026-05-01", followers: 570, reach: 2400, impressions: 5800, engagementRate: 5.8, postsCount: 9, clicks: 119, sessions: null, pageviews: null, uniqueUsers: null, bounceRate: null, createdAt: now },
  // Website
  { id: "gm_web_jan", organizationId, channelId: "gc_web", date: "2026-01-01", followers: null, reach: null, impressions: null, engagementRate: null, postsCount: null, clicks: 1820, sessions: 1820, pageviews: 3400, uniqueUsers: 1420, bounceRate: 58.2, createdAt: now },
  { id: "gm_web_feb", organizationId, channelId: "gc_web", date: "2026-02-01", followers: null, reach: null, impressions: null, engagementRate: null, postsCount: null, clicks: 2100, sessions: 2100, pageviews: 4100, uniqueUsers: 1680, bounceRate: 55.1, createdAt: now },
  { id: "gm_web_mar", organizationId, channelId: "gc_web", date: "2026-03-01", followers: null, reach: null, impressions: null, engagementRate: null, postsCount: null, clicks: 2450, sessions: 2450, pageviews: 4900, uniqueUsers: 1960, bounceRate: 52.4, createdAt: now },
  { id: "gm_web_apr", organizationId, channelId: "gc_web", date: "2026-04-01", followers: null, reach: null, impressions: null, engagementRate: null, postsCount: null, clicks: 2780, sessions: 2780, pageviews: 5600, uniqueUsers: 2220, bounceRate: 50.8, createdAt: now },
  { id: "gm_web_may", organizationId, channelId: "gc_web", date: "2026-05-01", followers: null, reach: null, impressions: null, engagementRate: null, postsCount: null, clicks: 3120, sessions: 3120, pageviews: 6400, uniqueUsers: 2580, bounceRate: 48.3, createdAt: now }
];

const milestones = [
  { id: "mil_001", organizationId, projectId: "prj_001", title: "CRM funnel launch", dueDate: "2026-04-30", amountLinked: 5000, status: "in_progress", progressPercent: 65, createdAt: now, updatedAt: now }
];

const deliverables = [
  { id: "del_001", organizationId, projectId: "prj_001", milestoneId: "mil_001", title: "Lifecycle email map", description: "Retention and cart recovery flows.", assignedTo: ["emp_001"], dueDate: "2026-04-25", status: "review", priority: "high", createdAt: now, updatedAt: now }
];

const timesheets = [
  { id: "time_001", organizationId, projectId: "prj_001", employeeId: "emp_001", date: "2026-04-21", hours: 6.5, taskLabel: "CRM automation", billable: true, notes: "Built core flows.", approvalStatus: "approved" }
];

const invoices = [
  { id: "inv_001", organizationId, legalEntityId: "le_ae", accountId: "acc_001", projectId: "prj_001", contractId: "ctr_001", invoiceNumber: "INV-2026-00421", invoiceType: "retainer", issueDate: "2026-04-01", dueDate: "2026-04-10", currencyCode: "USD", subtotal: 5000, taxAmount: 0, totalAmount: 5000, amountPaid: 2500, balanceDue: 2500, status: "partially_paid", paymentLink: "https://pay.example/inv_001", externalRefs: {}, createdBy: "usr_admin", createdAt: now, updatedAt: now },
  { id: "inv_002", organizationId, legalEntityId: "le_ae", accountId: "acc_002", projectId: undefined, contractId: undefined, invoiceNumber: "INV-2026-00422", invoiceType: "project", issueDate: "2026-03-28", dueDate: "2026-04-07", currencyCode: "USD", subtotal: 7200, taxAmount: 0, totalAmount: 7200, amountPaid: 0, balanceDue: 7200, status: "overdue", paymentLink: "https://pay.example/inv_002", externalRefs: {}, createdBy: "usr_admin", createdAt: now, updatedAt: now }
];

const invoiceLines = [
  { id: "line_001", organizationId, invoiceId: "inv_001", description: "Monthly retainer - April 2026", quantity: 1, unitPrice: 5000, taxCode: "VAT_0", lineTotal: 5000 }
];

const payments = [
  { id: "pay_001", organizationId, invoiceId: "inv_001", accountId: "acc_001", amount: 2500, currencyCode: "USD", paymentMethod: "bank_transfer", paymentDate: "2026-04-09", status: "matched", externalRef: "BNK-99321", sourceSystem: "manual", idempotencyKey: "pay-inv001-001", createdAt: now, updatedAt: now }
];

const expenses = [
  { id: "exp_001", organizationId, legalEntityId: "le_ae", category: "Media tools", vendorName: "Ad Platform", amount: 1200, currencyCode: "USD", expenseDate: "2026-04-15", linkedProjectId: "prj_001", submittedBy: "usr_admin", approvalStatus: "approved", attachmentFileIds: [], createdAt: now, updatedAt: now }
];

const revenueSnapshots = [
  { id: "rev_2026_04", organizationId, month: "2026-04", revenueBooked: 82400, revenueCollected: 61900, grossMargin: 0.34, payrollCost: 23200, partnerPayouts: 6100, expenses: 14300, netOperationalProfit: 18300, createdAt: now }
];

const employees = [
  { id: "emp_001", organizationId, legalEntityId: "le_sy", businessUnitId: "bu_delivery", employeeCode: "E001", fullName: "Lina Mansour", email: "lina@prootech.agency", phone: "+963900111111", title: "Delivery Lead", department: "Delivery", managerId: "emp_002", joinDate: "2024-09-01", employmentType: "full_time", workMode: "hybrid", status: "active", nationalIdMasked: "***2841", bankInfoEncrypted: "encrypted:demo", baseSalary: 1800, currencyCode: "USD", createdAt: now, updatedAt: now },
  { id: "emp_002", organizationId, legalEntityId: "le_ae", businessUnitId: "bu_growth", employeeCode: "E002", fullName: "Yazan Saleh", email: "yazan@prootech.agency", phone: "+971500111111", title: "Growth Manager", department: "Sales", managerId: undefined, joinDate: "2023-05-10", employmentType: "full_time", workMode: "remote", status: "active", nationalIdMasked: "***7712", bankInfoEncrypted: "encrypted:demo", baseSalary: 4200, currencyCode: "USD", createdAt: now, updatedAt: now }
];

const employmentContracts = [
  { id: "empc_001", organizationId, employeeId: "emp_001", contractType: "full_time", startDate: "2024-09-01", endDate: "2026-09-01", salary: 1800, currencyCode: "USD", bonusPolicy: "performance", commissionPolicy: "none", status: "active", fileId: "file_003", createdAt: now, updatedAt: now }
];

const leaveRequests = [
  { id: "leave_001", organizationId, employeeId: "emp_001", leaveType: "annual", startDate: "2026-05-05", endDate: "2026-05-07", daysCount: 3, reason: "Family", status: "pending", approvedBy: undefined, createdAt: now, updatedAt: now }
];

const payrollRuns = [
  { id: "payroll_2026_04", organizationId, legalEntityId: "le_ae", periodStart: "2026-04-01", periodEnd: "2026-04-30", currencyCode: "USD", status: "calculated", employeesCount: 2, totalGross: 6000, totalDeductions: 220, totalNet: 5780, createdAt: now, updatedAt: now }
];

const payrollItems = [
  { id: "payi_001", organizationId, payrollRunId: "payroll_2026_04", employeeId: "emp_001", baseSalary: 1800, bonuses: 300, commissions: 0, deductions: 100, netPay: 2000, varianceFlag: "none", createdAt: now, updatedAt: now },
  { id: "payi_002", organizationId, payrollRunId: "payroll_2026_04", employeeId: "emp_002", baseSalary: 4200, bonuses: 0, commissions: 0, deductions: 120, netPay: 4080, varianceFlag: "review", createdAt: now, updatedAt: now }
];

const payslips = [
  { id: "payslip_001", organizationId, payrollRunId: "payroll_2026_04", employeeId: "emp_001", fileId: "file_004", issuedAt: "2026-04-30T10:00:00.000Z", status: "issued", createdAt: now, updatedAt: now }
];

const partners = [
  { id: "par_001", organizationId, fullName: "Nour Partner", companyName: "Nour Consulting", email: "nour@example.com", phone: "+971500222222", partnerType: "referral", status: "active", createdAt: now, updatedAt: now }
];

const partnerAgreements = [
  { id: "pa_001", organizationId, partnerId: "par_001", agreementType: "referral", startDate: "2026-01-01", endDate: undefined, settlementBasis: "collected_cash", status: "active", createdAt: now, updatedAt: now }
];

const partnerShareRules = [
  { id: "psr_001", organizationId, partnerAgreementId: "pa_001", ruleCode: "referral_standard", ruleVersion: 3, percentage: 10, fixedFee: 0, minThreshold: 0, maxCap: 5000, eligibilityConditions: { afterPaymentCollected: true }, clawbackPolicy: "reverse_if_refunded_30d", status: "active", createdAt: now, updatedAt: now }
];

const partnerSettlements = [
  { id: "settle_001", organizationId, partnerId: "par_001", fromDate: "2026-04-01", toDate: "2026-04-30", grossBasis: 2500, eligibleAmount: 2500, shareAmount: 250, currencyCode: "USD", status: "preview", lines: [{ invoiceId: "inv_001", paymentId: "pay_001", ruleVersion: "referral_standard:v3", amount: 250 }], createdAt: now, updatedAt: now }
];

const notifications = [
  { id: "not_001", organizationId, userId: "usr_admin", title: "Invoice overdue", body: "INV-2026-00422 is overdue by 15 days.", channel: "in_app", status: "unread", createdAt: now },
  { id: "not_002", organizationId, userId: "usr_admin", title: "Payroll variance", body: "One payroll item needs review before approval.", channel: "in_app", status: "unread", createdAt: now }
];

const files = [
  { id: "file_001", organizationId, name: "Proposal-v2.pdf", mimeType: "application/pdf", size: 420000, storageKey: "proposals/prop_001.pdf", classification: "confidential", createdBy: "usr_admin", createdAt: now }
];

const auditLogs: Array<Record<string, unknown>> = [
  { id: "aud_seed_001", organizationId, actorUserId: "system", action: "seed:initialize", resourceType: "system", resourceId: organizationId, before: null, after: { organizationId }, interactionId: "seed", ip: "local", userAgent: "seed", outcome: "success", createdAt: now }
];

const aiConversations: Array<Record<string, unknown>> = [
  { id: "ai_001", organizationId, userId: "usr_admin", title: "Executive margin explanation", createdAt: now, updatedAt: now }
];

const aiMessages: Array<Record<string, unknown>> = [
  { id: "aimsg_001", organizationId, conversationId: "ai_001", role: "assistant", content: "Margin dropped due to higher tools and acquisition costs.", toolCalls: ["getExecutiveMetrics"], createdAt: now }
];

const aiToolCalls: Array<Record<string, unknown>> = [
  { id: "aitool_001", organizationId, conversationId: "ai_001", toolName: "getExecutiveMetrics", input: { period: "2026-04" }, outputSummary: "Gross margin 34%, down 3.2%.", status: "success", createdAt: now }
];

const aiFeedback: Array<Record<string, unknown>> = [
  { id: "aifb_001", organizationId, conversationId: "ai_001", userId: "usr_admin", rating: 5, note: "Useful executive summary.", createdAt: now }
];

const aiSalesCampaigns: AiSalesCampaign[] = [
  {
    id: "aisc_001",
    name: "UAE Clinics Conversion Sprint",
    sector: "Healthcare",
    region: "UAE",
    objective: "Book intro calls for clinics with weak booking and follow-up flows.",
    mode: "copilot",
    status: "active",
    targetTitle: "Operations Director",
    language: "en",
    createdAt: now,
    approvedCount: 2,
    sentCount: 1,
    qualifiedCount: 1
  },
  {
    id: "aisc_002",
    name: "KSA Ecommerce Recovery Demo",
    sector: "Ecommerce",
    region: "Saudi Arabia",
    objective: "Test semi-autonomous outreach for brands with weak lifecycle automation.",
    mode: "semi_autonomous",
    status: "active",
    targetTitle: "Growth Manager",
    language: "en",
    createdAt: now,
    approvedCount: 1,
    sentCount: 1,
    qualifiedCount: 0
  }
];

const aiSalesProspects: AiSalesProspect[] = [
  {
    id: "aisp_001",
    campaignId: "aisc_001",
    companyName: "Pearl Clinics",
    website: "https://pearlclinics.example",
    country: "AE",
    industry: "Healthcare",
    sizeBand: "SMB",
    contactName: "Maya Al-Khatib",
    contactTitle: "Operations Director",
    email: "maya@pearlclinics.example",
    fitScore: 89,
    observation: "Booking flow appears long and does not surface immediate reassurance or follow-up capture.",
    likelyImpact: "Higher paid lead drop-off and lower appointment conversion.",
    suggestedAngle: "Booking conversion audit + automated follow-up + visibility dashboard.",
    draftSubject: "A quick idea to lift clinic booking conversion",
    draftBody:
      "Hi Maya, I noticed your clinic experience is polished, but the booking journey likely creates avoidable drop-off before patients complete their request. Prootech helps service businesses improve capture, follow-up, and conversion visibility. I can share a short teardown with practical fixes if useful.",
    status: "approved",
    nextAction: "Send first outreach today",
    deliverySignal: "queued",
    createdAt: now
  },
  {
    id: "aisp_002",
    campaignId: "aisc_001",
    companyName: "Nova Dental Center",
    website: "https://novadental.example",
    country: "AE",
    industry: "Healthcare",
    sizeBand: "SMB",
    contactName: "Lina Faris",
    contactTitle: "Clinic Manager",
    email: "lina@novadental.example",
    fitScore: 83,
    observation: "The site positions services well but does not create a clear lead capture and nurture path.",
    likelyImpact: "Leads from ads and referrals may cool down before staff follow-up.",
    suggestedAngle: "Lead capture redesign + CRM follow-up automation.",
    draftSubject: "A practical way to reduce lost patient enquiries",
    draftBody:
      "Hi Lina, one pattern we often see with clinics is good traffic but weak follow-up between enquiry and booking. Your digital front door is solid, but there may be room to tighten capture and response speed. We can outline a short improvement map if that would help.",
    status: "approval_required",
    nextAction: "Manager approval required",
    deliverySignal: "none",
    createdAt: now
  },
  {
    id: "aisp_003",
    campaignId: "aisc_002",
    companyName: "Cartiva Store",
    website: "https://cartiva.example",
    country: "SA",
    industry: "Ecommerce",
    sizeBand: "Mid-market",
    contactName: "Omar Rahal",
    contactTitle: "Growth Manager",
    email: "omar@cartiva.example",
    fitScore: 87,
    observation: "Lifecycle recovery opportunities are visible around abandoned cart and repeat purchase prompts.",
    likelyImpact: "Retention revenue is likely under-realized relative to acquisition spend.",
    suggestedAngle: "Retention stack + recovery journeys + revenue reporting.",
    draftSubject: "A retention angle worth testing for Cartiva",
    draftBody:
      "Hi Omar, Cartiva already has a strong storefront, but there looks to be a meaningful retention and cart-recovery opportunity that could unlock more revenue from existing traffic. Prootech works on lifecycle flows, reporting, and conversion improvements. Happy to share a short hypothesis deck.",
    status: "opened",
    nextAction: "Schedule follow-up 2 with mini case study",
    deliverySignal: "opened",
    createdAt: now
  }
];

const aiSalesActivities: AiSalesActivity[] = [
  {
    id: "aisa_001",
    campaignId: "aisc_001",
    prospectId: "aisp_001",
    type: "research",
    title: "Clinic prospect researched",
    detail: "Booking-flow weakness and follow-up gap were mapped into a healthcare outreach angle.",
    createdAt: now
  },
  {
    id: "aisa_002",
    campaignId: "aisc_001",
    prospectId: "aisp_002",
    type: "approval",
    title: "Draft queued for manager approval",
    detail: "Prospect is high-fit but needs human review before first send.",
    createdAt: now
  },
  {
    id: "aisa_003",
    campaignId: "aisc_002",
    prospectId: "aisp_003",
    type: "open",
    title: "Prospect opened outreach",
    detail: "Semi-autonomous sequence logged one open and is waiting for the next touch.",
    createdAt: now
  }
];

export const db = {
  organizations,
  legalEntities,
  businessUnits,
  settings,
  departments,
  featureFlags,
  users,
  roles,
  leads,
  accounts,
  contacts,
  opportunities,
  activities,
  proposals,
  contracts,
  projects,
  projectLinks,
  projectFiles,
  milestones,
  deliverables,
  timesheets,
  invoices,
  invoiceLines,
  payments,
  expenses,
  revenueSnapshots,
  employees,
  employmentContracts,
  leaveRequests,
  payrollRuns,
  payrollItems,
  payslips,
  partners,
  partnerAgreements,
  partnerShareRules,
  partnerSettlements,
  notifications,
  files,
  auditLogs,
  aiConversations,
  aiMessages,
  aiToolCalls,
  aiFeedback,
  aiSalesCampaigns,
  aiSalesProspects,
  aiSalesActivities,
  growthChannels,
  growthMetrics
};

export function findUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string) {
  const user = users.find((item) => item.id === id);
  if (!user) return undefined;
  const { passwordHash: _passwordHash, ...session } = user;
  return session;
}

export function verifyUserPassword(user: DemoUser, password: string) {
  return bcrypt.compareSync(password, user.passwordHash);
}

export function addAuditLog(event: Omit<Record<string, unknown>, "id" | "organizationId" | "createdAt">) {
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    organizationId,
    createdAt: new Date().toISOString(),
    ...event
  });
}

export function listCollection(name: keyof typeof db) {
  return db[name] as Array<Record<string, unknown>>;
}

export function createRecord(name: keyof typeof db, payload: Record<string, unknown>, actorId?: string) {
  const row = {
    id: `${String(name).slice(0, 4)}_${Date.now()}`,
    organizationId,
    status: payload.status ?? "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: actorId,
    ...payload
  };
  (db[name] as Array<Record<string, unknown>>).unshift(row);
  persistCreate(String(name), row);
  return row;
}

export function updateRecord(name: keyof typeof db, id: string, payload: Record<string, unknown>) {
  const collection = db[name] as Array<Record<string, unknown>>;
  const index = collection.findIndex((row) => row.id === id);
  if (index < 0) return undefined;
  collection[index] = { ...collection[index], ...payload, updatedAt: new Date().toISOString() };
  persistUpdate(String(name), id, collection[index] as Record<string, unknown>);
  return collection[index];
}

export function deleteRecord(name: keyof typeof db, id: string) {
  const collection = db[name] as Array<Record<string, unknown>>;
  const index = collection.findIndex((row) => row.id === id);
  if (index < 0) return false;
  collection.splice(index, 1);
  persistDelete(String(name), id);
  return true;
}

export function addAiSalesActivity(activity: Omit<AiSalesActivity, "id" | "createdAt">) {
  const row: AiSalesActivity = {
    id: `aisa_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...activity
  };
  aiSalesActivities.unshift(row);
  return row;
}

const prospectTemplates = [
  {
    sector: "Healthcare",
    region: "UAE",
    companyName: "Pulse Medical Center",
    website: "https://pulsemedical.example",
    country: "AE",
    contactName: "Rana Kassem",
    contactTitle: "Operations Director",
    email: "rana@pulsemedical.example",
    observation: "Traffic capture appears service-led, but the booking path lacks a fast reassurance and follow-up layer.",
    likelyImpact: "Paid campaigns may be funding more enquiries than the team actually converts into booked visits.",
    suggestedAngle: "Patient booking flow + lead follow-up + reporting cleanup."
  },
  {
    sector: "Healthcare",
    region: "UAE",
    companyName: "Zenith Skin Clinic",
    website: "https://zenithskin.example",
    country: "AE",
    contactName: "Hiba Nassar",
    contactTitle: "Clinic Director",
    email: "hiba@zenithskin.example",
    observation: "Premium positioning is strong, but conversion cues and lead nurture seem light.",
    likelyImpact: "High-intent visitors may leave without enough reasons or workflow to complete contact.",
    suggestedAngle: "Conversion uplift for premium service pages and enquiry recovery."
  },
  {
    sector: "Ecommerce",
    region: "Saudi Arabia",
    companyName: "Nawa Fashion",
    website: "https://nawafashion.example",
    country: "SA",
    contactName: "Faisal Al-Harthi",
    contactTitle: "Growth Lead",
    email: "faisal@nawafashion.example",
    observation: "Storefront is polished, but retention mechanics and recovery prompts seem underdeveloped.",
    likelyImpact: "Repeat purchase and cart recovery revenue may be below potential.",
    suggestedAngle: "Lifecycle automation + retention analytics + offer sequencing."
  },
  {
    sector: "Real Estate",
    region: "Qatar",
    companyName: "Urban Gate Properties",
    website: "https://urbangate.example",
    country: "QA",
    contactName: "Salem Mansour",
    contactTitle: "Marketing Manager",
    email: "salem@urbangate.example",
    observation: "Listings are visible but lead routing appears generic and not campaign-aware.",
    likelyImpact: "Lead quality may be harder to score and follow up quickly.",
    suggestedAngle: "Lead routing + CRM qualification + campaign attribution visibility."
  }
];

export function generateAiSalesProspects(campaignId: string, actorId?: string) {
  const campaign = aiSalesCampaigns.find((item) => item.id === campaignId);
  if (!campaign) return [];
  const matches = prospectTemplates
    .filter((template) => template.sector === campaign.sector && template.region === campaign.region)
    .slice(0, 2);

  const created = matches.map((template, index) => {
    const fitScore = 80 + index * 5;
    const row: AiSalesProspect = {
      id: `aisp_${Date.now()}_${index}`,
      campaignId,
      companyName: template.companyName,
      website: template.website,
      country: template.country,
      industry: template.sector,
      sizeBand: index === 0 ? "SMB" : "Mid-market",
      contactName: template.contactName,
      contactTitle: campaign.targetTitle || template.contactTitle,
      email: template.email,
      fitScore,
      observation: template.observation,
      likelyImpact: template.likelyImpact,
      suggestedAngle: template.suggestedAngle,
      draftSubject:
        campaign.language === "ar"
          ? `فكرة سريعة لتحسين النمو في ${template.companyName}`
          : `A practical growth idea for ${template.companyName}`,
      draftBody:
        campaign.language === "ar"
          ? `مرحباً ${template.contactName}، راجعنا حضور ${template.companyName} الرقمي ولاحظنا فرصة واضحة في ${template.suggestedAngle}. نعمل في Prootech على تحسين التحويل والمتابعة والوضوح التنفيذي، ويمكننا مشاركة تصور قصير ومباشر إن كان ذلك مناسباً.`
          : `Hi ${template.contactName}, we reviewed ${template.companyName} and noticed a clear opportunity around ${template.suggestedAngle}. Prootech helps teams improve conversion, follow-up, and executive visibility. Happy to share a short practical teardown if useful.`,
      status: campaign.mode === "semi_autonomous" ? "scheduled" : "approval_required",
      nextAction: campaign.mode === "semi_autonomous" ? "Sequence scheduled in demo mode" : "Manager approval required",
      deliverySignal: campaign.mode === "semi_autonomous" ? "queued" : "none",
      createdAt: new Date().toISOString()
    };
    aiSalesProspects.unshift(row);
    addAiSalesActivity({
      campaignId,
      prospectId: row.id,
      type: campaign.mode === "semi_autonomous" ? "send" : "draft",
      title: campaign.mode === "semi_autonomous" ? "Semi-autonomous step prepared" : "New AI sales draft prepared",
      detail: `${template.companyName} researched and matched with angle: ${template.suggestedAngle}`
    });
    return row;
  });

  addAuditLog({
    actorUserId: actorId ?? "system",
    action: "ai-sales.generate-prospects",
    resourceType: "ai_sales_campaign",
    resourceId: campaignId,
    before: null,
    after: { createdCount: created.length, mode: campaign.mode },
    interactionId: "ai-sales",
    ip: "local",
    userAgent: "system",
    outcome: "success",
    durationMs: 0
  });

  return created;
}

export function syncAiSalesProspectToCrm(prospectId: string, actorId?: string) {
  const prospect = aiSalesProspects.find((item) => item.id === prospectId);
  if (!prospect) return undefined;

  const account = createRecord(
    "accounts",
    {
      businessUnitId: "bu_growth",
      name: prospect.companyName,
      industry: prospect.industry,
      country: prospect.country,
      website: prospect.website,
      ownerUserId: actorId ?? "usr_admin",
      tags: ["ai_sales"],
      status: "active"
    },
    actorId
  );

  const contact = createRecord(
    "contacts",
    {
      accountId: account.id,
      fullName: prospect.contactName,
      title: prospect.contactTitle,
      email: prospect.email,
      phone: "",
      whatsapp: "",
      isPrimary: true,
      status: "active"
    },
    actorId
  );

  const lead = createRecord(
    "leads",
    {
      businessUnitId: "bu_growth",
      source: "AI Sales Agent",
      fullName: prospect.contactName,
      companyName: prospect.companyName,
      email: prospect.email,
      phone: "",
      country: prospect.country,
      tags: ["ai_sales", prospect.industry.toLowerCase()],
      notes: `${prospect.observation}\nImpact: ${prospect.likelyImpact}\nAngle: ${prospect.suggestedAngle}`,
      score: prospect.fitScore,
      assignedTo: actorId ?? "usr_admin",
      status: "qualified"
    },
    actorId
  );

  createRecord(
    "activities",
    {
      entityType: "lead",
      entityId: lead.id,
      type: "note",
      title: "AI sales research synced",
      description: `Prospect imported from AI Sales. Suggested angle: ${prospect.suggestedAngle}`,
      ownerUserId: actorId ?? "usr_admin",
      status: "open"
    },
    actorId
  );

  const updated = updateRecord("aiSalesProspects", prospectId, {
    status: "qualified",
    nextAction: "Sales owner should open manual qualification",
    deliverySignal: prospect.deliverySignal === "none" ? "queued" : prospect.deliverySignal,
    syncedLeadId: lead.id
  });

  addAiSalesActivity({
    campaignId: prospect.campaignId,
    prospectId,
    type: "crm_push",
    title: "Prospect pushed to CRM",
    detail: `${prospect.companyName} became a qualified lead with linked account and contact.`
  });

  return { account, contact, lead, prospect: updated };
}

export const executiveDashboard: DashboardPayload = {
  kpis: [
    { id: "revenue_mtd", labelAr: "الإيراد الشهري", labelEn: "Revenue MTD", value: "$82.4k", delta: "+12.8%", tone: "good" },
    { id: "collected_mtd", labelAr: "التحصيل الشهري", labelEn: "Collected MTD", value: "$61.9k", delta: "+8.1%", tone: "good" },
    { id: "gross_margin", labelAr: "هامش الربح", labelEn: "Gross Margin", value: "34%", delta: "-3.2%", tone: "watch" },
    { id: "pipeline_value", labelAr: "قيمة الفرص", labelEn: "Pipeline Value", value: "$214k", delta: "+19%", tone: "good" },
    { id: "utilization", labelAr: "استغلال الفريق", labelEn: "Utilization", value: "76%", delta: "+4%", tone: "neutral" },
    { id: "payroll_ratio", labelAr: "الرواتب / الإيراد", labelEn: "Payroll Ratio", value: "28%", delta: "-1.4%", tone: "good" }
  ],
  pipeline: [
    { stage: "new", count: 14, value: 38000 },
    { stage: "qualified", count: 9, value: 61000 },
    { stage: "proposal", count: 6, value: 72000 },
    { stage: "negotiation", count: 3, value: 43000 },
    { stage: "won", count: 2, value: 27000 }
  ],
  revenue: [
    { month: "Jan", booked: 59000, collected: 48000 },
    { month: "Feb", booked: 67000, collected: 51000 },
    { month: "Mar", booked: 74000, collected: 57000 },
    { month: "Apr", booked: 82400, collected: 61900 }
  ],
  arAging: [
    { bucket: "Current", amount: 12400 },
    { bucket: "1-15", amount: 7600 },
    { bucket: "16-30", amount: 4200 },
    { bucket: "30+", amount: 9500 }
  ],
  risks: [
    { id: "risk_ar", titleAr: "فاتورتان متأخرتان أكثر من 15 يوم", titleEn: "Two invoices overdue more than 15 days", severity: "high" },
    { id: "risk_payroll", titleAr: "بند رواتب يحتاج مراجعة قبل الاعتماد", titleEn: "One payroll item needs review before approval", severity: "medium" },
    { id: "risk_partner", titleAr: "تسوية شريك بانتظار اعتماد المالية", titleEn: "Partner settlement waiting for finance approval", severity: "medium" }
  ],
  aiInsights: [
    { id: "ai_margin", textAr: "الهامش انخفض بسبب ارتفاع مصاريف الأدوات وحملة اكتساب عميل جديدة.", textEn: "Margin dropped due to higher tool expenses and a new acquisition campaign." },
    { id: "ai_collection", textAr: "أولوية التحصيل اليوم: Pearl Clinics ثم Levant Retail.", textEn: "Collection priority today: Pearl Clinics then Levant Retail." }
  ]
};
