# Tasks: Asset List & Item View

**Feature**: `002-asset-list-item-view` | **Date**: 2026-03-25  
**Input**: Design documents from `/specs/002-asset-list-item-view/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅  
**Tests**: Not requested — no test tasks generated.  
**Base**: Feature 001 fully implemented (bootstrap, globalStore, configStore, AppShell, Drawer, Header, CredentialForm, ConnectError, ServerConfigPanel).

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[US1/US2/US3]**: User story this task belongs to
- Exact file paths are included in every description

---

## Phase 1: Setup

**Purpose**: Install the one new production dependency introduced by this feature.

- [X] T001 Install `react-qr-code` npm package and verify it appears in `package.json` dependencies (justified in research R-01: pure-SVG QR rendering, ~3.8 kB gzipped, zero peer deps)

**Checkpoint**: `package.json` lists `react-qr-code`; `node_modules/react-qr-code` exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions, API module, and utility function that ALL user stories depend on.  
**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Define all asset-related TypeScript interfaces in `src/api/types/asset.ts`: `AssetSchema`, `AssetRecord`, `AssetHistoryEntry`, `AssetHistoryResult`, `AssetSearchSelector`, `SearchQuery`, `PrivateSearchQuery`, `SearchResult`, `ReadAssetRequest`, `ReadAssetHistoryRequest`, `DeleteAssetRequest` (shapes from data-model.md)
- [X] T003 [P] Implement `formatFieldValue(value: unknown, dataType: string, dataTypeMap: DataTypeMap): string` in `src/utils/fieldFormatters.ts` covering all rules from research R-08: `boolean` → "Yes/No", `datetime` → `date-fns` `format(parseISO(...), 'PPpp')`, `number` → `toLocaleString()`, list types → joined with truncation, asset-ref types → `@key` display, custom dropdowns → label lookup, `null`/`undefined` → "—", default → `String(value)`
- [X] T004 Implement all five API functions in `src/api/assets.ts` using the Axios client from `useConfigStore.getState().client`: `getAssetSchema` (POST `/api/query/getSchema/`), `searchAssets` (POST `/api/query/search`, supports both `SearchQuery` and `PrivateSearchQuery`), `readAsset` (POST `/api/query/readAsset`, optional `?collections=` param for private), `readAssetHistory` (POST `/api/query/readAssetHistory`), `deleteAsset` (DELETE `/api/invoke/deleteAsset`) — all signatures per `contracts/asset-api.ts` (depends on T002)

**Checkpoint**: `npx tsc --noEmit` passes on the three new files; all exports are correctly typed with no `any`.

---

## Phase 3: User Story 1 — Schema-Driven Asset List Page (Priority: P1) 🎯 MVP

**Goal**: Operator clicks an asset type in the Drawer and sees a paginated, schema-driven MUI DataGrid with View / Create / Edit / Delete actions, empty-state, and error-state with retry.

**Independent Test**: Connect to a GoFabric backend with at least one asset type containing stored assets. Click the asset type in the Drawer → list page loads → column headers match `schema.props[].label` → rows contain real chaincode data → pagination "Next" appears when >10 results → Delete opens ConfirmDialog → cancelling leaves the list unchanged → confirming removes the asset and refreshes.

### Implementation for User Story 1

- [X] T005 [P] [US1] Create reusable `ConfirmDialog` component in `src/components/ConfirmDialog/ConfirmDialog.tsx` with props `open: boolean`, `title: string`, `message: string`, `onConfirm: () => void`, `onCancel: () => void` using MUI `Dialog` + `DialogTitle` + `DialogContent` + `DialogActions` (replaces `window.confirm()` per Constitution IV; reusable in Feature 003)
- [X] T006 [P] [US1] Create `AssetTable` component in `src/components/AssetTable/AssetTable.tsx`: generate `GridColDef[]` from `AssetSchema.props[]` at render time (`field = prop.tag`, `headerName = prop.label`, `flex: 1`, `renderCell` delegates to `formatFieldValue`); add fixed-width "Actions" column (pinned right) with `aria-label`-ed View / Edit / Delete `IconButton`s; set `paginationMode="server"`, `disableRowSelectionOnClick`; show MUI `Skeleton` while `loading` prop is true; expose props: `schema`, `rows`, `loading`, `hasNextPage`, `onNextPage`, `onView`, `onEdit`, `onDelete`, `canWrite` (depends on T002, T003, T004)
- [X] T007 [US1] Create `AssetListPage` in `src/pages/AssetListPage.tsx`: `useParams<{ assetTag: string }>()`, `useEffect` calls `getAssetSchema(assetTag)` then `searchAssets` with `limit: 11` and `bookmark: ''` (public) or `PrivateSearchQuery` when `schema.readers.length > 0`; local state: `schema`, `rows`, `hasNextPage`, `bookmark`, `isLoading`, `error`; apply limit-11 pattern (research R-03): if `result.length === 11` strip 11th row and enable Next; render `<AssetTable>` for data, MUI `Skeleton` while loading, error `Alert` with retry, empty-state `Typography` when `rows.length === 0`; inline `<ConfirmDialog>` driven by `confirmKey` state; on delete confirmed call `deleteAsset` then refetch current page; Create button visible when `checkPermission(schema.writers)` is true and navigates to `/${assetTag}/create` (stub); Edit navigates to `/${assetTag}/item/${key}/edit` (stub); View navigates to `/${assetTag}/item/${key}` (depends on T004, T005, T006)
- [X] T008 [US1] Add lazy-loaded `/:assetTag/list` route inside the existing `<Route path="/" element={<AppShell />}>` block in `src/App.tsx`: `const AssetListPage = lazy(() => import('@/pages/AssetListPage').then((m) => ({ default: m.AssetListPage })))` wrapped in `<Suspense fallback={<BootstrapLoader />}>` (depends on T007)

**Checkpoint**: US1 fully functional. TypeCheck passes. Drawer navigation reaches a working asset list with pagination, full error/empty-state handling, and delete with confirmation.

---

## Phase 4: User Story 2 — Asset Detail Page (Priority: P2)

**Goal**: Operator navigates to `/:assetTag/item/:key` and sees all schema-defined properties as labelled rows with formatted values, can open a QR code dialog, and can expand a lazy-loaded ledger history accordion.

**Independent Test**: Navigate directly to a known asset's detail URL. Verify one labelled row per schema prop with human-readable values. Click QR button → SVG QR encodes the `@key`. Expand history accordion → at least one entry shown newest-first. Navigate to a non-existent key → not-found message displayed, no crash.

### Implementation for User Story 2

- [X] T009 [P] [US2] Create `QrCodeDialog` in `src/components/QrCodeDialog/QrCodeDialog.tsx`: MUI `Dialog` containing a `<QRCode value={assetKey} />` from `react-qr-code` that renders an SVG; props: `open: boolean`, `assetKey: string`, `onClose: () => void` (depends on T001 for `react-qr-code`)
- [X] T010 [P] [US2] Create `AssetDetail` component in `src/components/AssetDetail/AssetDetail.tsx`: renders a MUI `List` of `ListItem` rows, one per `AssetSchema.props[]` entry, each showing `prop.label` and `formatFieldValue(asset[prop.tag], prop.dataType, dataTypeMap)` as formatted value; handles null/undefined values with "—"; props: `schema: AssetSchema`, `asset: AssetRecord`, `dataTypeMap: DataTypeMap` (depends on T002, T003)
- [X] T011 [P] [US2] Create `AssetHistory` component in `src/components/AssetHistory/AssetHistory.tsx`: MUI `Accordion` that on first expansion calls `readAssetHistory` and stores result in local `historyEntries` state; reverses entries (`[...entries].reverse()`) for newest-first order (FR-015); renders each entry as a MUI `Card` with `_timestamp`, `@lastTouchBy` metadata and the same field rows as `AssetDetail`; shows `CircularProgress` while loading, error `Alert` on failure; props: `assetTag: string`, `assetKey: string`, `schema: AssetSchema`, `dataTypeMap: DataTypeMap` (depends on T002, T003, T004)
- [X] T012 [US2] Create `AssetItemPage` in `src/pages/AssetItemPage.tsx`: `useParams<{ assetTag: string; key: string }>()`, `useEffect` calls `getAssetSchema(assetTag)` then `readAsset` with `resolve: true` (appends `?collections=<collection>` when `schema.readers.length > 0`); local state: `schema`, `asset`, `isLoading`, `error`, `qrOpen`; renders MUI `Skeleton` while loading; not-found check when error response status === 404; renders `<AssetDetail>` + QR icon `IconButton` with `aria-label="Show QR code"` + `<QrCodeDialog>` + `<AssetHistory>`; wraps page in existing `<ErrorBoundary>` (depends on T002, T003, T004, T009, T010, T011)
- [X] T013 [US2] Add lazy-loaded `/:assetTag/item/:key` route inside the existing `<Route path="/" element={<AppShell />}>` block in `src/App.tsx`: `const AssetItemPage = lazy(() => import('@/pages/AssetItemPage').then((m) => ({ default: m.AssetItemPage })))` wrapped in `<Suspense fallback={<BootstrapLoader />}>` (depends on T012)

**Checkpoint**: US2 fully functional independently. Navigate via URL to any asset detail. QR dialog works. History accordion lazy-loads. Not-found URL shows error message.

---

## Phase 5: User Story 3 — Per-Asset Schema Cache (Priority: P3)

**Goal**: After the first navigation to any asset type's list or detail page, the schema for that type is served from an in-memory Zustand cache for all subsequent navigations within the session — zero redundant `POST /api/query/getSchema/` calls.

**Independent Test**: Open DevTools Network panel. Navigate list → detail → list for the same asset type. Confirm exactly one `POST /api/query/getSchema/` call per asset type across all navigations. Full page reload → cache clears → one new fetch on next navigation.

### Implementation for User Story 3

- [X] T014 [US3] Add schema cache slice to `src/store/globalStore.ts`: extend `GlobalState` interface with `schemaCache: Record<string, AssetSchema>` and `fetchAssetSchema: (assetTag: string) => Promise<AssetSchema>`; initialise `schemaCache: {}` in store state; implement `fetchAssetSchema` as per `contracts/global-store-patch.ts` — check `get().schemaCache[assetTag]` first (cache hit: return immediately), on miss call `getAssetSchema(assetTag)` from `src/api/assets.ts`, on success merge with `set(s => ({ schemaCache: { ...s.schemaCache, [assetTag]: result } }))` and return result, on error throw (callers handle display); import `AssetSchema` from `src/api/types/asset.ts` and `getAssetSchema` from `src/api/assets.ts` (depends on T002, T004)
- [X] T015 [P] [US3] Update `src/pages/AssetListPage.tsx` to replace the direct `getAssetSchema(assetTag)` call with `const fetchAssetSchema = useGlobalStore(s => s.fetchAssetSchema)` and call `fetchAssetSchema(assetTag)` inside `useEffect`; remove the direct import of `getAssetSchema` from `src/api/assets.ts` (depends on T014)
- [X] T016 [P] [US3] Update `src/pages/AssetItemPage.tsx` to replace the direct `getAssetSchema(assetTag)` call with `const fetchAssetSchema = useGlobalStore(s => s.fetchAssetSchema)` and call `fetchAssetSchema(assetTag)` inside `useEffect`; remove the direct import of `getAssetSchema` from `src/api/assets.ts` (depends on T014)

**Checkpoint**: US3 complete. Network inspector confirms single schema fetch per asset type per session. Schema served from cache on list↔detail navigation. Full reload clears cache.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: TypeScript compliance, accessibility verification, and end-to-end quickstart validation.

- [X] T017 [P] Run `npx tsc --noEmit` from the repo root and confirm zero errors across all new and modified files (`src/api/types/asset.ts`, `src/api/assets.ts`, `src/utils/fieldFormatters.ts`, `src/store/globalStore.ts`, `src/components/ConfirmDialog/ConfirmDialog.tsx`, `src/components/AssetTable/AssetTable.tsx`, `src/components/AssetDetail/AssetDetail.tsx`, `src/components/AssetHistory/AssetHistory.tsx`, `src/components/QrCodeDialog/QrCodeDialog.tsx`, `src/pages/AssetListPage.tsx`, `src/pages/AssetItemPage.tsx`, `src/App.tsx`)
- [X] T018 [P] Verify all icon-only action buttons across `src/components/AssetTable/AssetTable.tsx` (View, Edit, Delete) and `src/pages/AssetItemPage.tsx` (QR code button) carry explicit `aria-label` attributes per Constitution VI
- [X] T019 Execute the full quickstart.md manual checklist against a live GoFabric backend: Drawer navigation → list renders with schema-derived columns; pagination Next/Prev; private collection request includes `collection` field; Delete opens ConfirmDialog (not `window.confirm`); detail page all fields labelled; QR scannable; history newest-first; List→Detail→List produces zero extra schema fetches in DevTools; not-found URL shows error not blank screen

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └─► Phase 2 (Foundational)  ← BLOCKS all user stories
        ├─► Phase 3 (US1) ─────► Final Phase
        ├─► Phase 4 (US2) ─────► Final Phase
        └─► Phase 5 (US3) ─────► Final Phase
```

