import type { AuthUser } from "./request-context.js";

export function maskEmployee(employee: Record<string, unknown>, user?: AuthUser) {
  const canViewPayroll = user?.permissions.includes("hr:payroll") || user?.permissions.includes("finance:read");
  if (canViewPayroll) return employee;
  return {
    ...employee,
    baseSalary: "masked",
    bankInfoEncrypted: undefined,
    nationalIdMasked: employee.nationalIdMasked ? "***-****" : undefined
  };
}

export function maskPayrollItem(item: Record<string, unknown>, user?: AuthUser) {
  const canViewPayroll = user?.permissions.includes("hr:payroll");
  if (canViewPayroll) return item;
  return { ...item, baseSalary: "masked", netPay: "masked", bonuses: "masked", deductions: "masked" };
}
