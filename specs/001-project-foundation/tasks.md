# Tasks: Project Foundation — App Shell & GoFabric Connection

**Input**: Design documents from `/specs/001-project-foundation/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[US1/US2/US3]**: User story this task belongs to
- Exact file paths included on every task

---

## Phase 1: Setup (Project Initialisation)

**Purpose**: Scaffold the Vite + React 19 + TypeScript 5 project and configure all tooling. No user-story logic yet.

- [X] T001 Initialise Vite project with `react-ts` template; install all dependencies from quickstart.md in `package.json`
- [X] T002 [P] Configure `tsconfig.json` with `strict: true`, `baseUrl: "."`, `paths: { "@/*": ["src/*"] }` per quickstart.md
- [X] T003 [P] Configure `vite.config.ts` with `@vitejs/plugin-react` and path alias `@` → `src/`
- [X] T004 [P] Configure Vitest in `vite.config.ts`: jsdom environment, setupFiles with @testing-library/jest-dom
- [X] T005 [P] Add `.env.local` and `.env.example` with `VITE_BASE_URL` variable; add `.env.local` to `.gitignore`
- [X] T006 [P] Set up ESLint with `@typescript-eslint` and `eslint-plugin-react-hooks` in `eslint.config.js`
- [X] T007 [P] Create `Dockerfile` multi-stage build: `node:22-alpine` (build) → `nginx:alpine` (serve) with `nginx.conf` SPA fallback

**Checkpoint**: `npm run dev` starts; `npm run build` produces `dist/`; `npx tsc --noEmit` exits 0.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on — API types, stores, Axios client, constants. No user story can begin until this phase is complete.

**⚠️ CRITICAL**: These tasks block Phase 3, 4, and 5.

- [X] T008 [P] Create `src/api/constants.ts` with `AUTH_TOKEN_KEY`, `SERVER_URL_KEY`, and `AUTH_SENTINEL` string constants from research R-03
- [X] T009 [P] Create `src/api/types/schema.ts` with `Schema`, `AssetListElement`, `LabelKey`, and `InputType` interfaces from data-model.md
- [X] T010 [P] Create `src/api/types/transaction.ts` with `TransactionListElement` interface from data-model.md
- [X] T011 [P] Create `src/api/types/dataType.ts` with `DataTypeDefinition` and `DataTypeMap` types from data-model.md
- [X] T012 Create `src/store/configStore.ts`: Zustand store with `serverUrl`, `authToken`, reactive `client` (AxiosInstance), `setServerUrl`, `setAuthToken`, `clearAuthToken`, `isConfigured`; persist `serverUrl` + `authToken` to localStorage; error interceptor sanitises responses before logging (research R-01, R-03, contract config-store.ts)
- [X] T013 Create `src/api/bootstrap.ts`: typed functions `getHeader()`, `getSchema()`, `getTx()`, `getDataTypes()` reading `configStore.client`; each returns the correct typed response from `src/api/types/`
- [X] T014 Create `src/utils/colorUtils.ts`: `orgColor(msp: string): string` using djb2 hash + 8-colour palette from research R-02
- [X] T015 Create `src/store/globalStore.ts`: Zustand store matching contract `global-store.ts` — `bootstrapStatus`, `schema`, `orgColor`, `assetList` (enriched with `drawerSection`), `transactionList`, `metaTransactionList`, `dataTypeMap`, `isDrawerOpen`, `bootstrap()`, `retry()`, `setDrawerOpen()`, `checkPermission()`, `checkUnreachablePermission()`, `dataTypeBase()`, `getDropDownValues()` (research R-04, R-05, R-06)

**Checkpoint**: `npx tsc --noEmit` passes; `configStore` and `globalStore` can be imported and used in tests.

---

## Phase 3: User Story 1 — App Loads and Connects to a GoFabric Backend (Priority: P1) 🎯 MVP

**Goal**: App contacts GoFabric on every page load, shows chaincode name in the Header, and exposes the populated Drawer. Handles network errors and 401 with actionable recovery UI.

**Independent Test**: Point the app at a running GoFabric REST server — the header shows the chaincode name/version and the Drawer has entries. Kill the server → error screen appears with Retry. Return incorrect credentials → credential form appears.

### Implementation for User Story 1

- [X] T016 [US1] Create `src/components/ErrorBoundary/ErrorBoundary.tsx`: React class component error boundary that renders a generic "Something went wrong" recovery UI instead of a blank screen (Constitution §VI)
- [X] T017 [US1] Create `src/components/ConnectError/ConnectError.tsx`: MUI-styled error screen shown on bootstrap network failure; accepts `onRetry` and `onConfigure` props (FR-005, SC-005); all text in `aria-label` or visible labels
- [X] T018 [US1] Create `src/components/CredentialForm/CredentialForm.tsx`: MUI dialog containing a React Hook Form + Zod-validated username/password form; calls `configStore.setAuthToken` then `globalStore.retry()` on submit; Submit disabled while invalid or submitting (FR-004, Constitution §V)
- [X] T019 [US1] Create `src/components/BootstrapLoader/BootstrapLoader.tsx`: MUI `Skeleton` fullscreen loading state shown while `bootstrapStatus === 'loading'` (Constitution §VI)
- [X] T020 [US1] Create `src/layout/AppShell.tsx`: mounts `Header` + `Drawer` + React Router `<Outlet />`; contains the single `useEffect(() => { globalStore.bootstrap() }, [])` with `bootstrapStatus` guard (research R-04, FR-001); renders `BootstrapLoader`, `ConnectError`, or `CredentialForm` based on `bootstrapStatus` and 401 state; wrapped in `ErrorBoundary`
- [X] T021 [US1] Create `src/main.tsx`: Vite entry point; mounts `<App />` wrapped in `BrowserRouter` + `Suspense fallback={<BootstrapLoader />}` + `<ToastContainer />`
- [X] T022 [US1] Create `src/App.tsx`: renders `<AppShell />` inside React Router routes; applies MUI `ThemeProvider` with default theme

**Checkpoint**: Open app pointed at live GoFabric server → Drawer populates. Kill server → error screen shows. Enter wrong credentials → credential form shows. No blank screen in any case.

---

## Phase 4: User Story 2 — Schema-Driven Navigation Drawer (Priority: P2)

**Goal**: The Drawer reads `globalStore.assetList` and `globalStore.transactionList` and renders three permission-grouped asset sections plus a transactions section — entirely from schema data, no hardcoded names.

**Independent Test**: Connect to two different GoFabric chaincodes → Drawer shows different entries for each with correct permission grouping. No source change needed between tests.

### Implementation for User Story 2

- [X] T023 [US2] Create `src/components/Drawer/AssetNavItem.tsx`: MUI `ListItemButton` for a single asset type; shows `asset.label`; `aria-label={asset.label}`; disabled styling when `drawerSection === 'unreachable'`; navigates to `/${asset.tag}/list` on click (FR-006, FR-007)
- [X] T024 [US2] Create `src/components/Drawer/TxNavItem.tsx`: MUI `ListItemButton` for a single transaction; shows `tx.label`; `aria-label={tx.label}`; navigates to `/${tx.tag}/transaction` on click (FR-006, FR-008)
- [X] T025 [US2] Create `src/components/Drawer/index.tsx`: MUI `Drawer` shell; reads `globalStore.assetList` and `globalStore.transactionList`; renders three `List` sections — **Assets (Read/Write)**, **Assets (Read Only)**, **Assets (Unreachable)** — each filtering `assetList` by `drawerSection`; renders a **Transactions** section for `transactionList` (all have `metaTx === false`); sections with no entries are not rendered (research R-06, FR-006, FR-007, FR-008)
- [X] T026 [US2] Create `src/components/Header/index.tsx`: MUI `AppBar` with `sx={{ bgcolor: globalStore.orgColor ?? 'primary.main' }}`; hamburger `IconButton` with `aria-label="open drawer"` toggling `globalStore.setDrawerOpen`; shows `globalStore.schema?.name` and `globalStore.schema?.version`; settings gear `IconButton` with `aria-label="open settings"` (FR-009, FR-012, Constitution §VI)
- [X] T027 [US2] Create `src/pages/HomePage.tsx`: lazy-loaded MUI `Typography` page showing chaincode name and version from `globalStore.schema`; wrapped in `ErrorBoundary` (FR-009, Constitution §VI)
- [X] T028 [US2] Update `src/App.tsx` to add React Router `<Route path="/" element={<HomePage />}>` using `React.lazy` + `Suspense` (Constitution §VI)

**Checkpoint**: Drawer renders asset and transaction sections from live schema. Switching to a different GoFabric backend (via settings) updates the Drawer contents with no code change.

---

## Phase 5: User Story 3 — Runtime Server Configuration (Priority: P3)

**Goal**: Settings panel lets the operator change the server URL and credentials at runtime; changes persist across reloads; Drawer re-populates from the new backend without a page reload.

**Independent Test**: App connected to server A → open settings → enter server B address + credentials → Drawer reflects server B's schema immediately, no page reload required. Reload page → server B address still used.

### Implementation for User Story 3

- [X] T029 [US3] Create `src/components/ServerConfigPanel/ServerConfigPanel.tsx`: MUI `Drawer` (right-anchored) or `Dialog` containing a React Hook Form + Zod-validated form with fields for `serverUrl` (required, must start with `http://` or `https://`) and `username` + `password`; on submit calls `configStore.setServerUrl()`, `configStore.setAuthToken()`, then `globalStore.retry()`; opens when Header settings gear is clicked; closes on success or cancel (FR-010, FR-003, US3 AC1, AC2)
- [X] T030 [US3] Wire `ServerConfigPanel` open state to Header settings gear `IconButton` in `src/components/Header/index.tsx`: add `isSettingsOpen` local state; pass `onClose` prop to `ServerConfigPanel`; panel submission triggers `globalStore.retry()` which replays bootstrap with new client — no page reload (US3 AC1, AC4, FR-010)
- [X] T031 [US3] Update `src/store/configStore.ts` to read `VITE_BASE_URL` from `import.meta.env` as the initial `serverUrl` default when localStorage has no persisted value (US3 AC2 — persisted address used on reload; falls back to build-time default when none stored)

