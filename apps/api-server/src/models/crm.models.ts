import { Schema, model } from "mongoose";

const scoped = {
  organizationId: { type: String, index: true, required: true },
  businessUnitId: { type: String, index: true },
  status: { type: String, index: true },
  tags: [String]
};

export const LeadModel = model(
  "Lead",
  new Schema(
    {
      ...scoped,
      source: { type: String, index: true },
      fullName: String,
      companyName: String,
      email: { type: String, index: true },
      phone: String,
      country: String,
      notes: String,
      assignedTo: { type: String, index: true },
      score: Number
    },
    { timestamps: true }
  )
);

export const AccountModel = model(
  "Account",
  new Schema(
    {
      ...scoped,
      name: { type: String, index: true },
      industry: String,
      country: String,
      website: String,
      size: String,
      ownerUserId: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const ContactModel = model(
  "Contact",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      accountId: { type: String, index: true },
      fullName: String,
      title: String,
      email: { type: String, index: true },
      phone: String,
      whatsapp: String,
      isPrimary: Boolean
    },
    { timestamps: true }
  )
);

export const OpportunityModel = model(
  "Opportunity",
  new Schema(
    {
      ...scoped,
      accountId: { type: String, index: true },
      primaryContactId: String,
      title: String,
      stage: { type: String, index: true },
      estimatedAmount: Number,
      currencyCode: String,
      probability: Number,
      expectedCloseDate: Date,
      ownerUserId: { type: String, index: true },
      sourceLeadId: String,
      partnerAttribution: {
        partnerId: String,
        ruleCode: String
      }
    },
    { timestamps: true }
  )
);

export const CrmActivityModel = model(
  "CrmActivity",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      entityType: { type: String, index: true },
      entityId: { type: String, index: true },
      type: String,
      title: String,
      description: String,
      dueDate: Date,
      ownerUserId: { type: String, index: true },
      status: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const ProposalModel = model(
  "Proposal",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      opportunityId: { type: String, index: true },
      version: Number,
      title: String,
      summary: String,
      lineItems: [Schema.Types.Mixed],
      totalAmount: Number,
      currencyCode: String,
      marginEstimate: Number,
      approvalStatus: { type: String, index: true },
      fileId: String,
      createdBy: String
    },
    { timestamps: true }
  )
);

export const ContractModel = model(
  "Contract",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      opportunityId: { type: String, index: true },
      accountId: { type: String, index: true },
      contractType: String,
      startDate: Date,
      endDate: Date,
      billingTerms: String,
      paymentTerms: String,
      renewalType: String,
      partnerRuleSnapshot: Schema.Types.Mixed,
      status: { type: String, index: true },
      fileId: String
    },
    { timestamps: true }
  )
);
