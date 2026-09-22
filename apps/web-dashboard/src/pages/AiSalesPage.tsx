import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, Check, CirclePlay, Mail, Radar, RefreshCw, Send, Sparkles, UserRoundCheck, X } from "lucide-react";
import type { AiSalesCampaign, AiSalesMode, AiSalesProspect, Locale } from "@prootech/shared-types";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { KpiCard, SectionHeader, StatusPill, Surface } from "../components/ui";

function useLocale() {
  const locale = useAppStore((state) => state.locale);
  return { locale, isAr: locale === "ar" };
}

const sectorOptions = ["Healthcare", "Ecommerce", "Real Estate", "Education", "Professional Services"];
const regionOptions = ["UAE", "Saudi Arabia", "Qatar", "Kuwait"];

interface CampaignFormState {
  name: string;
  sector: string;
  region: string;
  objective: string;
  targetTitle: string;
  language: "ar" | "en";
  mode: AiSalesMode;
}

function defaultCampaign(locale: Locale): CampaignFormState {
  return {
    name: locale === "ar" ? "حملة عيادات الإمارات" : "UAE Clinics Campaign",
    sector: "Healthcare",
    region: "UAE",
    objective:
      locale === "ar"
        ? "استهداف شركات خدمات صحية لديها ضعف في الحجز والمتابعة بهدف حجز مكالمات تعريفية."
        : "Target service businesses with weak booking and follow-up to book intro calls.",
    targetTitle: locale === "ar" ? "Operations Director" : "Operations Director",
    language: "en" as const,
    mode: "copilot" as AiSalesMode
  };
}

