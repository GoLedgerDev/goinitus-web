# Quickstart: Project Foundation — App Shell & GoFabric Connection

**Branch**: `001-project-foundation` | **Date**: 2026-03-24

---

## Prerequisites

- Node.js 22 LTS (`node --version` should output `v22.x.x`)
- npm 10+ or pnpm 9+
- A running GoFabric REST server (for manual integration testing)

---

## 1. Scaffold the project

```bash
# From the repository root
npm create vite@latest . -- --template react-ts
# Accept overwrite prompts since the directory already has files

# Install required dependencies
npm install \
  @mui/material @mui/icons-material @mui/x-data-grid @mui/x-date-pickers \
  @emotion/react @emotion/styled \
  react-router-dom \
  zustand \
  axios \
  react-toastify \
  date-fns

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/user-event \
  @vitejs/plugin-react \
  typescript @types/react @types/react-dom \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react-hooks
```

---

## 2. Configure TypeScript

`tsconfig.json` must include `"strict": true` (Constitution §III):

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

---

## 3. Set environment variables

```bash
# .env.local  (never commit credentials)
VITE_BASE_URL=http://localhost:80
```

The Axios `configStore` reads `import.meta.env.VITE_BASE_URL` as its default server URL when `localStorage` has no persisted value.

---

## 4. Run the dev server

```bash
npm run dev
# → http://localhost:5173
```

The app will attempt bootstrap immediately on load. If no GoFabric backend is reachable you will see the error screen with Retry and Configure Server options — this is correct behaviour.

---

## 5. Run tests

```bash
npm run test           # Vitest watch mode
npm run test -- --run  # Single run (CI)
```

---

## 6. Type-check (CI gate)

```bash
npx tsc --noEmit  # Must exit with 0 errors (Constitution §III)
```

---

## 7. Connect to a live backend

1. Open the app at `http://localhost:5173`
2. Click the settings gear in the Header (or wait for the error screen on first load)
3. Enter the GoFabric REST server address and Basic Auth credentials
4. Click **Connect** — the app bootstraps and the Drawer populates

Alternatively, set `VITE_BASE_URL` to your backend URL and set the `VITE_AUTH_TOKEN` to a pre-encoded Basic Auth string for zero-config dev workflow.

---

## 8. Build for production

```bash
npm run build       # Output: dist/
npm run preview     # Serve dist/ locally to verify
```

The `Dockerfile` performs a multi-stage build: `node:22-alpine` (build) → `nginx:alpine` (serve).

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```
