# Implementation Plan: Asset List & Item View

**Branch**: `002-asset-list-item-view` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-asset-list-item-view/spec.md`

## Summary

Schema-driven paginated asset list page (`/:assetTag/list`) and asset detail page (`/:assetTag/item/:key`), backed by a per-asset schema cache in Zustand. The list renders MUI X DataGrid columns derived dynamically from the schema's `props[]`, using server-side cursor pagination (limit-11 pattern). The detail page renders labelled field rows with type-aware formatting for all `InputType` data types, a QR code dialog, and a collapsible ledger history accordion. All asset API calls are collocated in a new `src/api/assets.ts` module; the per-asset schema cache is a new slice added to the existing `globalStore`.

## Technical Context

**Language/Version**: TypeScript 5.8 (`strict: true`), React 19.0  
**Primary Dependencies**: Vite 6, `@mui/material` v6, `@mui/x-data-grid` v7, Zustand v5, Axios 1.x, React Router v7, `react-qr-code` (new — justified in research R-01), `date-fns` v4  
**Storage**: Session-only in-memory Zustand — no `localStorage` or `sessionStorage` writes  
**Testing**: Vitest 3.x + React Testing Library v16  
**Target Platform**: Desktop browser (Chromium, Firefox, Safari); served by `nginx:alpine`  
**Project Type**: SPA web application  
**Performance Goals**: List renders in <3 s on LAN (SC-001); detail renders in <3 s on LAN (SC-002); zero additional schema fetches after first visit per session (SC-003)  
**Constraints**: `strict: true` — `any` forbidden; `window.confirm()` banned; no new deps without documented justification; schema-driven — no hardcoded asset type names anywhere in source  
**Scale/Scope**: Typically 10–500 assets per page; schemas carry 2–25 props; sessions last minutes to hours

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post Phase 1 design below.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Modern Stack** | ✅ PASS | All packages are on-stack. One new dep (`react-qr-code`) is added with documented justification in research R-01 — constitution permits new deps with justification in PR description / design artefacts. |
| **II. Schema-Driven UI** | ✅ PASS | DataGrid columns generated from `AssetSchema.props[]` at runtime; no field names hardcoded. Routes generated from `assetList` in globalStore. Permission visibility (`canCreate`, `writers`) derived from schema at runtime. |
| **III. Type Safety** | ✅ PASS | `AssetRecord` uses `Record<string, unknown>` at the dynamic boundary; narrowed via `formatFieldValue` before display. All API shapes typed in `src/api/types/asset.ts`. No `any`. |
| **IV. Secure by Default** | ✅ PASS | No credentials written. Delete uses MUI Dialog — `window.confirm()` not used. Error responses sanitised by existing Axios interceptor in `configStore`. |
| **V. Validated Forms** | ✅ N/A | This feature is read-only (list + detail + delete confirm). No form inputs in this feature. Create/Edit forms are Feature 003. |
| **VI. Accessible & Observable UI** | ✅ PASS | Both new pages are `React.lazy` + `Suspense` (code-split). Each page wrapped in existing `ErrorBoundary`. Icon-only action buttons carry `aria-label`. MUI `Skeleton` used for loading states in table and detail. |

**Post-Phase 1 re-check**: No violations introduced by Phase 1 design. `react-qr-code` dependency recorded in research.md. All new types defined. No hardcoded strings beyond string-literal API paths (which are stored in `src/api/constants.ts`).

## Project Structure

### Documentation (this feature)

```text
specs/002-asset-list-item-view/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── asset-api.ts     # Phase 1 output — new API functions contract
│   └── global-store-patch.ts  # Phase 1 output — globalStore additions contract
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── assets.ts             # NEW — getAssetSchema, searchAssets, readAsset,
│   │                         #        readAssetHistory, deleteAsset
│   └── types/
│       └── asset.ts          # NEW — AssetSchema, AssetRecord, AssetHistoryEntry,
│                             #        SearchQuery, SearchResult, ReadAssetRequest,
│                             #        ReadAssetHistoryRequest, DeleteAssetRequest
├── components/
│   ├── AssetTable/
│   │   └── AssetTable.tsx    # NEW — MUI DataGrid, server-side pagination, actions col
│   ├── AssetDetail/
│   │   └── AssetDetail.tsx   # NEW — schema-driven labelled field rows
│   ├── AssetHistory/
│   │   └── AssetHistory.tsx  # NEW — collapsible MUI Accordion, lazy-loads history
│   ├── QrCodeDialog/
│   │   └── QrCodeDialog.tsx  # NEW — MUI Dialog + react-qr-code SVG
│   └── ConfirmDialog/
│       └── ConfirmDialog.tsx # NEW — reusable styled MUI Dialog (replaces window.confirm)
├── pages/
│   ├── AssetListPage.tsx     # NEW — route /:assetTag/list
│   └── AssetItemPage.tsx     # NEW — route /:assetTag/item/:key
├── store/
│   └── globalStore.ts        # MODIFIED — add schemaCache + fetchAssetSchema
├── utils/
│   └── fieldFormatters.ts    # NEW — formatFieldValue(value, dataType, dataTypeMap)
└── App.tsx                   # MODIFIED — add two lazy-loaded dynamic routes
```

**Structure Decision**: Single-project SPA. Pages in `src/pages/`, reusable components in `src/components/<ComponentName>/`, API in `src/api/`, types in `src/api/types/`, utilities unchanged at `src/utils/`. Follows the conventions established in Feature 001.