### Task-Level DAG

```
T001
  └─► T002[P] ─┬─► T004 ─┬─► T005[P][US1]
      T003[P] ──┘          ├─► T006[P][US1]
                            │     └─► T007[US1] ─► T008[US1]
                            ├─► T009[P][US2]
                            ├─► T010[P][US2]
                            ├─► T011[P][US2]
                            │     └─► T012[US2] ─► T013[US2]
                            └─► T014[US3] ─┬─► T015[P][US3]
                                            └─► T016[P][US3]
T017[P] \ 
T018[P]  }── Final Phase (after all stories complete)
T019    /
```

### User Story Dependencies

| Story | Depends on | Can run in parallel with |
|-------|-----------|--------------------------|
| US1 (P1) | Phase 2 complete | US2, US3 |
| US2 (P2) | Phase 2 complete | US1, US3 |
| US3 (P3) | Phase 2 complete + US1 and US2 implemented (to apply updates T015, T016) | — |

### Within Each User Story

- Phase 2 completeness gates Phase 3+
- T005 and T006 within US1 are fully parallel (different files, no cross-dependency)
- T009, T010, T011 within US2 are fully parallel (different files, no cross-dependency)
- T015 and T016 within US3 are fully parallel (update different page files)
- App.tsx route task (T008 / T013) must follow its respective page task (T007 / T012)

