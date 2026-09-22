import { Schema, model } from "mongoose";

export const InvoiceModel = model(
  "Invoice",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      legalEntityId: { type: String, index: true },
      accountId: { type: String, index: true },
      projectId: { type: String, index: true },
      contractId: String,
      invoiceNumber: { type: String, index: true },
      invoiceType: String,
      issueDate: Date,
      dueDate: Date,
      currencyCode: String,
      subtotal: Number,
      taxAmount: Number,
      totalAmount: Number,
      amountPaid: Number,
      balanceDue: Number,
      status: { type: String, index: true },
      paymentLink: String,
      externalRefs: Schema.Types.Mixed,
      createdBy: String,
      idempotencyKey: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const InvoiceLineModel = model(
  "InvoiceLine",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      invoiceId: { type: String, index: true },
      description: String,
      quantity: Number,
      unitPrice: Number,
      taxCode: String,
      lineTotal: Number
    },
    { timestamps: true }
  )
);

export const PaymentModel = model(
  "Payment",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      invoiceId: { type: String, index: true },
      accountId: { type: String, index: true },
      amount: Number,
      currencyCode: String,
      paymentMethod: String,
      paymentDate: Date,
      status: { type: String, index: true },
      externalRef: String,
      sourceSystem: String,
      idempotencyKey: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const ExpenseModel = model(
  "Expense",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      legalEntityId: { type: String, index: true },
      category: { type: String, index: true },
      vendorName: String,
      amount: Number,
      currencyCode: String,
      expenseDate: Date,
      linkedProjectId: { type: String, index: true },
      submittedBy: String,
      approvalStatus: { type: String, index: true },
      attachmentFileIds: [String]
    },
    { timestamps: true }
  )
);

export const RevenueSnapshotModel = model(
  "RevenueSnapshot",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      month: { type: String, index: true },
      revenueBooked: Number,
      revenueCollected: Number,
      grossMargin: Number,
      payrollCost: Number,
      partnerPayouts: Number,
      expenses: Number,
      netOperationalProfit: Number
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  )
);
