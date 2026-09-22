import { Schema, model } from "mongoose";

const base = {
  _id: { type: String },
  organizationId: { type: String, index: true, required: true },
  status: { type: String, index: true, default: "active" },
  createdBy: String,
  updatedBy: String
};

export const OwnershipBeneficiaryModel = model(
  "OwnershipBeneficiary",
  new Schema(
    {
      ...base,
      name: { type: String, required: true },
      code: { type: String, index: true },
      beneficiaryType: { type: String, index: true },
      relatedPartnerId: { type: String, index: true },
      relatedUserId: { type: String, index: true },
      notes: String
    },
    { timestamps: true }
  )
);

export const ServiceCatalogModel = model(
  "ServiceCatalog",
  new Schema(
    {
      ...base,
      kind: { type: String, index: true },
      parentId: { type: String, index: true },
      name: { type: String, required: true },
      code: { type: String, index: true },
      managerBeneficiaryId: { type: String, index: true },
      sortOrder: Number,
      metadata: Schema.Types.Mixed
    },
    { timestamps: true }
  )
);

export const DistributionTemplateModel = model(
  "DistributionTemplate",
  new Schema(
    {
      ...base,
      name: { type: String, required: true },
      code: { type: String, index: true },
      scopeType: { type: String, index: true },
      scopeId: { type: String, index: true },
      version: Number,
      isDefault: Boolean,
      expenseBasis: { type: String, index: true },
      roundingMode: String,
      roundingBeneficiaryId: { type: String, index: true },
      rules: [Schema.Types.Mixed]
    },
    { timestamps: true }
  )
);

export const ProjectDistributionProfileModel = model(
  "ProjectDistributionProfile",
  new Schema(
    {
      ...base,
      projectId: { type: String, index: true, unique: true },
      departmentId: { type: String, index: true },
      serviceId: { type: String, index: true },
      templateId: { type: String, index: true },
      notes: String
    },
    { timestamps: true }
  )
);

export const DistributionReceiptModel = model(
  "DistributionReceipt",
  new Schema(
    {
      ...base,
      sourceType: { type: String, index: true },
      sourceId: { type: String, index: true },
      projectId: { type: String, index: true },
      subscriptionId: { type: String, index: true },
      clientName: String,
      amount: Number,
      deductions: Number,
      distributableAmount: Number,
      currencyCode: String,
      receivedAt: { type: Date, index: true },
      paymentMethod: String,
      reference: String,
      templateId: { type: String, index: true },
      allocationId: { type: String, index: true },
      note: String
    },
    { timestamps: true }
  )
);

export const DistributionAllocationModel = model(
  "DistributionAllocation",
  new Schema(
    {
      ...base,
      receiptId: { type: String, index: true },
      sourceType: { type: String, index: true },
      sourceId: { type: String, index: true },
      projectId: { type: String, index: true },
      subscriptionId: { type: String, index: true },
      receivedAt: { type: Date, index: true },
      amountReceived: Number,
      deductions: Number,
      distributableAmount: Number,
      currencyCode: String,
      templateId: { type: String, index: true },
      templateSnapshot: Schema.Types.Mixed,
      lines: [Schema.Types.Mixed]
    },
    { timestamps: true }
  )
);

export const PayoutEventModel = model(
  "PayoutEvent",
  new Schema(
    {
      ...base,
      allocationId: { type: String, index: true },
      lineId: { type: String, index: true },
      beneficiaryId: { type: String, index: true },
      amount: Number,
      currencyCode: String,
      paidAt: { type: Date, index: true },
      paymentMethod: String,
      note: String
    },
    { timestamps: true }
  )
);

export const SaasProductModel = model(
  "SaasProduct",
  new Schema(
    {
      ...base,
      name: { type: String, required: true },
      code: { type: String, index: true },
      defaultMonthlyFee: Number,
      currencyCode: String,
      templateId: { type: String, index: true },
      description: String
    },
    { timestamps: true }
  )
);

export const SaasSubscriptionModel = model(
  "SaasSubscription",
  new Schema(
    {
      ...base,
      productId: { type: String, index: true },
      accountId: { type: String, index: true },
      clientName: String,
      monthlyFee: Number,
      currencyCode: String,
      billingCycle: String,
      billingDay: Number,
      nextBillingDate: { type: Date, index: true },
      templateId: { type: String, index: true },
      notes: String
    },
    { timestamps: true }
  )
);

export const OwnershipSettingModel = model(
  "OwnershipSetting",
  new Schema(
    {
      ...base,
      key: { type: String, index: true, unique: true, required: true },
      value: Schema.Types.Mixed,
      notes: String
    },
    { timestamps: true }
  )
);

export const PersonalContributionModel = model(
  "PersonalContribution",
  new Schema(
    {
      ...base,
      contributorBeneficiaryId: { type: String, index: true, required: true },
      contributorName: String,
      employerName: String,
      salaryMonth: { type: String, index: true },
      salaryReceivedAt: { type: Date, index: true },
      salaryAmount: Number,
      ratePercent: Number,
      contributionAmount: Number,
      paidAmount: Number,
      remainingAmount: Number,
      currencyCode: String,
      targetBeneficiaryId: { type: String, index: true },
      paidAt: { type: Date, index: true },
      paymentMethod: String,
      payments: [Schema.Types.Mixed],
      reference: String,
      note: String
    },
    { timestamps: true }
  )
);