**Checkpoint**: Settings panel opens via gear icon. Submit new server address → Drawer repopulates. Reload → new address still active. Entering unreachable address → shows ConnectError, previous config preserved.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end wiring, edge cases, and constitution compliance verification.

- [X] T032 [P] Add `react-toastify` `<ToastContainer />` to `src/main.tsx` and implement non-blocking toast in `globalStore.bootstrap()` when `getDataTypes()` fails (FR-011)
- [X] T033 [P] Generate React Router routes dynamically from `globalStore.assetList` and `globalStore.transactionList` in `src/App.tsx`; replace any static route placeholders (Constitution §II — no hardcoded route paths)
- [X] T034 [P] Ensure all `IconButton` components in `Header` and `Drawer` have `aria-label` attributes; all interactive elements are keyboard-navigable (Constitution §VI accessibility spot-check)
- [X] T035 Run `npx tsc --noEmit` and fix all type errors; verify no `any` is used without explicit eslint-disable annotation (Constitution §III type gate)
- [X] T036 Verify no banned packages in `node_modules` — run `npm ls moment @material-ui/core mobx react-scripts` and confirm all return "not found" (Constitution §I)
- [X] T037 [P] Verify `quickstart.md` steps work end-to-end: scaffold → install → dev server → backend connect → Drawer populates

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks Phases 3, 4, 5**
- **Phase 3 (US1)**: Depends on Phase 2 — can start as soon as Foundational is done
- **Phase 4 (US2)**: Depends on Phase 2 — can start in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 — can start in parallel; integrates with Phase 3+4 components
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5 all complete

