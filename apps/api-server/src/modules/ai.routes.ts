import { Router } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok } from "../core/http.js";
import { db, executiveDashboard, createRecord } from "../data/demo-store.js";
import { env } from "../config/env.js";

const chatSchema = z.object({
  message: z.string().min(1),
  context: z.string().optional(),
  conversationId: z.string().optional()
});

// Tool handlers — AI calls these with structured input
const toolHandlers: Record<string, (input: Record<string, unknown>, permissions: string[]) => unknown> = {
  getExecutiveMetrics: (_input, perms) => {
    if (!perms.includes("analytics:read")) return { error: "Permission denied" };
    return { kpis: executiveDashboard.kpis, revenue: executiveDashboard.revenue };
  },
  getInvoiceAging: (_input, perms) => {
    if (!perms.includes("finance:read")) return { error: "Permission denied" };
    return { arAging: executiveDashboard.arAging, invoices: db.invoices.slice(0, 10) };
  },
  getProjectHealth: (_input, perms) => {
    if (!perms.includes("projects:read")) return { error: "Permission denied" };
    return { projects: db.projects, milestones: db.milestones };
  },
  getLeadPipeline: (_input, perms) => {
    if (!perms.includes("crm:read")) return { error: "Permission denied" };
    return { pipeline: executiveDashboard.pipeline, opportunities: db.opportunities, leads: db.leads.slice(0, 10) };
  },
  getHrSummary: (_input, perms) => {
    if (!perms.includes("hr:read")) return { error: "Permission denied" };
    return {
      headcount: db.employees.length,
      pendingLeave: db.leaveRequests.filter((l) => l.status === "pending").length,
      payrollRuns: db.payrollRuns.slice(0, 3)
    };
  },
  getPartnerSummary: (_input, perms) => {
    if (!perms.includes("partners:read")) return { error: "Permission denied" };
    return { partners: db.partners, pendingSettlements: db.partnerSettlements.filter((s) => s.status === "preview") };
  },
  getRisks: (_input, _perms) => {
    return { risks: executiveDashboard.risks, aiInsights: executiveDashboard.aiInsights };
  }
};

const tools = [
  {
    name: "getExecutiveMetrics",
    description: "Get executive KPIs: revenue MTD, collected MTD, gross margin, pipeline value, utilization, payroll ratio, and monthly revenue trend.",
    input_schema: { type: "object" as const, properties: { period: { type: "string", description: "Optional period filter e.g. 2026-04" } }, required: [] }
  },
  {
    name: "getInvoiceAging",
    description: "Get accounts receivable aging by bucket (Current, 1-15, 16-30, 30+) and overdue invoice details.",
    input_schema: { type: "object" as const, properties: {}, required: [] }
  },
  {
    name: "getProjectHealth",
    description: "Get project health statuses, milestones, and delivery progress.",
    input_schema: { type: "object" as const, properties: {}, required: [] }
  },
  {
    name: "getLeadPipeline",
    description: "Get CRM pipeline by stage, open opportunities, and recent leads.",
    input_schema: { type: "object" as const, properties: {}, required: [] }
  },
  {
    name: "getHrSummary",
    description: "Get HR summary: headcount, pending leave requests, and recent payroll runs.",
    input_schema: { type: "object" as const, properties: {}, required: [] }
  },
  {
    name: "getPartnerSummary",
    description: "Get partner summary: active partners and pending settlements awaiting approval.",
    input_schema: { type: "object" as const, properties: {}, required: [] }
  },
  {
    name: "getRisks",
    description: "Get current business risks and AI-generated insights flagged by the system.",
    input_schema: { type: "object" as const, properties: {}, required: [] }
  }
];

