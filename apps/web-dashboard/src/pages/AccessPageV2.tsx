import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save, UserPlus, Users } from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../lib/store";
import { Badge, SectionHeader, Surface } from "../components/ui";

type Row = Record<string, any>;

type EditorState = {
  fullName: string;
  email: string;
  status: string;
  beneficiaryId: string;
  permissionsOverrides: string[];
  accessScope: {
    canViewAllProjects: boolean;
    departmentIds: string[];
    projectIds: string[];
    canViewCompanyGrowth: boolean;
    canViewProjectFinancials: boolean;
    editableProjectFields: string[];
  };
};

const modulePermissions = [
  ["projects:read", "المشاريع كاملة", "Full Projects"],
  ["projects:write", "تعديل كامل للمشاريع", "Full Project Editing"],
  ["crm:read", "CRM", "CRM"],
  ["finance:read", "المالية العامة", "Full Finance"],
  ["analytics:read", "لوحة الإدارة والنمو", "Executive & Growth"],
  ["partners:read", "قسم الشركاء", "Partners"],
  ["ai:use", "المساعد الذكي", "AI Assistant"]
] as const;

const editableFields = [
  ["status", "حالة المشروع", "Status"],
  ["healthStatus", "صحة المشروع", "Health"],
  ["description", "الوصف", "Description"],
  ["startDate", "تاريخ البداية", "Start date"],
  ["endDate", "تاريخ النهاية", "End date"]
] as const;

const checkClass = "h-4 w-4 accent-prootech-violet";