---

## Parallel Execution Examples

### Phase 2: Foundational — Start T002 and T003 simultaneously

```
Parallel session A:  T002  →  create src/api/types/asset.ts
Parallel session B:  T003  →  create src/utils/fieldFormatters.ts
──────────────────────────────────────────────────────────────────
Both complete  →  T004    →  create src/api/assets.ts
```

### Phase 3: US1 — Start T005 and T006 simultaneously (after Phase 2)

```
Parallel session A:  T005  →  create src/components/ConfirmDialog/ConfirmDialog.tsx
Parallel session B:  T006  →  create src/components/AssetTable/AssetTable.tsx
──────────────────────────────────────────────────────────────────
Both complete  →  T007    →  create src/pages/AssetListPage.tsx
               →  T008    →  patch src/App.tsx (add /:assetTag/list)
```

### Phase 4: US2 — Start T009, T010, T011 simultaneously (after Phase 2)

```
Parallel session A:  T009  →  create src/components/QrCodeDialog/QrCodeDialog.tsx
Parallel session B:  T010  →  create src/components/AssetDetail/AssetDetail.tsx
Parallel session C:  T011  →  create src/components/AssetHistory/AssetHistory.tsx
──────────────────────────────────────────────────────────────────
All complete   →  T012    →  create src/pages/AssetItemPage.tsx
               →  T013    →  patch src/App.tsx (add /:assetTag/item/:key)
```