// Fallback keyword-based handler when AI is disabled
function runFallbackTool(message: string, permissions: string[]) {
  const normalized = message.toLowerCase();
  if ((normalized.includes("collection") || normalized.includes("تحصيل") || normalized.includes("متأخر")) && permissions.includes("finance:read")) {
    return {
      tool: "getInvoiceAging",
      result: executiveDashboard.arAging,
      answerAr: "أكبر ضغط تحصيل حالياً ضمن شريحة 30+ يوم بقيمة 9.5k، ثم 1-15 يوم بقيمة 7.6k. ابدأ بـ Pearl Clinics ثم فعّل تذكير متابعة خلال 48 ساعة.",
      answerEn: "The highest collection pressure is in the 30+ day bucket at $9.5k, then 1-15 days at $7.6k. Start with Pearl Clinics and schedule a 48-hour follow-up."
    };
  }
  if ((normalized.includes("margin") || normalized.includes("هامش") || normalized.includes("مارجن")) && permissions.includes("analytics:read")) {
    return {
      tool: "getExecutiveMetrics",
      result: executiveDashboard.kpis,
      answerAr: "الهامش عند 34% ومنخفض 3.2%. السبب: مصاريف أدوات أعلى وحملة اكتساب جديدة قبل اكتمال التحصيل.",
      answerEn: "Gross margin is 34%, down 3.2%. Root cause: higher tool expenses and a new acquisition campaign before full collection."
    };
  }
  if ((normalized.includes("project") || normalized.includes("مشروع")) && permissions.includes("projects:read")) {
    return {
      tool: "getProjectHealth",
      result: db.projects,
      answerAr: "يوجد مشروع نشط بحالة amber. الـ milestone قيد التنفيذ بنسبة 65% وقريب من موعد التسليم.",
      answerEn: "One active project is in amber health. The milestone is 65% complete and close to its due date."
    };
  }
  if ((normalized.includes("lead") || normalized.includes("ليد") || normalized.includes("pipeline") || normalized.includes("فرصة")) && permissions.includes("crm:read")) {
    return {
      tool: "getLeadPipeline",
      result: executiveDashboard.pipeline,
      answerAr: "الـ pipeline الحالي يضم 34 فرصة بقيمة إجمالية 214k. أعلى فرصة: Commerce Growth Retainer بقيمة 24k.",
      answerEn: "Current pipeline has 34 opportunities worth $214k total. Top opportunity: Commerce Growth Retainer at $24k."
    };
  }
  if ((normalized.includes("hr") || normalized.includes("موظف") || normalized.includes("payroll") || normalized.includes("راتب")) && permissions.includes("hr:read")) {
    return {
      tool: "getHrSummary",
      result: { headcount: db.employees.length, pendingLeave: db.leaveRequests.filter((l) => l.status === "pending").length },
      answerAr: `الفريق يضم ${db.employees.length} موظفين. يوجد ${db.leaveRequests.filter((l) => l.status === "pending").length} طلب إجازة بانتظار الاعتماد.`,
      answerEn: `Team has ${db.employees.length} employees. ${db.leaveRequests.filter((l) => l.status === "pending").length} leave request(s) pending approval.`
    };
  }
  return {
    tool: "guardedGeneralAssistant",
    result: null,
    answerAr: "أستطيع الإجابة عبر أدوات CRM والمالية والمشاريع والموارد البشرية والشركاء حسب صلاحياتك. حدّد السجل أو المؤشر المطلوب.",
    answerEn: "I can answer through CRM, finance, project, HR, and partner tools based on your permissions. Specify the record or metric you want."
  };
}

async function runAnthropicChat(message: string, permissions: string[], locale: string): Promise<{ tool: string; result: unknown; answerAr: string; answerEn: string }> {
  // Dynamic import to avoid crash when SDK is not installed
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a business intelligence assistant for Prootech Agency, a digital growth and marketing agency operating in Syria, UAE, and Saudi Arabia.
You have access to live company data through tools. Use tools to answer questions about revenue, collection, projects, HR, partners, and the CRM pipeline.
Always respond in ${locale === "ar" ? "Arabic" : "English"} primarily, but include both Arabic and English answers in your response.
Keep answers concise, actionable, and specific to the data returned by tools.
The user has these permissions: ${permissions.join(", ")}.
Never reveal data the user's permissions don't cover. If a tool returns a permission error, apologize and explain what permission is needed.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages: [{ role: "user", content: message }]
  });

  let toolName = "generalAssistant";
  let toolResult: unknown = null;
  let finalText = "";

  // Process tool calls
  for (const block of response.content) {
    if (block.type === "tool_use") {
      toolName = block.name;
      const handler = toolHandlers[block.name];
      if (handler) {
        toolResult = handler(block.input as Record<string, unknown>, permissions);
      }
    }
    if (block.type === "text") {
      finalText = block.text;
    }
  }

  // If tool was called, get final answer
  if (toolResult !== null && response.stop_reason === "tool_use") {
    const followUp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: [
        { role: "user", content: message },
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: (response.content.find((b) => b.type === "tool_use") as { id: string })?.id ?? "", content: JSON.stringify(toolResult) }]
        }
      ]
    });
    for (const block of followUp.content) {
      if (block.type === "text") finalText = block.text;
    }
  }

  const answerAr = locale === "ar" ? finalText : "";
  const answerEn = locale !== "ar" ? finalText : "";

  return { tool: toolName, result: toolResult, answerAr: answerAr || finalText, answerEn: answerEn || finalText };
}

