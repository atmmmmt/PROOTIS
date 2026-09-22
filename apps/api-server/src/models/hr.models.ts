import { Schema, model } from "mongoose";

export const EmployeeModel = model(
  "Employee",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      legalEntityId: { type: String, index: true },
      businessUnitId: { type: String, index: true },
      employeeCode: { type: String, index: true },
      fullName: String,
      email: { type: String, index: true },
      phone: String,
      title: String,
      department: { type: String, index: true },
      managerId: String,
      joinDate: Date,
      employmentType: String,
      workMode: String,
      status: { type: String, index: true },
      nationalIdMasked: String,
      bankInfoEncrypted: String,
      baseSalary: Number,
      currencyCode: String
    },
    { timestamps: true }
  )
);

export const EmploymentContractModel = model(
  "EmploymentContract",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      employeeId: { type: String, index: true },
      contractType: String,
      startDate: Date,
      endDate: Date,
      salary: Number,
      currencyCode: String,
      bonusPolicy: String,
      commissionPolicy: String,
      status: { type: String, index: true },
      fileId: String
    },
    { timestamps: true }
  )
);

export const LeaveRequestModel = model(
  "LeaveRequest",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      employeeId: { type: String, index: true },
      leaveType: String,
      startDate: Date,
      endDate: Date,
      daysCount: Number,
      reason: String,
      status: { type: String, index: true },
      approvedBy: String
    },
    { timestamps: true }
  )
);

export const PayrollRunModel = model(
  "PayrollRun",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      legalEntityId: { type: String, index: true },
      periodStart: Date,
      periodEnd: Date,
      currencyCode: String,
      status: { type: String, index: true },
      employeesCount: Number,
      totalGross: Number,
      totalDeductions: Number,
      totalNet: Number
    },
    { timestamps: true }
  )
);

export const PayrollItemModel = model(
  "PayrollItem",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      payrollRunId: { type: String, index: true },
      employeeId: { type: String, index: true },
      baseSalary: Number,
      bonuses: Number,
      commissions: Number,
      deductions: Number,
      netPay: Number,
      varianceFlag: { type: String, index: true }
    },
    { timestamps: true }
  )
);

export const PayslipModel = model(
  "Payslip",
  new Schema(
    {
      organizationId: { type: String, index: true, required: true },
      payrollRunId: { type: String, index: true },
      employeeId: { type: String, index: true },
      fileId: String,
      issuedAt: Date,
      status: { type: String, index: true }
    },
    { timestamps: true }
  )
);