### Phase 5: US3 — T015 and T016 simultaneously (after T014)

```
Sequential:          T014  →  patch src/store/globalStore.ts (add schemaCache)
──────────────────────────────────────────────────────────────────
Parallel session A:  T015  →  update src/pages/AssetListPage.tsx → use fetchAssetSchema
Parallel session B:  T016  →  update src/pages/AssetItemPage.tsx → use fetchAssetSchema
```

### Multi-Story Parallel (if multiple developers)

```
After Phase 2 completes:
Developer A:  T005 → T006 → T007 → T008          (US1 full sequence)
Developer B:  T009 → T010+T011‖ → T012 → T013    (US2 full sequence)
Developer C:  waits for T007+T012, then T014 → T015+T016‖  (US3)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1**: Install `react-qr-code`
2. Complete **Phase 2**: Types + fieldFormatters + API module (CRITICAL — blocks all stories)
3. Complete **Phase 3**: ConfirmDialog + AssetTable + AssetListPage + App.tsx route
4. **STOP and VALIDATE**: Click an asset type in the Drawer → list loads with correct schema-driven columns, real data, pagination, and delete confirmation
5. Deploy / demo if ready — this is a complete, shippable increment

### Incremental Delivery

| Step | Delivers | Validatable |
|------|----------|-------------|
| Phase 1 + 2 | Shared infrastructure | Type-check passes |
| + Phase 3 | **US1 MVP**: Asset list with pagination, delete | Drawer → List → Delete |
| + Phase 4 | **US2**: Asset detail, QR, history | View → Detail → QR → History |
| + Phase 5 | **US3**: Schema cache (perf optimisation) | DevTools: single schema fetch per session |
| + Final Phase | Polish: type safety + a11y + E2E checklist | `tsc --noEmit` passes; quickstart ✅ |

### Parallel Team Strategy

With 2–3 developers, once Phase 2 is complete:

- **Developer A** → US1 (T005, T006, T007, T008)
- **Developer B** → US2 (T009, T010, T011, T012, T013)
- **Developer C** (or A/B after their story) → US3 (T014, T015, T016) and Final Phase

Each story is independently verifiable before the next begins.

---

## Notes

- `[P]` tasks touch different files and have no dependencies on incomplete tasks in the same phase
- `[US1]` / `[US2]` / `[US3]` labels map tasks to the user stories in `/specs/002-asset-list-item-view/spec.md`
- No `any` is permitted — all dynamic asset fields use `unknown` narrowed by `formatFieldValue`
- `window.confirm()` is banned — all delete confirmation goes through `ConfirmDialog` (T005)
- The schema cache (US3) is session-only: no `localStorage` writes, cleared on full page reload
- US1 and US2 initially call `getAssetSchema` directly; US3 replaces both call sites with `fetchAssetSchema` from globalStore
- Each story can be independently committed, reviewed, and deployed without breaking the others
