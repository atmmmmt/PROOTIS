import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save, ShieldCheck, UserPlus, Users } from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { Badge, SectionHeader, Surface } from "../components/ui";

type AnyRow = Record<string, any>;

const editableFieldOptions = [
  { key: "status", ar: "حالة المشروع", en: "Project status" },
  { key: "healthStatus", ar: "صحة المشروع", en: "Project health" },
  { key: "description", ar: "الوصف", en: "Description" },
  { key: "startDate", ar: "تاريخ البداية", en: "Start date" },
  { key: "endDate", ar: "تاريخ النهاية", en: "End date" }
];

const extraPermissionOptions = [
  { key: "projects:read", ar: "الوصول الكامل للمشاريع", en: "Full Projects module" },
  { key: "projects:write", ar: "تعديل كامل للمشاريع", en: "Full project editing" },
  { key: "crm:read", ar: "عرض CRM", en: "View CRM" },
  { key: "finance:read", ar: "عرض المالية العامة", en: "View full Finance" },
  { key: "analytics:read", ar: "عرض التحليلات الإدارية", en: "View executive analytics" },
  { key: "partners:read", ar: "عرض قسم الشركاء", en: "View Partners module" },
  { key: "ai:use", ar: "استخدام المساعد الذكي", en: "Use AI assistant" }
];

function checkboxClass() {
  return "h-4 w-4 rounded border-prootech-line accent-prootech-violet";
}