export function AiSalesPage() {
  const { locale, isAr } = useLocale();
  const queryClient = useQueryClient();
  const [campaignForm, setCampaignForm] = useState(defaultCampaign(locale));
  const { data, isLoading } = useQuery({ queryKey: ["ai-sales-overview"], queryFn: api.aiSalesOverview });
  const { data: prospectsData } = useQuery({ queryKey: ["ai-sales-prospects"], queryFn: api.aiSalesProspects });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ai-sales-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["ai-sales-prospects"] })
    ]);
  };

  const createCampaign = useMutation({
    mutationFn: () => api.createAiSalesCampaign(campaignForm),
    onSuccess: refreshAll
  });

  const activateCampaign = useMutation({
    mutationFn: (campaignId: string) => api.activateAiSalesCampaign(campaignId),
    onSuccess: refreshAll
  });

  const generateProspects = useMutation({
    mutationFn: (campaignId: string) => api.generateAiSalesProspects(campaignId),
    onSuccess: refreshAll
  });

  const approveProspect = useMutation({
    mutationFn: (prospectId: string) => api.approveAiSalesProspect(prospectId),
    onSuccess: refreshAll
  });

  const rejectProspect = useMutation({
    mutationFn: (prospectId: string) => api.rejectAiSalesProspect(prospectId),
    onSuccess: refreshAll
  });

  const sendProspect = useMutation({
    mutationFn: (prospectId: string) => api.sendAiSalesProspect(prospectId),
    onSuccess: refreshAll
  });

  const simulateReply = useMutation({
    mutationFn: (prospectId: string) => api.simulateAiSalesReply(prospectId),
    onSuccess: refreshAll
  });

  const pushToCrm = useMutation({
    mutationFn: (prospectId: string) => api.pushAiSalesProspectToCrm(prospectId),
    onSuccess: refreshAll
  });

  const allProspects = prospectsData?.rows ?? [];
  const stagedProspects = useMemo(() => allProspects.slice(0, 6), [allProspects]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-hero-gradient text-white">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-medium text-white/60">
              AI Sales Copilot + Semi-Autonomous Demo
            </p>
            <h1 className="max-w-2xl text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[2.25rem]">
              {isAr
                ? "موظف مبيعات ذكي داخل Prootech: يبحث، يحلل، يكتب outreach احترافي، ويعطيك تقرير مدير واضح قبل أي إرسال حقيقي."
                : "An internal AI sales operator that researches, drafts outreach, and reports to you before any real send."}
            </h1>
            <p className="mt-4 max-w-2xl text-[0.8125rem] leading-7 text-white/60">
              {isAr
                ? "الوضع الأول Copilot يجهز الشركات والرسائل ويضعها في approval queue. الوضع الثاني Semi-Autonomous Demo يحاكي التسلسل والإرسال والمتابعة بدون دمج بريدي فعلي."
                : "Copilot prepares accounts and drafts for approval. Semi-autonomous demo simulates sequencing and follow-up without a real mailbox integration."}
            </p>
          </div>
          <div className="grid gap-3 self-end">
            <ModeCard
              icon={<Sparkles size={16} />}
              title="Copilot"
              body={isAr ? "الأفضل للحملات الجديدة: بحث + تحليل + drafts + اعتماد بشري." : "Best for new campaigns: research, diagnosis, drafts, and human approval."}
            />
            <ModeCard
              icon={<Bot size={16} />}
              title="Semi-Autonomous Demo"
              body={isAr ? "لتجربة sequence شبه ذاتي داخل المنصة قبل ربط mailbox حقيقي." : "Try semi-autonomous sequencing safely before adding a real mailbox."}
            />
          </div>
        </div>
      </section>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {data.metrics.map((metric) => (
            <KpiCard
              key={metric.id}
              label={locale === "ar" ? metric.labelAr : metric.labelEn}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone}
            />
          ))}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface className="p-5">
          <SectionHeader title={isAr ? "إطلاق حملة جديدة" : "Launch campaign"} subtitle={isAr ? "حدد القطاع والمنطقة وهدف الحملة" : "Define sector, region, and campaign objective"} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isAr ? "اسم الحملة" : "Campaign name"}>
              <input
                value={campaignForm.name}
                onChange={(event) => setCampaignForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-prootech-line px-3 py-2 outline-none focus:border-prootech-violet"
              />
            </Field>
            <Field label={isAr ? "الوضع" : "Mode"}>
              <div className="grid grid-cols-2 gap-2">
                <ModeToggleButton active={campaignForm.mode === "copilot"} onClick={() => setCampaignForm((current) => ({ ...current, mode: "copilot" }))}>
                  Copilot
                </ModeToggleButton>
                <ModeToggleButton
                  active={campaignForm.mode === "semi_autonomous"}
                  onClick={() => setCampaignForm((current) => ({ ...current, mode: "semi_autonomous" }))}
                >
                  Demo
                </ModeToggleButton>
              </div>
            </Field>
            <Field label={isAr ? "القطاع" : "Sector"}>
              <select
                value={campaignForm.sector}
                onChange={(event) => setCampaignForm((current) => ({ ...current, sector: event.target.value }))}
                className="w-full rounded-lg border border-prootech-line px-3 py-2 outline-none focus:border-prootech-violet"
              >
                {sectorOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label={isAr ? "المنطقة" : "Region"}>
              <select
                value={campaignForm.region}
                onChange={(event) => setCampaignForm((current) => ({ ...current, region: event.target.value }))}
                className="w-full rounded-lg border border-prootech-line px-3 py-2 outline-none focus:border-prootech-violet"
              >
                {regionOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label={isAr ? "المسمى المستهدف" : "Target title"}>
              <input
                value={campaignForm.targetTitle}
                onChange={(event) => setCampaignForm((current) => ({ ...current, targetTitle: event.target.value }))}
                className="w-full rounded-lg border border-prootech-line px-3 py-2 outline-none focus:border-prootech-violet"
              />
            </Field>
            <Field label={isAr ? "لغة الرسالة" : "Message language"}>
              <select
                value={campaignForm.language}
                onChange={(event) => setCampaignForm((current) => ({ ...current, language: event.target.value as "ar" | "en" }))}
                className="w-full rounded-lg border border-prootech-line px-3 py-2 outline-none focus:border-prootech-violet"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </Field>
            <Field label={isAr ? "هدف الحملة" : "Objective"} className="sm:col-span-2">
              <textarea
                value={campaignForm.objective}
                onChange={(event) => setCampaignForm((current) => ({ ...current, objective: event.target.value }))}
                className="min-h-28 w-full rounded-lg border border-prootech-line px-3 py-2 outline-none focus:border-prootech-violet"
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <ActionButton icon={<CirclePlay size={16} />} onClick={() => createCampaign.mutate()} busy={createCampaign.isPending}>
              {isAr ? "إنشاء الحملة" : "Create campaign"}
            </ActionButton>
            <GhostButton onClick={() => setCampaignForm(defaultCampaign(locale))}>{isAr ? "إعادة ضبط" : "Reset"}</GhostButton>
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeader title={isAr ? "ملخص المدير" : "Manager summary"} subtitle={isAr ? "تقييم ذكي بالوضع الحالي" : "AI-powered situational assessment"} />
          {data ? (
            <div className="grid gap-3">
              <InsightCard icon={<Radar size={16} />} title={isAr ? "أفضل زاوية" : "Best angle"} body={locale === "ar" ? data.managerSummary.topAngleAr : data.managerSummary.topAngleEn} />
              <InsightCard icon={<RefreshCw size={16} />} title={isAr ? "أضعف نقطة حالية" : "Weakest point"} body={locale === "ar" ? data.managerSummary.weakPointAr : data.managerSummary.weakPointEn} />
              <InsightCard icon={<UserRoundCheck size={16} />} title={isAr ? "التوصية التشغيلية" : "Operating recommendation"} body={locale === "ar" ? data.managerSummary.recommendationAr : data.managerSummary.recommendationEn} />
            </div>
          ) : null}
        </Surface>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-5">
          <SectionHeader title={isAr ? "الحملات" : "Campaigns"} subtitle={isAr ? "جميع الحملات المنشأة" : "All created campaigns"} />
          <div className="grid gap-3">
            {data?.campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                locale={locale}
                onActivate={() => activateCampaign.mutate(campaign.id)}
                onGenerate={() => generateProspects.mutate(campaign.id)}
              />
            ))}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeader title={isAr ? "قائمة الاعتماد" : "Approval queue"} subtitle={isAr ? "Drafts بانتظار موافقتك" : "Drafts awaiting your review"} />
          <div className="space-y-3">
            {data?.approvalQueue.length ? (
              data.approvalQueue.map((prospect) => (
                <ApprovalCard
                  key={prospect.id}
                  prospect={prospect}
                  locale={locale}
                  onApprove={() => approveProspect.mutate(prospect.id)}
                  onReject={() => rejectProspect.mutate(prospect.id)}
                  onPushToCrm={() => pushToCrm.mutate(prospect.id)}
                />
              ))
            ) : (
              <div className="rounded-lg bg-prootech-muted p-4 text-sm text-zinc-600">
                {isAr ? "لا توجد drafts بانتظار اعتماد حالياً." : "No drafts currently waiting for approval."}
              </div>
            )}
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface className="overflow-hidden">
          <div className="border-b border-prootech-line p-4">
            <SectionHeader title={isAr ? "الـ Prospects الجاهزة للتجربة" : "Prospects ready to test"} />
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  {[
                    isAr ? "الشركة" : "Company",
                    isAr ? "الدولة" : "Country",
                    isAr ? "Fit" : "Fit",
                    isAr ? "الحالة" : "Status",
                    isAr ? "الإشارة" : "Signal",
                    isAr ? "الخطوة التالية" : "Next action",
                    isAr ? "تنفيذ" : "Actions"
                  ].map((header) => (
                    <th key={header} className="px-4 py-3 text-start font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stagedProspects.map((prospect) => (
                  <tr key={prospect.id} className="border-t border-prootech-line align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-prootech-black">{prospect.companyName}</div>
                      <div className="mt-1 text-xs text-zinc-500">{prospect.contactName} · {prospect.contactTitle}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{prospect.country}</td>
                    <td className="px-4 py-3 text-zinc-700">{prospect.fitScore}</td>
                    <td className="px-4 py-3"><StatusPill value={prospect.status} /></td>
                    <td className="px-4 py-3"><StatusPill value={prospect.deliverySignal} /></td>
                    <td className="px-4 py-3 text-zinc-700">{prospect.nextAction}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <MiniButton onClick={() => sendProspect.mutate(prospect.id)} icon={<Send size={14} />}>
                          {isAr ? "Send" : "Send"}
                        </MiniButton>
                        <MiniButton onClick={() => simulateReply.mutate(prospect.id)} icon={<Mail size={14} />}>
                          {isAr ? "Reply" : "Reply"}
                        </MiniButton>
                        <MiniButton onClick={() => pushToCrm.mutate(prospect.id)} icon={<UserRoundCheck size={14} />}>
                          CRM
                        </MiniButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeader title={isAr ? "نشاط الموظف الذكي" : "AI sales activity"} subtitle={isAr ? "آخر أحداث الجلسة" : "Recent session events"} />
          <div className="space-y-3">
            {data?.activityFeed.map((item) => (
              <div key={item.id} className="rounded-lg border border-prootech-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-prootech-black">{item.title}</p>
                  <span className="text-xs text-zinc-400">{new Date(item.createdAt).toLocaleDateString(locale === "ar" ? "ar-SY" : "en-US")}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </Surface>
      </section>
    </motion.div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

function ModeToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm transition ${active ? "border-prootech-violet bg-[#f3edff] text-prootech-violet" : "border-prootech-line bg-white text-zinc-600 hover:bg-zinc-50"}`}
    >
      {children}
    </button>
  );
}

function ActionButton({ icon, children, onClick, busy = false }: { icon: ReactNode; children: ReactNode; onClick: () => void; busy?: boolean }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-lg bg-prootech-violet px-4 py-2 text-sm font-medium text-white">
      {busy ? <RefreshCw size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-prootech-line px-4 py-2 text-sm text-zinc-700">
      {children}
    </button>
  );
}

function ModeCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-2.5 inline-flex rounded-lg bg-white/10 p-2 text-white">{icon}</div>
      <p className="text-[0.8125rem] font-semibold">{title}</p>
      <p className="mt-1.5 text-[0.75rem] leading-6 text-white/65">{body}</p>
    </div>
  );
}

function InsightCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-prootech-line bg-prootech-muted/40 p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="rounded-lg bg-prootech-violet-soft p-2 text-prootech-violet">{icon}</span>
        <p className="text-[0.8125rem] font-semibold text-prootech-black">{title}</p>
      </div>
      <p className="text-[0.8125rem] leading-6 text-prootech-text-muted">{body}</p>
    </div>
  );
}

function CampaignCard({
  campaign,
  locale,
  onActivate,
  onGenerate
}: {
  campaign: AiSalesCampaign;
  locale: Locale;
  onActivate: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-xl border border-prootech-line bg-white p-5 transition-colors hover:bg-prootech-muted/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[0.9375rem] font-semibold tracking-tight text-prootech-black">{campaign.name}</h3>
          <p className="mt-1 text-xs text-prootech-text-muted">
            {campaign.sector} · {campaign.region} · {campaign.targetTitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill value={campaign.mode} />
          <StatusPill value={campaign.status} />
        </div>
      </div>
      <p className="mt-3 text-[0.8125rem] leading-6 text-prootech-text-muted">{campaign.objective}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-prootech-line pt-4">
        <div className="flex flex-1 flex-wrap gap-4 text-[0.68rem] font-medium text-prootech-text-subtle">
          <span><span className="text-prootech-black">{campaign.approvedCount}</span> معتمد</span>
          <span><span className="text-prootech-black">{campaign.sentCount}</span> مرسل</span>
          <span><span className="text-prootech-black">{campaign.qualifiedCount}</span> مؤهل</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniButton onClick={onActivate} icon={<Check size={13} />}>{locale === "ar" ? "تفعيل" : "Activate"}</MiniButton>
          <MiniButton onClick={onGenerate} icon={<Sparkles size={13} />}>{locale === "ar" ? "توليد شركات" : "Generate prospects"}</MiniButton>
        </div>
      </div>
    </div>
  );
}

function ApprovalCard({
  prospect,
  locale,
  onApprove,
  onReject,
  onPushToCrm
}: {
  prospect: AiSalesProspect;
  locale: Locale;
  onApprove: () => void;
  onReject: () => void;
  onPushToCrm: () => void;
}) {
  return (
    <div className="rounded-lg border border-prootech-line p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-prootech-black">{prospect.companyName}</h3>
          <p className="text-xs text-zinc-500">{prospect.contactName} · {prospect.contactTitle} · {prospect.country}</p>
        </div>
        <StatusPill value={prospect.status} />
      </div>
      <div className="mt-3 grid gap-3">
        <Detail label={locale === "ar" ? "Observation" : "Observation"} value={prospect.observation} />
        <Detail label={locale === "ar" ? "Impact" : "Impact"} value={prospect.likelyImpact} />
        <Detail label={locale === "ar" ? "Angle" : "Angle"} value={prospect.suggestedAngle} />
      </div>
      <div className="mt-3 rounded-lg bg-prootech-muted p-3">
        <p className="text-xs text-zinc-500">{prospect.draftSubject}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">{prospect.draftBody}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <MiniButton onClick={onApprove} icon={<Check size={14} />}>{locale === "ar" ? "اعتماد" : "Approve"}</MiniButton>
        <MiniButton onClick={onReject} icon={<X size={14} />}>{locale === "ar" ? "رفض" : "Reject"}</MiniButton>
        <MiniButton onClick={onPushToCrm} icon={<UserRoundCheck size={14} />}>{locale === "ar" ? "إدخال إلى CRM" : "Push to CRM"}</MiniButton>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-700">{value}</p>
    </div>
  );
}

function MiniButton({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-prootech-line bg-white px-3 py-1.5 text-xs font-medium text-prootech-text-muted transition hover:border-prootech-violet/40 hover:bg-prootech-violet-soft hover:text-prootech-violet"
    >
      {icon}
      {children}
    </button>
  );
}
