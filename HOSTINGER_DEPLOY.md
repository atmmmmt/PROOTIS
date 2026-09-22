# Hostinger deployment

PROOTIS is bundled as a single Node.js application for Hostinger. The root build script compiles the API and dashboard, then creates one production bundle in `dist/`.

## Hostinger build settings

- Framework preset: `Other`
- Branch: `main`
- Node version: `20.x`
- Root directory: `./`
- Build command: `npm run build`
- Package manager: `npm`
- Output directory: `dist`
- Entry file: `index.js`

## Required environment variables

```env
NODE_ENV=production
PORT=3000
WEB_ORIGIN=https://YOUR-DOMAIN
JWT_ACCESS_SECRET=CHANGE_ME
JWT_REFRESH_SECRET=CHANGE_ME
WEBHOOK_PAYMENT_SECRET=CHANGE_ME
AI_PROVIDER=disabled
```

For persistent production data, also set:

```env
MONGO_URI=mongodb+srv://...
```

To enable the Anthropic-backed AI assistant:

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
```

The dashboard uses same-origin `/api/v1` by default, so `VITE_API_BASE` is not required for the standard Hostinger deployment.

## Production bundle

After `npm run build`:

```text
dist/
  index.js          # Node.js entry point
  app.js            # Express app
  ...               # compiled API modules
  package.json      # marks bundle as ESM
  public/           # Vite/React dashboard
    index.html
    assets/
```

Express serves `/api/v1/*` as API routes and serves the React SPA for all non-API routes in production.
