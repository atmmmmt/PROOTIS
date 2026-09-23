import { Search } from "lucide-react";
import { StatusPill, Surface } from "./ui";

export function DataTable({
  title,
  rows,
  columns
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  columns: Array<{ key: string; label: string }>;
}) {
  return (
    <Surface className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-prootech-line/80 bg-gradient-to-l from-white via-white to-prootech-violet-soft/25 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 h-1 w-8 rounded-full bg-prootech-violet" />
          <h2 className="text-[0.98rem] font-semibold tracking-[-0.02em] text-prootech-black">{title}</h2>
          <p className="mt-1 text-xs text-prootech-text-muted">{rows.length} سجل</p>
        </div>
        <label className="flex min-w-0 items-center gap-2.5 rounded-xl border border-prootech-line bg-white/85 px-3.5 py-2.5 text-xs text-zinc-500 shadow-sm transition-colors focus-within:border-prootech-violet focus-within:bg-white sm:w-64">
          <Search size={14} strokeWidth={2} className="shrink-0 text-prootech-violet" />
          <input className="w-full border-0 !bg-transparent p-0 text-xs shadow-none outline-none placeholder:text-zinc-400 focus:!shadow-none" placeholder="فلترة سريعة..." />
        </label>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-prootech-line bg-[#faf9fc]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3.5 text-start text-[0.67rem] font-semibold uppercase tracking-[0.06em] text-prootech-text-muted"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-prootech-line/60">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center">
                  <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-prootech-violet-soft text-prootech-violet">—</div>
                  <p className="mt-3 text-sm font-medium text-prootech-black">لا توجد سجلات</p>
                  <p className="mt-1 text-xs text-prootech-text-muted">ستظهر البيانات هنا عند إضافتها.</p>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={String(row.id ?? rowIndex)}
                  className="group bg-white/90 transition-colors hover:bg-prootech-violet-soft/25"
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.key}
                      className={`px-5 py-4 text-sm ${colIndex === 0 ? "font-medium text-prootech-black" : "text-prootech-text-muted"}`}
                    >
                      {column.key === "status" ||
                      column.key === "stage" ||
                      column.key === "healthStatus" ||
                      column.key === "approvalStatus" ? (
                        <StatusPill value={row[column.key]} />
                      ) : (
                        <span className="tabular-nums">{String(row[column.key] ?? "—")}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-prootech-line/80 bg-[#fcfbfd] px-5 py-3.5">
          <p className="text-xs text-prootech-text-subtle">
            يعرض <span className="font-semibold text-prootech-black">{Math.min(rows.length, 50)}</span> من أصل{" "}
            <span className="font-semibold text-prootech-black">{rows.length}</span> سجل
          </p>
          <span className="h-1.5 w-1.5 rounded-full bg-prootech-violet shadow-[0_0_0_4px_rgba(99,0,255,.08)]" />
        </div>
      )}
    </Surface>
  );
}
