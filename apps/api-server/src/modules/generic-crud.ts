import { Router } from "express";
import type { Permission } from "@prootech/shared-types";
import { requireAuth, requirePermission } from "../core/auth.js";
import { asyncHandler, ok, ApiError } from "../core/http.js";
import { createRecord, deleteRecord, listCollection, updateRecord, db } from "../data/demo-store.js";
import { maskEmployee, maskPayrollItem } from "../core/mask.js";

type CollectionName = keyof typeof db;

function filterRows(rows: Array<Record<string, unknown>>, query: Record<string, unknown>) {
  const search = String(query.search ?? "").toLowerCase();
  const sort = String(query.sort ?? "");
  const sortDir = String(query.sortDir ?? "desc");

  let filtered = rows;
  for (const [key, value] of Object.entries(query)) {
    if (["page", "pageSize", "search", "sort", "sortDir"].includes(key) || value === undefined || value === "") continue;
    filtered = filtered.filter((row) => String(row[key] ?? "") === String(value));
  }
  if (search) {
    filtered = filtered.filter((row) => JSON.stringify(row).toLowerCase().includes(search));
  }
  if (sort) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = String(a[sort] ?? "");
      const bVal = String(b[sort] ?? "");
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }
  return filtered;
}

export function crudRouter(collectionName: CollectionName, readPermission: Permission, writePermission?: Permission) {
  const router = Router();
  router.use(requireAuth);

  router.get(
    "/",
    requirePermission(readPermission),
    asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page ?? 1), 1);
      const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 25), 1), 100);
      const rows = filterRows(listCollection(collectionName), req.query);
      const start = (page - 1) * pageSize;
      let paged = rows.slice(start, start + pageSize);
      if (collectionName === "employees") paged = paged.map((row) => maskEmployee(row, req.user));
      if (collectionName === "payrollItems") paged = paged.map((row) => maskPayrollItem(row, req.user));
      ok(res, { rows: paged, total: rows.length, page, pageSize });
    })
  );

  router.get(
    "/:id",
    requirePermission(readPermission),
    asyncHandler(async (req, res) => {
      const row = listCollection(collectionName).find((item) => item.id === req.params.id);
      if (!row) throw new ApiError(404, "not_found", "Record not found.");
      if (collectionName === "employees") return ok(res, maskEmployee(row, req.user));
      if (collectionName === "payrollItems") return ok(res, maskPayrollItem(row, req.user));
      ok(res, row);
    })
  );

  if (writePermission) {
    router.post(
      "/",
      requirePermission(writePermission),
      asyncHandler(async (req, res) => ok(res, createRecord(collectionName, req.body, req.user?.id)))
    );

    router.patch(
      "/:id",
      requirePermission(writePermission),
      asyncHandler(async (req, res) => {
        const row = updateRecord(collectionName, String(req.params.id), req.body);
        if (!row) throw new ApiError(404, "not_found", "Record not found.");
        ok(res, row);
      })
    );

    router.delete(
      "/:id",
      requirePermission(writePermission),
      asyncHandler(async (req, res) => {
        const deleted = deleteRecord(collectionName, String(req.params.id));
        if (!deleted) throw new ApiError(404, "not_found", "Record not found.");
        ok(res, { deleted: true, id: req.params.id });
      })
    );
  }

  return router;
}