export function AccessPageV2() {
  const locale = useAppStore((state) => state.locale);
  const isAr = locale === "ar";
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [credentials, setCredentials] = useState<Array<{ fullName: string; email: string; status: string; password: string | null }>>([]);
  const accountsQuery = useQuery({ queryKey: ["access-accounts"], queryFn: api.accessAccounts });
  const ownershipQuery = useQuery({ queryKey: ["access-ownership"], queryFn: () => api.ownershipOverview() });
  const accounts = accountsQuery.data?.rows ?? [];
  const selected = useMemo(() => accounts.find((item) => String(item.id) === selectedId), [accounts, selectedId]);

  const createDefaults = useMutation({
    mutationFn: api.createDefaultPartnerAccounts,
    onSuccess: (data) => {
      setCredentials(data.rows);
      qc.invalidateQueries({ queryKey: ["access-accounts"] });
      qc.invalidateQueries({ queryKey: ["access-ownership"] });
    }
  });

  const resetPassword = useMutation({
    mutationFn: (id: string) => api.resetAccessPassword(id),
    onSuccess: (data, id) => {
      const account = accounts.find((item) => String(item.id) === id);
      if (account) setCredentials([{ fullName: String(account.fullName), email: String(account.email), status: "reset", password: data.password }]);
    }
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-hero-gradient p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="mb-3 text-[0.68rem] uppercase tracking-[0.08em] text-white/50">Identity & Access</p>
          <h1 className="text-[1.75rem] font-semibold">{isAr ? "الحسابات والصلاحيات" : "Accounts & Permissions"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{isAr ? "كل شريك عنده حساب مستقل. أنت تحدد المشاريع، الأقسام، الأرقام التي يراها، والحقول التي يحق له تعديلها." : "Give each partner a separate account and control projects, financial visibility, modules, and editable fields."}</p>
        </div>
        <button onClick={() => createDefaults.mutate()} disabled={createDefaults.isPending} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-prootech-black disabled:opacity-50"><UserPlus size={16} />{isAr ? "إنشاء حسابات أحمد وأبو دان وعبد اللطيف" : "Create default partner accounts"}</button>
      </section>

      {credentials.length > 0 && (
        <Surface className="border-amber-200 bg-amber-50 p-5">
          <SectionHeader title={isAr ? "بيانات الدخول المؤقتة — خزّنها قبل مغادرة الصفحة" : "Temporary credentials — save before leaving"} />
          <div className="grid gap-3 md:grid-cols-3">{credentials.map((item) => <div key={item.email} className="rounded-xl border border-amber-200 bg-white p-4"><p className="font-semibold">{item.fullName}</p><p className="mt-2 text-xs text-prootech-text-muted">{item.email}</p><p className="mt-1 break-all font-mono text-sm">{item.password ?? (isAr ? "الحساب موجود مسبقاً" : "Existing account")}</p></div>)}</div>
        </Surface>
      )}

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Surface className="p-4">
          <SectionHeader title={isAr ? "الحسابات" : "Accounts"} />
          <div className="space-y-2">
            {accounts.map((account) => (
              <button key={String(account.id)} onClick={() => setSelectedId(String(account.id))} className={`w-full rounded-xl border p-3 text-start ${selectedId === String(account.id) ? "border-prootech-violet bg-prootech-violet-soft" : "border-prootech-line hover:bg-prootech-muted"}`}>
                <div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{String(account.fullName)}</p><p className="truncate text-xs text-prootech-text-muted">{String(account.email)}</p></div><Badge variant={account.status === "active" ? "success" : "default"}>{String(account.status ?? "active")}</Badge></div>
                <div className="mt-2 flex flex-wrap gap-1">{(account.roles ?? []).map((role: string) => <Badge key={role} variant={role === "partner" ? "violet" : "default"}>{role}</Badge>)}</div>
                {account.beneficiaryName && <p className="mt-2 text-xs text-prootech-violet">{isAr ? "الحصة: " : "Beneficiary: "}{String(account.beneficiaryName)}</p>}
              </button>
            ))}
            {accounts.length === 0 && <p className="p-4 text-sm text-prootech-text-muted">{isAr ? "لا توجد حسابات." : "No accounts."}</p>}
          </div>
        </Surface>

        <Surface className="p-5">
          {selected ? (
            <AccountEditor
              key={String(selected.id)}
              account={selected}
              beneficiaries={ownershipQuery.data?.beneficiaries ?? []}
              structure={ownershipQuery.data?.structure ?? []}
              projects={ownershipQuery.data?.projects ?? []}
              isAr={isAr}
              onSaved={() => qc.invalidateQueries({ queryKey: ["access-accounts"] })}
              onReset={() => resetPassword.mutate(String(selected.id))}
              resetPending={resetPassword.isPending}
            />
          ) : <div className="grid min-h-72 place-items-center text-center text-prootech-text-muted"><div><Users className="mx-auto mb-3" /><p className="text-sm">{isAr ? "اختر حساب لتعديل الصلاحيات" : "Select an account to edit permissions"}</p></div></div>}
        </Surface>
      </div>
    </div>
  );
}

function AccountEditor({ account, beneficiaries, structure, projects, isAr, onSaved, onReset, resetPending }: { account: Row; beneficiaries: Row[]; structure: Row[]; projects: Row[]; isAr: boolean; onSaved: () => void; onReset: () => void; resetPending: boolean }) {
  const [form, setForm] = useState<EditorState>({
    fullName: String(account.fullName ?? ""),
    email: String(account.email ?? ""),
    status: String(account.status ?? "active"),
    beneficiaryId: String(account.beneficiaryId ?? ""),
    permissionsOverrides: [...(account.permissionsOverrides ?? [])],
    accessScope: {
      canViewAllProjects: Boolean(account.accessScope?.canViewAllProjects),
      departmentIds: [...(account.accessScope?.departmentIds ?? [])],
      projectIds: [...(account.accessScope?.projectIds ?? [])],
      canViewCompanyGrowth: Boolean(account.accessScope?.canViewCompanyGrowth),
      canViewProjectFinancials: Boolean(account.accessScope?.canViewProjectFinancials),
      editableProjectFields: [...(account.accessScope?.editableProjectFields ?? [])]
    }
  });

  const save = useMutation({
    mutationFn: () => api.updateAccessAccount(String(account.id), { ...form, roles: account.roles ?? [] }),
    onSuccess: onSaved
  });

  const departments = structure.filter((item) => item.kind === "department" && item.status !== "archived");
  const toggle = (items: string[], value: string) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div><h2 className="text-lg font-semibold">{form.fullName}</h2><p className="text-xs text-prootech-text-muted">{form.email}</p></div>
        <button onClick={onReset} disabled={resetPending} className="inline-flex items-center gap-2 rounded-xl border border-prootech-line px-3 py-2 text-xs font-medium hover:bg-prootech-muted disabled:opacity-50"><KeyRound size={14} />{isAr ? "إصدار كلمة مرور جديدة" : "Reset password"}</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-prootech-text-muted">{isAr ? "الاسم" : "Name"}<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-xl border border-prootech-line px-3 py-2.5 text-sm" /></label>
        <label className="text-xs text-prootech-text-muted">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border border-prootech-line px-3 py-2.5 text-sm" /></label>
        <label className="text-xs text-prootech-text-muted">{isAr ? "ربط الحساب بالمستفيد" : "Link beneficiary"}<select value={form.beneficiaryId} onChange={(e) => setForm({ ...form, beneficiaryId: e.target.value })} className="mt-1 w-full rounded-xl border border-prootech-line px-3 py-2.5 text-sm"><option value="">—</option>{beneficiaries.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></label>
        <label className="text-xs text-prootech-text-muted">{isAr ? "حالة الحساب" : "Status"}<select disabled={(account.roles ?? []).includes("super_admin")} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-xl border border-prootech-line px-3 py-2.5 text-sm disabled:bg-prootech-muted"><option value="active">active</option><option value="inactive">inactive</option></select></label>
      </div>

      {(account.roles ?? []).includes("partner") && <>
        <Section title={isAr ? "بوابة الشريك" : "Partner portal"}>
          <div className="grid gap-2 md:grid-cols-3">
            <Check label={isAr ? "يشوف كل المشاريع" : "All projects"} checked={form.accessScope.canViewAllProjects} onChange={(v) => setForm({ ...form, accessScope: { ...form.accessScope, canViewAllProjects: v } })} />
            <Check label={isAr ? "يشوف تطور الشركة" : "Company growth"} checked={form.accessScope.canViewCompanyGrowth} onChange={(v) => setForm({ ...form, accessScope: { ...form.accessScope, canViewCompanyGrowth: v } })} />
            <Check label={isAr ? "يشوف ميزانيات المشاريع" : "Project budgets"} checked={form.accessScope.canViewProjectFinancials} onChange={(v) => setForm({ ...form, accessScope: { ...form.accessScope, canViewProjectFinancials: v } })} />
          </div>
        </Section>

        {!form.accessScope.canViewAllProjects && <Section title={isAr ? "الوصول حسب الأقسام" : "Department access"}>
          <div className="grid gap-2 md:grid-cols-2">{departments.map((department) => <Check key={String(department.id)} label={String(department.name)} checked={form.accessScope.departmentIds.includes(String(department.id))} onChange={() => setForm({ ...form, accessScope: { ...form.accessScope, departmentIds: toggle(form.accessScope.departmentIds, String(department.id)) } })} />)}</div>
        </Section>}

        {!form.accessScope.canViewAllProjects && <Section title={isAr ? "مشاريع إضافية محددة" : "Specific extra projects"}>
          <div className="grid max-h-56 gap-2 overflow-y-auto md:grid-cols-2">{projects.map((project) => <Check key={String(project.id)} label={String(project.name)} checked={form.accessScope.projectIds.includes(String(project.id))} onChange={() => setForm({ ...form, accessScope: { ...form.accessScope, projectIds: toggle(form.accessScope.projectIds, String(project.id)) } })} />)}</div>
        </Section>}

        <Section title={isAr ? "الحقول المسموح تعديلها" : "Editable project fields"} subtitle={isAr ? "إذا ما اخترت شي بيكون وصوله قراءة فقط" : "Select none for read-only access"}>
          <div className="grid gap-2 md:grid-cols-2">{editableFields.map(([key, ar, en]) => <Check key={key} label={isAr ? ar : en} checked={form.accessScope.editableProjectFields.includes(key)} onChange={() => setForm({ ...form, accessScope: { ...form.accessScope, editableProjectFields: toggle(form.accessScope.editableProjectFields, key) } })} />)}</div>
        </Section>

        <Section title={isAr ? "صلاحيات أقسام كاملة" : "Full module permissions"} subtitle={isAr ? "فعّل فقط القسم الذي يحتاجه هذا الشريك فعلياً" : "Grant only modules this partner actually needs"}>
          <div className="grid gap-2 md:grid-cols-2">{modulePermissions.map(([key, ar, en]) => <Check key={key} label={isAr ? ar : en} checked={form.permissionsOverrides.includes(key)} onChange={() => setForm({ ...form, permissionsOverrides: toggle(form.permissionsOverrides, key) })} />)}</div>
        </Section>
      </>}

      {save.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{save.error.message}</p>}
      <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-xl bg-prootech-violet px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{save.isPending ? "..." : isAr ? "حفظ الصلاحيات" : "Save permissions"}</button>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <div><SectionHeader title={title} subtitle={subtitle} /><div>{children}</div></div>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-xl border border-prootech-line p-3 text-sm"><input type="checkbox" className={checkClass} checked={checked} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>;
}
