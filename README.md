# Prootech Internal Enterprise Operating System

Arabic-first modular monolith for CRM, Operations, Finance, HR, Partner Management, Executive Intelligence, and an AI assistant shell.

## Stack

- React + Vite dashboard
- Tailwind CSS, Framer Motion, TanStack Query, Zustand, Recharts
- Node.js + Express modular monolith
- MongoDB schemas with Mongoose
- Redis-ready architecture for queues/cache/rate limiting
- JWT + refresh token flow, RBAC, audit logging
- Arabic and English UI with RTL/LTR support

## Run locally

```bash
npm install
npm run dev:api
npm run dev:web
```

Open:

- Dashboard: http://localhost:5173
- API health: http://localhost:4000/api/v1/health
- API docs summary: http://localhost:4000/api/v1/docs

Demo credentials:

```text
Email: admin@prootech.agency
Password: Prootech@2026
```

The API works with in-memory seed data by default. Add `MONGO_URI` to persist with MongoDB; the Mongoose schemas are defined by domain and can be wired to persistence incrementally.

## API contract

All JSON responses use the final PRD envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "permission_denied",
    "message": "Required permission: finance:read",
    "details": null
  }
}
```

Both route styles are supported:

- PRD-style: `/api/v1/leads`, `/api/v1/invoices`, `/api/v1/dashboard/executive`
- Domain-style: `/api/v1/crm/leads`, `/api/v1/finance/invoices`, `/api/v1/analytics/dashboard/executive`

Key workflow endpoints:

- `POST /api/v1/opportunities/:id/change-stage`
- `POST /api/v1/opportunities/:id/convert-to-project`
- `POST /api/v1/proposals/:id/submit`
- `POST /api/v1/proposals/:id/approve`
- `POST /api/v1/invoices/:id/issue`
- `PATCH /api/v1/leave-requests/:id/approve`
- `POST /api/v1/payroll-runs/:id/calculate`
- `POST /api/v1/payroll-runs/:id/approve`
- `POST /api/v1/payroll-runs/:id/finalize`
- `POST /api/v1/partner-settlements/preview`
- `POST /api/v1/partner-settlements/:id/approve`
- `POST /api/v1/partner-settlements/:id/mark-paid`

## Monorepo layout

```text
apps/
  api-server/
  web-dashboard/
packages/
  shared-types/
infrastructure/
  docker/
```

## Operating principles

- Organization scoped records.
- Deny by default protected routes.
- Audit write actions.
- Sensitive HR/finance fields are masked unless the role can view them.
- AI has no direct database access; it runs through typed tool handlers.
