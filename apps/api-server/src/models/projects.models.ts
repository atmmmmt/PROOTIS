import { Schema, model } from "mongoose";

export const ProjectModel = model(
  "Project",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      businessUnitId: { type: String, index: true },
      accountId: { type: String, index: true },
      opportunityId: { type: String, index: true },
      contractId: String,
      name: String,
      type: String,
      status: { type: String, index: true },
      projectManagerId: { type: String, index: true },
      startDate: Date,
      endDate: Date,
      budgetAmount: Number,
      currencyCode: String,
      billingModel: String,
      healthStatus: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const ProjectMilestoneModel = model(
  "ProjectMilestone",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      projectId: { type: String, index: true },
      title: String,
      dueDate: Date,
      amountLinked: Number,
      status: { type: String, index: true },
      progressPercent: Number
    },
    { timestamps: true }
  )
);

export const DeliverableModel = model(
  "Deliverable",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      projectId: { type: String, index: true },
      milestoneId: { type: String, index: true },
      title: String,
      description: String,
      assignedTo: [String],
      dueDate: Date,
      status: { type: String, index: true },
      priority: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const TimesheetModel = model(
  "Timesheet",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      projectId: { type: String, index: true },
      employeeId: { type: String, index: true },
      date: Date,
      hours: Number,
      taskLabel: String,
      billable: Boolean,
      notes: String,
      approvalStatus: { type: String, index: true }
    },
    { timestamps: true }
  )
);