export const aiRouter = Router();
aiRouter.use(requireAuth, requirePermission("ai:use"));

aiRouter.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const input = chatSchema.parse(req.body);
    const permissions = req.user?.permissions ?? [];
    const locale = req.user?.locale ?? "ar";

    let trace: { tool: string; result: unknown; answerAr: string; answerEn: string };

    if (env.AI_PROVIDER === "anthropic" && env.ANTHROPIC_API_KEY) {
      try {
        trace = await runAnthropicChat(input.message, permissions as string[], locale);
      } catch {
        trace = runFallbackTool(input.message, permissions as string[]);
      }
    } else {
      trace = runFallbackTool(input.message, permissions as string[]);
    }

    createRecord("aiConversations", {
      userId: req.user?.id,
      title: input.message.slice(0, 80),
      message: input.message,
      toolCalls: [{ name: trace.tool, resultPreview: trace.result }],
      policy: { scope: permissions, directDbAccess: false }
    });

    ok(res, trace);
  })
);

aiRouter.post(
  "/draft-email",
  asyncHandler(async (req, res) => {
    const clientName = String(req.body.clientName ?? "");
    const invoiceNum = String(req.body.invoiceNumber ?? "");
    const amount = String(req.body.amount ?? "");

    ok(res, {
      subjectAr: `متابعة بخصوص الفاتورة ${invoiceNum} — Prootech`,
      bodyAr: `مرحباً ${clientName || "فريق العميل الكريم"},\n\nنأمل أن تكونوا بخير. نودّ التذكير بلطف بأن الفاتورة رقم ${invoiceNum}${amount ? ` بمبلغ ${amount}` : ""} ما زالت قيد الانتظار.\n\nنحن هنا لمساعدتكم في أي تفاصيل إضافية أو تسهيل عملية الدفع. يمكنكم الدفع مباشرة عبر الرابط المرفق في الفاتورة.\n\nشكراً لتعاونكم،\nفريق Prootech`,
      subjectEn: `Friendly follow-up on invoice ${invoiceNum} — Prootech`,
      bodyEn: `Hello ${clientName || "team"},\n\nHope you're well. This is a gentle reminder that invoice ${invoiceNum}${amount ? ` for ${amount}` : ""} is still pending.\n\nWe're happy to assist with any additional details or to make the payment process easier. You can pay directly via the link in the invoice.\n\nThank you for your cooperation,\nProotech Team`
    });
  })
);

aiRouter.post(
  "/explain-metric",
  asyncHandler(async (req, res) => {
    const permissions = req.user?.permissions ?? [];
    ok(res, runFallbackTool(String(req.body.metric ?? ""), permissions as string[]));
  })
);

aiRouter.post(
  "/next-best-action",
  asyncHandler(async (_req, res) => ok(res, executiveDashboard.aiInsights))
);

aiRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const conversations = db.aiConversations.filter((c) => c.userId === req.user?.id);
    ok(res, { rows: conversations, total: conversations.length });
  })
);

aiRouter.post(
  "/feedback",
  asyncHandler(async (req, res) => {
    const row = createRecord("aiFeedback", {
      conversationId: req.body.conversationId,
      userId: req.user?.id,
      rating: req.body.rating,
      note: req.body.note
    }, req.user?.id);
    ok(res, row);
  })
);