export function AccessPage() {
  const locale = useAppStore((state) => state.locale);
  const isAr = locale === "ar";
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");
  const [credentials, setCredentials] = useState<Array<{ fullName: string; email: string; status: string; password: string | null }>>([]);

  const accountsQuery = useQuery({ queryKey: ["access-accounts"], queryFn: api.accessAccounts });
  const ownershipQuery = useQuery({ queryKey: ["ownership-overview-access"], queryFn: () => api.ownershipOverview() });
  const accounts = accountsQuery.data?.rows ?? [];
  const selected = useMemo(() => accounts.find((item) => String(item.id) === selectedId), [accounts, selectedId]);

  const createDefaults = useMutation({
    mutationFn: api.createDefaultPartnerAccounts,
    onSuccess: (result) => {
      setCredentials(result.rows);
      qc.invalidateQueries({ queryKey: ["access-accounts"] });
      qc.invalidateQueries({ queryKey: ["ownership-overview-access"] });
    }
  });

  const resetPassword = useMutation({
    mutationFn: (id: string) => api.resetAccessPassword(id),
    onSuccess: (result, id) => {
      const account = accounts.find((item) => String(item.id) === id);
      if (account) setCredentials([{ fullName: String(account.fullName), email: String(account.email), status: "reset", password: result.password }]);
    }
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-hero-gradient p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.08em] text-white/50">Access Control</p>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">{isAr ? "الحسابات والصلاحيات" : "Accounts & Permissions"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            {isAr ? "أنت تحدد لكل شريك شو بيشوف، أي مشاريع بتظهرله، وإذا مسموح يعدّل حقول محددة حسب منصبه." : "Control exactly what every partner can see and which project fields they can edit."}
          </p>
        </div>
        <button onClick={() => createDefaults.mutate()} disabled={createDefaults.isPending} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-prootech-black disabled:opacity-60">
          <UserPlus size={16} />
          {isAr ? "إنشاء حسابات الشركاء الثلاثة" : "Create partner accounts"}
        </button>
      </section>

      {credentials.length > 0 && (
        <Surface className="border-amber-200 bg-amber-50 p-5">
          <SectionHeader title={isAr ? "بيانات دخول مؤقتة — انسخها الآن" : "Temporary credentials — copy now"} />
          <div className="grid gap-3 lg:grid-cols-3">
            {credentials.map((item) => (
              <div key={item.email} className="rounded-xl border border-amber-200 bg-white p-4">
                <p className="font-semibold">{item.fullName}</p>
                <p className="mt-2 text-xs text-prootech-text-muted">{item.email}</p>
                <p className="mt-1 break-all font-mono text-sm">{item.password ?? (isAr ? "الحساب موجود مسبقاً — لم تتغير كلمة مروره" : "Existing account — password unchanged")}</p>
              </div>
            ))}
          </div>
        </Surface>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Surface className="p-5">
          <SectionHeader title={isAr ? "المستخدمون" : "Users"} subtitle={isAr ? "اختر حساب لتعديل وصوله" : "Select an account to edit access"} />
          <div className="space-y-2">
            {accounts.map((account) => (
              <button key={String(account.id)} onClick={() => setSelectedId(String(account.id))}
                className={`w-full rounded-xl border p-3 text-start transition ${selectedId === String(account.id) ? "border-prootech-violet bg-prootech-violet-soft" : "border-prootech-line bg-white hover:bg-prootech-muted"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{String(account.fullName)}</p>
                    <p className="truncate text-xs text-prootech-text-muted">{String(account.email)}</p>
                  </div>
                  <Badge variant={account.status === "active" ? "success" : "default"}>{String(account.status ?? "active")}</Badge>
                </div>
                {account.beneficiaryName && <p className="mt-2 text-xs text-prootech-violet">{isAr ? "مرتبط بـ: " : "Linked: "}{String(account.beneficiaryName)}</p>}
              </button>
            ))}
          </div>
        </Surface>

        <Surface className="p-5">
          {selected ? (
            <AccessEditor
              account={selected}
              beneficiaries={ownershipQuery.data?.beneficiaries ?? []}
              structure={ownershipQuery.data?.structure ?? []}
              isAr={isAr}
              onSaved={() => qc.invalidateQueries({ queryKey: ["access-accounts"] })}
              onReset={() => resetPassword.mutate(String(selected.id))}
              resetting={resetPassword.isPending}
            />
          ) : (
            <div className="grid min-h-72 place-items-center text-center text-sm text-prootech-text-muted">
              <div><Users className="mx-auto mb-3" size={28} /><p>{isAr ? "اختر مستخدم من القائمة" : "Select a user"}</p></div>
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

function AccessEditor({ account, beneficiaries, structure, isAr, onSaved, onReset, resetting }: { account: AnyRow; beneficiaries: AnyRow[]; structure: AnyRow[]; isAr: boolean; onSaved: () => void; onReset: () => void; resetting: boolean }) {
  const [form, setForm] = useState(() => ({
    fullName: String(account.fullName ?? ""),
    email: String(account.email ?? ""),
    status: String(account.status ?? "active"),
    beneficiaryId: String(account.beneficiaryId ?? ""),
    permissionsOverrides: [...(account.permissionsOverrides ?? [])] as string[],
    accessScope: {
      canViewAllProjects: Boolean(account.accessScope?.canViewAllProjects),
      departmentIds: [...(account.accessScope?.departmentIds ?? [])] as string[],
      projectIds: [...(account.accessScope?.projectIds ?? [])] as string[],
      canViewCompanyGrowth: Boolean(account.accessScope?.canViewCompanyGrowth),
      canViewProjectFinancials: Boolean(account.accessScope?.canViewProjectFinancials),
      editableProjectFields: [...(account.accessScope?.editableProjectFields ?? [])] as string[]
    }
  }));

  const mutation = useMutation({
    mutationFn: () => api.updateAccessAccount(String(account.id), { ...form, roles: account.roles?.includes("partner") ? account.roles : ["partner"] }),
    onSuccess: onSaved
  });

  const departments = structure.filter((item) => item.kind === "department" && item.status !== "archived");
  const toggleArray = (key: "permissionsOverrides" | "departmentIds" | "editableProjectFields", value: string) => {
    if (key === "permissionsOverrides") {
      setForm((current) => ({ ...current, permissionsOverrides: current.permissionsOverrides.includes(value) ? current.permissionsOverrides.filter((item) => item !== value) : [...current.permissionsOverrides, value] }));
      return;
    }
    setForm((current) => ({
      ...current,
      accessScope: {
        ...current.accessScope,
        [key]: current.accessScope[key].includes(value) ? current.accessScope[key].filter((item) => item !== value) : [...current.accessScope[key], value]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{form.fullName}</h2>
          <p className="text-xs text-prootech-text-muted">{form.email}</p>
        </div>
        <button onClick={onReset} disabled={resetting} className="inline-flex items-center gap-2 rounded-xl border border-prootech-line px-3 py-2 text-xs font-medium hover:bg-prootech-muted disabled:opacity-50"><KeyRound size={14} />{isAr ? "كلمة مرور جديدة" : "Reset password"}</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-prootech-text-muted">{isAr ? "الاسم" : "Name"}<input className="mt-1 w-full rounded-xl border border-prootech-line px-3 py-2.5 text-sm" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
        <label className="text-xs text-prootech-text-muted">Email<input className="mt-1 w-full rounded-xl border border-prootech-line px-3 py-2.5 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="text-xs text-prootech-text-muted">{isAr ? "مرتبط بحصة" : "Beneficiary"}<select className="mt-1 w-full rounded-xl border border-prootech-line px-3 py-2.5 text-sm" value={form.beneficiaryId} onChange={(e) => setForm({ ...form, beneficiaryId: e.target.value })}><option value="">—</option>{beneficiaries.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></label>
        <label className="text-xs text-prootech-text-muted">{isAr ? "حالة الحساب" : "Account status"}<select className="mt-1 w-full rounded-xl border border-prootech-line px-3 py-2.5 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      </div>

      <div>
        <SectionHeader title={isAr ? "شو بيشوف ضمن بوابة الشريك؟" : "Partner portal visibility"} />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["canViewAllProjects", isAr ? "كل المشاريع" : "All projects"],
            ["canViewCompanyGrowth", isAr ? "تطور الشركة" : "Company growth"],
            ["canViewProjectFinancials", isAr ? "ميزانيات المشاريع" : "Project budgets"]
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-prootech-line p-3 text-sm"><input className={checkboxClass()} type="checkbox" checked={Boolean((form.accessScope as any)[key])} onChange={(e) => setForm((current) => ({ ...current, accessScope: { ...current.accessScope, [key]: e.target.checked } }))} />{label}</label>
          ))}
        </div>
      </div>

      {!form.accessScope.canViewAllProjects && (
        <div>
          <SectionHeader title={isAr ? "الأقسام المسموح يشوف مشاريعها" : "Allowed departments"} />
          <div className="grid gap-2 sm:grid-cols-2">
            {departments.map((department) => <label key={String(department.id)} className="flex items-center gap-2 rounded-xl border border-prootech-line p-3 text-sm"><input className={checkboxClass()} type="checkbox" checked={form.accessScope.departmentIds.includes(String(department.id))} onChange={() => toggleArray("departmentIds", String(department.id))} />{String(department.name)}</label>)}
          </div>
        </div>
      )}

      <div>
        <SectionHeader title={isAr ? "شو مسموح يعدل بالمشروع؟" : "Editable project fields"} subtitle={isAr ? "اتركها كلها فاضية ليكون وصول قراءة فقط" : "Leave empty for read-only access"} />
        <div className="grid gap-2 sm:grid-cols-2">
          {editableFieldOptions.map((field) => <label key={field.key} className="flex items-center gap-2 rounded-xl border border-prootech-line p-3 text-sm"><input className={checkboxClass()} type="checkbox" checked={form.accessScope.editableProjectFields.includes(field.key)} onChange={() => toggleArray("editableProjectFields", field.key)} />{isAr ? field.ar : field.en}</label>)}
        </div>
      </div>

      <div>
        <SectionHeader title={isAr ? "صلاحيات إضافية خارج بوابة الشريك" : "Extra full-module permissions"} subtitle={isAr ? "يفضل تتركها مقفلة إلا عند الحاجة" : "Keep these off unless the role requires them"} />
        <div className="grid gap-2 sm:grid-cols-2">
          {extraPermissionOptions.map((permission) => <label key={permission.key} className="flex items-center gap-2 rounded-xl border border-prootech-line p-3 text-sm"><input className={checkboxClass()} type="checkbox" checked={form.permissionsOverrides.includes(permission.key)} onChange={() => toggleArray("permissionsOverrides", permission.key)} />{isAr ? permission.ar : permission.en}</label>)}
        </div>
      </div>

      {mutation.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{mutation.error.message}</p>}
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-prootech-violet px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={15} />{mutation.isPending ? "..." : isAr ? "حفظ الصلاحيات" : "Save access"}</button>
    </div>
  );
}
