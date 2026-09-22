import { Schema, model } from "mongoose";

export const PartnerModel = model(
  "Partner",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      fullName: String,
      companyName: String,
      email: { type: String, index: true },
      phone: String,
      partnerType: { type: String, index: true },
      status: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const PartnerAgreementModel = model(
  "PartnerAgreement",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      partnerId: { type: String, index: true },
      agreementType: String,
      startDate: Date,
      endDate: Date,
      settlementBasis: String,
      status: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const PartnerShareRuleModel = model(
  "PartnerShareRule",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      partnerAgreementId: { type: String, index: true },
      ruleCode: { type: String, index: true },
      ruleVersion: Number,
      percentage: Number,
      fixedFee: Number,
      minThreshold: Number,
      maxCap: Number,
      eligibilityConditions: Schema.Types.Mixed,
      clawbackPolicy: String,
      status: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const PartnerSettlementModel = model(
  "PartnerSettlement",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      partnerId: { type: String, index: true },
      fromDate: Date,
      toDate: Date,
      grossBasis: Number,
      eligibleAmount: Number,
      shareAmount: Number,
      currencyCode: String,
      status: { type: String, index: true },
      lines: [Schema.Types.Mixed]
    },
    { timestamps: true }
  )
);

export const AiConversationModel = model(
  "AiConversation",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      userId: { type: String, index: true },
      title: String
    },
    { timestamps: true }
  )
);

export const AiMessageModel = model(
  "AiMessage",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      conversationId: { type: String, index: true },
      role: String,
      content: String,
      toolCalls: [Schema.Types.Mixed],
      policyResult: Schema.Types.Mixed
    },
    { timestamps: true }
  )
);

export const AiToolCallModel = model(
  "AiToolCall",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      conversationId: { type: String, index: true },
      toolName: { type: String, index: true },
      input: Schema.Types.Mixed,
      outputSummary: String,
      status: { type: String, index: true }
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  )
);

export const AiFeedbackModel = model(
  "AiFeedback",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      conversationId: { type: String, index: true },
      userId: { type: String, index: true },
      rating: Number,
      note: String
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  )
);

export const AiSalesCampaignModel = model(
  "AiSalesCampaign",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      name: String,
      sector: { type: String, index: true },
      region: { type: String, index: true },
      objective: String,
      mode: { type: String, index: true },
      status: { type: String, index: true },
      targetTitle: String,
      language: String,
      approvedCount: Number,
      sentCount: Number,
      qualifiedCount: Number
    },
    { timestamps: true }
  )
);

export const AiSalesProspectModel = model(
  "AiSalesProspect",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      campaignId: { type: String, index: true },
      companyName: { type: String, index: true },
      website: String,
      country: { type: String, index: true },
      industry: { type: String, index: true },
      sizeBand: String,
      contactName: String,
      contactTitle: String,
      email: { type: String, index: true },
      fitScore: Number,
      observation: String,
      likelyImpact: String,
      suggestedAngle: String,
      draftSubject: String,
      draftBody: String,
      status: { type: String, index: true },
      nextAction: String,
      deliverySignal: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const AiSalesActivityModel = model(
  "AiSalesActivity",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      campaignId: { type: String, index: true },
      prospectId: { type: String, index: true },
      type: { type: String, index: true },
      title: String,
      detail: String
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  )
);
