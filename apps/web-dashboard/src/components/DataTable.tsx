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
      {/* Table header bar */}
      <div className="flex flex-col gap-3 border-b border-prootech-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[0.9375rem] font-semibold tracking-tight text-prootech-black">{title}</h2>
          <p className="mt-0.5 text-xs text-prootech-text-muted">{rows.length} سجل</p>
        </div>
        <label className="flex min-w-0 items-center gap-2.5 rounded-lg border border-prootech-line bg-prootech-muted px-3.5 py-2 text-xs text-zinc-500 transition-colors focus-within:border-prootech-violet focus-within:bg-white sm:w-64">
          <Search size={14} strokeWidth={2} className="shrink-0 text-zinc-400" />
          <input className="w-full bg-transparent text-xs outline-none placeholder:text-zinc-400" placeholder="فلترة سريعة..." />
        </label>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-prootech-line bg-prootech-muted/60">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3 text-start text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-prootech-text-muted"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-prootech-line/60">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-prootech-text-muted">
                  لا توجد سجلات
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={String(row.id ?? rowIndex)}
                  className="group bg-white transition-colors hover:bg-prootech-muted/40"
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.key}
                      className={`px-5 py-3.5 text-sm ${colIndex === 0 ? "font-medium text-prootech-black" : "text-prootech-text-muted"}`}
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

      {/* Footer */}
      {rows.length > 0 && (
        <div className="border-t border-prootech-line px-5 py-3">
          <p className="text-xs text-prootech-text-subtle">
            يعرض <span className="font-medium text-prootech-black">{Math.min(rows.length, 50)}</span> من أصل{" "}
            <span className="font-medium text-prootech-black">{rows.length}</span> سجل
          </p>
        </div>
      )}
    </Surface>
  );
}
