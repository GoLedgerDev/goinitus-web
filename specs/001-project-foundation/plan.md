# Implementation Plan: Project Foundation — App Shell & GoFabric Connection

**Branch**: `001-project-foundation` | **Date**: 2026-03-24 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-project-foundation/spec.md`

## Summary

Bootstrap a React 19 + TypeScript 5 SPA using Vite that, on every page load, calls the four GoFabric REST bootstrap endpoints (`getHeader`, `getSchema`, `getTx`, `getDataTypes`), stores the retrieved schema in a Zustand `globalStore`, and renders a schema-driven MUI v6 app shell — Header showing chaincode name/version + org colour, and a permission-grouped Drawer built dynamically from the asset and transaction lists. A Zustand `configStore` holds the reactive Axios instance so the server address and Basic Auth credentials can change at runtime without a page reload.

## Technical Context

**Language/Version**: TypeScript 5.x / React 19  
**Primary Dependencies**: Vite, React Router 6, MUI v6 (`@mui/material`, `@mui/icons-material`), Zustand, Axios 1.x, react-toastify v10  
**Storage**: `localStorage` — server address key `@goinitus:restServer`, auth token key `@goinitus:authToken` (Base64 Basic Auth, treated as ephemeral — cleared on logout)  
**Testing**: Vitest + @testing-library/react (Vite-native test runner)  
**Target Platform**: Desktop browser (Chrome, Firefox, Safari); Nginx static container  
**Project Type**: Web SPA  
**Performance Goals**: Full app load (Drawer populated) in <3 s with backend responding at normal latency; no duplicate bootstrap calls per page load (SC-002)  
**Constraints**: No banned packages (see Constitution §I); `strict: true` TypeScript; no `any`; no hardcoded asset/tx names  
**Scale/Scope**: Single-page app; ~8 route-level pages; connected to a single GoFabric backend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Modern Stack | ✅ PASS | React 19, TS 5, Vite, MUI v6, Zustand, Axios 1.x — all compliant; no banned packages |
| II | Schema-Driven UI | ✅ PASS | FR-006 mandates dynamic Drawer; routes generated from `assetList`/`transactionList`; no hardcoded names |
| III | Type Safety | ✅ PASS | API contracts defined in `src/api/types/`; strict mode; `unknown` for untyped data |
| IV | Secure by Default | ✅ PASS | Auth token in localStorage treated as ephemeral, cleared on logout; Axios instance created reactively via `configStore`; interceptors sanitise error responses |
| V | Validated Forms | ➖ N/A | No user-data forms in this feature (bootstrap only) |
| VI | Accessible & Observable | ✅ PASS | Loading skeleton during bootstrap; error boundary on Root; error screen on network failure/401; Drawer items have visible labels |

**Verdict**: No gate violations. Proceed to Phase 1.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-foundation/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   ├── global-store.ts
│   └── config-store.ts
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── client.ts            # Axios instance factory; reads from configStore
│   ├── bootstrap.ts         # getHeader, getSchema, getTx, getDataTypes calls
│   └── types/
│       ├── schema.ts        # Schema, AssetListElement, InputType
│       ├── transaction.ts   # TransactionListElement
│       └── dataType.ts      # DataTypeMap
│
├── store/
│   ├── globalStore.ts       # Schema, assetList, txList, dataTypeList, auth state
│   └── configStore.ts       # Server URL, auth token, reactive Axios instance
│
├── components/
│   ├── Header/
│   │   └── index.tsx        # App bar: chaincode name, org colour, menu, settings
│   └── Drawer/
│       ├── index.tsx         # MUI Drawer shell; sections from globalStore
│       ├── AssetNavItem.tsx
│       └── TxNavItem.tsx
│
├── pages/
│   └── HomePage.tsx         # Shows chaincode name + version (lazy loaded)
│
├── layout/
│   └── AppShell.tsx         # Composes Header + Drawer + <Outlet />
│
├── utils/
│   └── colorUtils.ts        # orgMSP → deterministic MUI palette colour
│
└── main.tsx                 # Vite entry; mounts <App /> with Router + Suspense
```

**Structure Decision**: Single-project web SPA. All source under `src/`. No monorepo needed at this stage. The file layout mirrors the suggested architecture in `ARCHITECTURE.md §10` while scoping strictly to what feature 001 requires.

## Complexity Tracking

> No constitution violations — section not required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