### User Story Dependencies

| Story | Blocked By | Can Parallel With |
|-------|-----------|-------------------|
| US1 (P1) | Phase 2 complete | US2, US3 |
| US2 (P2) | Phase 2 complete | US1, US3 |
| US3 (P3) | Phase 2 complete; uses `Header` from US2 (T026) | US1 (T030 wires into T026) |

### Within Each Phase

- All `[P]`-marked tasks in Phase 1 can run in parallel after T001
- All `[P]`-marked tasks in Phase 2 (T008–T011) can run in parallel before T012
- T012 must complete before T013 (bootstrap.ts reads configStore.client)
- T013, T014 can run in parallel; both must complete before T015
- T015 must complete before any Phase 3 task

---

## Parallel Execution Examples

### Phase 2 parallelisation

```
T001 → T002 T003 T004 T005 T006 T007  (all parallel after scaffold)
     → T008 T009 T010 T011            (all parallel, type files)
     → T012                           (configStore — needs nothing)
     → T013 T014                      (parallel after T012)
     → T015                           (globalStore — needs T013, T014)
```

### Phase 3 + 4 parallelisation (two developers)

```
Developer A (US1): T016 → T017 T018 T019 → T020 → T021 → T022
Developer B (US2): T023 T024 → T025 → T026 → T027 → T028
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**critical gate**)
3. Complete Phase 3: User Story 1 (T016–T022)
4. **STOP and VALIDATE**: App loads, shows chaincode name, Drawer populates, error recovery works
5. Demo to stakeholders before building US2/US3

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Working app shell with bootstrap (**MVP**)
3. Phase 4 (US2) → Full schema-driven Drawer
4. Phase 5 (US3) → Runtime server configuration
5. Phase 6 → Polish + compliance

---

## Format Validation

All tasks follow: `- [ ] T### [P?] [US?] Description with file path`

- ✅ Checkbox on every task
- ✅ Sequential IDs (T001–T037)
- ✅ `[P]` only on tasks with no incomplete-task dependencies in different files
- ✅ `[US1]`/`[US2]`/`[US3]` on all user-story phase tasks
- ✅ No story label on Setup (Phase 1), Foundational (Phase 2), or Polish (Phase 6) tasks
- ✅ Every task includes a concrete file path
