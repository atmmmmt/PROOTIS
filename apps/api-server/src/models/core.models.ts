import { Schema, model } from "mongoose";

const base = {
  organizationId: { type: String, index: true, required: true },
  status: { type: String, index: true, default: "active" },
  createdBy: String,
  updatedBy: String
};

export const OrganizationModel = model(
  "Organization",
  new Schema(
    {
      name: { type: String, required: true },
      slug: { type: String, index: true, unique: true },
      status: { type: String, index: true, default: "active" },
      defaultCurrency: String,
      supportedLanguages: [String],
      timezone: String
    },
    { timestamps: true }
  )
);

export const LegalEntityModel = model(
  "LegalEntity",
  new Schema(
    {
      ...base,
      name: { type: String, required: true },
      countryCode: String,
      currencyCode: String,
      taxProfile: Schema.Types.Mixed,
      bankAccounts: [Schema.Types.Mixed]
    },
    { timestamps: true }
  )
);

export const BusinessUnitModel = model(
  "BusinessUnit",
  new Schema(
    {
      ...base,
      legalEntityId: { type: String, index: true },
      name: { type: String, required: true },
      code: { type: String, index: true },
      managerUserId: String
    },
    { timestamps: true }
  )
);

export const DepartmentModel = model(
  "Department",
  new Schema(
    {
      ...base,
      businessUnitId: { type: String, index: true },
      name: { type: String, required: true },
      code: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const SettingModel = model(
  "Setting",
  new Schema(
    {
      ...base,
      key: { type: String, index: true },
      value: Schema.Types.Mixed,
      category: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const FeatureFlagModel = model(
  "FeatureFlag",
  new Schema(
    {
      ...base,
      key: { type: String, index: true },
      enabled: Boolean,
      rollout: String
    },
    { timestamps: true }
  )
);

export const UserModel = model(
  "User",
  new Schema(
    {
      ...base,
      employeeId: { type: String, index: true },
      fullName: String,
      email: { type: String, index: true, unique: true },
      phone: String,
      passwordHash: String,
      roles: [String],
      permissionsOverrides: [String],
      deniedPermissions: [String],
      accessScope: Schema.Types.Mixed,
      lastLoginAt: Date,
      mfaEnabled: Boolean,
      locale: { type: String, default: "ar" }
    },
    { timestamps: true }
  )
);

export const RoleModel = model(
  "Role",
  new Schema(
    {
      ...base,
      name: String,
      code: { type: String, index: true },
      permissions: [String]
    },
    { timestamps: true }
  )
);

export const AuditLogModel = model(
  "AuditLog",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      actorUserId: { type: String, index: true },
      action: { type: String, index: true },
      resourceType: { type: String, index: true },
      resourceId: { type: String, index: true },
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
      interactionId: { type: String, index: true },
      ip: String,
      userAgent: String,
      outcome: { type: String, index: true }
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  )
);

export const NotificationModel = model(
  "Notification",
  new Schema(
    {
      ...base,
      userId: { type: String, index: true },
      title: String,
      body: String,
      channel: String,
      readAt: Date
    },
    { timestamps: true }
  )
);

export const FileMetadataModel = model(
  "FileMetadata",
  new Schema(
    {
      ...base,
      name: String,
      mimeType: String,
      size: Number,
      storageKey: { type: String, index: true },
      classification: { type: String, index: true }
    },
    { timestamps: true }
  )
);