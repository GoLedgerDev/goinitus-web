# Tasks: UI Design Overhaul — Modern MUI Theme & Shell Redesign

**Branch**: `003-mui-theme-shell-redesign` | **Date**: 2026-03-25  
**Input**: Design documents from `/specs/003-mui-theme-shell-redesign/`  
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅ · quickstart.md ✅

---

## Phase 1: Setup

**Purpose**: Load the Inter font so it is available before any theming work begins. No code changes; no dependencies.

- [X] T001 Add Google Fonts Inter preconnect and stylesheet links to `<head>` in `index.html` (weights 400/500/600/700, `display=swap`)

---

## Phase 2: Foundational (Blocking — must complete before all user stories)

**Purpose**: Create the `buildTheme` factory and wire it into `App.tsx`. All subsequent visual changes depend on the theme being active.

**⚠️ CRITICAL**: US1 applies the theme; US2–US5 depend on the theme being present in the tree.

- [X] T002 Create `src/theme.ts` — implement `buildTheme(primaryHex: string | null | undefined): Theme` factory per `contracts/theme.ts`; configure palette (`mode: 'light'`, `background.default: '#f8f9fb'`, `background.paper: '#ffffff'`, `primary.main` from arg with `'#1976d2'` fallback), typography (Inter font family, `h5` weight 700, `h6` weight 600, `subtitle2` weight 600 + `0.02em` letter-spacing), shape (`borderRadius: 10`), and component overrides for `MuiButton` (no text transform, weight 600), `MuiAppBar` (no box shadow, `1px solid rgba(0,0,0,0.08)` border-bottom), `MuiDataGrid` (`border: 0`, `borderRadius: 10`, `overflow: 'hidden'`), `MuiPaper` outlined variant (`borderColor: 'rgba(0,0,0,0.08)'`)

- [X] T003 Update `src/App.tsx` — replace `const theme = createTheme()` with `const orgColor = useGlobalStore((s) => s.orgColor)` + `const theme = useMemo(() => buildTheme(orgColor), [orgColor])` using `import { buildTheme } from '@/theme'`; remove unused `createTheme` import

**Checkpoint**: `npm run dev` — connect to a backend; buttons, progress bars, and active nav items must reflect the chaincode `orgColor`. Changing chaincode must update the colour without a full reload.

---

## Phase 3: User Story 1 — Design System & Dynamic Theme (Priority: P1) 🎯 MVP

**Goal**: The `buildTheme` factory and `App.tsx` wiring form the complete US1 deliverable. This phase validates them in isolation.

**Independent Test**: Open the app against two chaincodes with different `orgColor` values. Confirm all MUI primary-colour elements update automatically. Verify `h5`/`h6` headings use Inter and are bold. Verify buttons use sentence case.

- [X] T004 [US1] Verify `src/theme.ts` produces correct palette by asserting `buildTheme('#e63822').palette.primary.main === '#e63822'` and `buildTheme(null).palette.primary.main === '#1976d2'` in a short exploratory check or TypeScript type assertion (no test file required)
- [X] T005 [US1] Verify button text transform is visually `none` and weight 600 by inspecting a `<Button>` element in the running app

**Checkpoint (US1 complete)**: Dynamic theming works end-to-end. No regression in any existing functionality.

---

## Phase 4: User Story 2 — Persistent Side Navigation (Priority: P2)

**Goal**: Desktop users see a permanent 240 px sidebar with no hamburger. Mobile users see a hamburger that triggers an overlay. Achieved by refactoring `AppShell.tsx`, `Header/index.tsx`, and `Drawer/index.tsx`.

**Independent Test**: Resize browser between ≥ 900 px and < 900 px. On desktop: no hamburger, sidebar always visible, content starts right of nav. On mobile: hamburger visible, sidebar hidden, opens as overlay on click.

- [X] T006 [US2] Update `src/components/Header/index.tsx` — accept `showMenuButton: boolean` and `onMenuClick: () => void` props (per `contracts/component-patches.ts`); render hamburger `MenuIcon` `IconButton` only when `showMenuButton` is true; remove `SettingsIcon` `IconButton`, its `useState`, and `ServerConfigPanel` import/render entirely; remove direct `useGlobalStore(setDrawerOpen)` coupling — call `onMenuClick` prop instead

- [X] T007 [US2] Update `src/components/Drawer/index.tsx` — accept `variant: 'permanent' | 'temporary'`, `open: boolean`, `onClose: () => void`, `onSettingsClick: () => void` props (per `contracts/component-patches.ts`); change drawer `width` constant to `240` (from `260`); pass `variant`, `open`, `onClose` to MUI `<Drawer>`; omit `ModalProps` when `variant='permanent'`; keep existing nav list structure unchanged (icons and brand header come in US3/T012–T015)

- [X] T008 [US2] Update `src/layout/AppShell.tsx` — restructure to two-level flex layout (outer `Box`: `display: 'flex', flexDirection: 'column', minHeight: '100vh'`; inner `Box`: `display: 'flex', flexGrow: 1, overflow: 'hidden'`); switch `AppBar` to `position="sticky"` by removing `position="fixed"` from the layout concern (sticky is set inside `Header`); remove `<Toolbar />` spacer from main content `Box`; add `const isDesktop = useMediaQuery(theme.breakpoints.up('md'))` using `useTheme` + `useMediaQuery`; pass `showMenuButton={!isDesktop}` and `onMenuClick={() => setDrawerOpen(true)}` to `<Header>`; pass `variant={isDesktop ? 'permanent' : 'temporary'}`, `open={isDrawerOpen}`, `onClose={() => setDrawerOpen(false)}`, `onSettingsClick={() => setConfigPanelOpen(true)}` to `<AppDrawer>`; move settings `ServerConfigPanel` state (`isConfigPanelOpen`) ownership fully into `AppShell` (it was already here for the ConnectError path — consolidate the two `isConfigPanelOpen` states into one)

**Checkpoint (US2 complete)**: Desktop: permanent sidebar visible, no hamburger, main content right of nav, no Toolbar spacer. Mobile: hamburger visible, overlay drawer works. Resize across 900 px transitions cleanly.

---

## Phase 5: User Story 3 — Drawer Interior Redesign (Priority: P3)

**Goal**: The drawer shows the chaincode name at top, contextual icons per nav item, compact section labels, active-route highlight with left border + tinted background, and a bottom-pinned settings entry.

**Independent Test**: Navigate between asset and transaction pages — active highlight moves correctly. Each item type shows the right icon. Chaincode name appears at top. Settings item at bottom opens the config panel. Settings gear no longer in AppBar.

- [X] T009 [P] [US3] Update `src/components/Drawer/AssetNavItem.tsx` — import `StorageIcon`, `LockIcon`, `BlockIcon` from `@mui/icons-material`; derive icon from `asset.drawerSection` (`'readWrite' → StorageIcon`, `'readOnly' → LockIcon`, `'unreachable' → BlockIcon`); add `<ListItemIcon>` wrapping the derived icon; add `useLocation()` from `react-router-dom` and compute `isActive = location.pathname.startsWith(\`/${asset.tag}\`)`; apply conditional `sx` on `ListItemButton`: `borderLeft: '3px solid', borderColor: isActive ? 'primary.main' : 'transparent', bgcolor: isActive ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent'`; add `aria-current={isActive ? 'page' : undefined}`

- [X] T010 [P] [US3] Update `src/components/Drawer/TxNavItem.tsx` — import `SwapHorizIcon` from `@mui/icons-material`; add `<ListItemIcon>` wrapping `SwapHorizIcon`; add `useLocation()` and compute `isActive = location.pathname.startsWith(\`/${tx.tag}/transaction\`)`; apply same conditional `sx` on `ListItemButton` as in T009; add `aria-current={isActive ? 'page' : undefined}`

- [X] T011 [US3] Update `src/components/Drawer/index.tsx` — add brand header at top of drawer content: `const schema = useGlobalStore((s) => s.schema)` + `<Box sx={{ px: 2, py: 2.5 }}><Typography variant="subtitle2" noWrap>{schema?.name ?? '—'}</Typography></Box><Divider />`; replace `ListSubheader` strings: "Assets" (readWrite), "Private Assets" (readOnly), "Blocked Assets" (unreachable), "Transactions"; restructure inner content with two-level flex for bottom-pin settings per research R-007: outer `Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}`, nav scroll area `Box sx={{ flexGrow: 1, overflowY: 'auto' }}`, then `<Divider />` + settings `List` at bottom; add settings `ListItemButton` with `SettingsIcon`, label "Settings", `aria-label="Open settings"`, `onClick={onSettingsClick}`

**Checkpoint (US3 complete)**: Drawer shows chaincode name at top. Each nav item has icon. Active item has left-border highlight. Settings item at bottom. No settings gear in AppBar.

---

## Phase 6: User Story 4 — Asset List Page Polish (Priority: P4)

**Goal**: Asset list page has an outlined Paper header card (title + record count + Create button), per-row `MoreVertIcon` overflow menu (View/Edit/Delete), labelled Previous/Next pagination buttons, and alternating row backgrounds with hover tint.

**Independent Test**: Navigate to any asset list. Header card visible with label, count, Create button. Click `⋮` on a row → menu with View, Edit, Delete. Delete still triggers ConfirmDialog. Both pagination buttons labelled; Previous disabled on page 1, Next disabled on last page. Alternating row colours visible.

- [X] T012 [US4] Update `src/pages/AssetListPage.tsx` — replace `Stack` header with outlined `Paper` card: `<Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}><Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>{schema.label}</Typography><Typography variant="body2" color="text.secondary">{rows.length} records</Typography>{canWrite && <Button variant="contained" startIcon={<AddIcon />} onClick={...}>Create</Button>}</Paper>`; add `pageStack` state (`useState<string[]>([''])`) and rename existing `bookmark` state to `nextBookmark`; update `handleNextPage` to push `nextBookmark` onto `pageStack` before fetching; add `handlePrevPage` that pops `pageStack` and calls `fetchData(newTop, schema)`; reset `pageStack` to `['']` in the delete-confirm handler and on `assetTag` change; pass `hasPrevPage={pageStack.length > 1}` and `onPrevPage={handlePrevPage}` to `<AssetTable>`

- [X] T013 [US4] Update `src/components/AssetTable/AssetTable.tsx` — add `hasPrevPage: boolean` and `onPrevPage: () => void` to `AssetTableProps`; add `menuState: { anchorEl: HTMLElement; rowKey: string } | null` local state; replace 3-icon actions column `renderCell` with a single `<IconButton size="small" aria-label={\`Row actions for ${key}\`} aria-haspopup="true" onClick={(e) => setMenuState({ anchorEl: e.currentTarget, rowKey: key })}><MoreVertIcon fontSize="small" /></IconButton>`; render `<Menu anchorEl={menuState?.anchorEl} open={menuState !== null} onClose={() => setMenuState(null)}>` **below** the `DataGrid` (outside it) with `MenuItem` entries for View/Edit/Delete that call the respective props then `setMenuState(null)`; add `getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'}` to `DataGrid`; add `sx` rules for `'& .even-row': { bgcolor: '#f8f9fb' }`, `'& .odd-row': { bgcolor: '#ffffff' }`, `'& .MuiDataGrid-row:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) }`; replace `›` `IconButton` pagination with `<Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: 'flex-end' }}><Button size="small" disabled={!hasPrevPage || loading} onClick={onPrevPage} startIcon={<ChevronLeftIcon />}>Previous</Button><Button size="small" disabled={!hasNextPage || loading} onClick={onNextPage} endIcon={<ChevronRightIcon />}>Next</Button></Stack>`; actions column width update: always `56` (single icon button, same for read + write)

**Checkpoint (US4 complete)**: Asset list shows Paper header. Each row has single `⋮` menu. All 3 actions work. Previous/Next buttons correctly enabled/disabled. Alternating row colours visible. Hover tint visible.

---

## Phase 7: User Story 5 — Asset Detail Page Polish (Priority: P5)

**Goal**: Asset detail page has an outlined Paper header card (type label + monospace `@key` + QR button). Property display is a two-column CSS grid with alternating rows and `KEY` chips on key fields. Ledger history uses `Paper` cards instead of `Card`.

**Independent Test**: Open any asset detail page. Header card shows type label (h5), `@key` in monospace secondary colour, QR button right-aligned. Two-column property grid with alternating rows. `KEY` chip on key fields. Expand history — each entry is an outlined Paper card. QR dialog still works.

- [X] T014 [P] [US5] Update `src/components/AssetDetail/AssetDetail.tsx` — replace `<List>` with a `<Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}>` grid; for each `prop` render a two-cell row wrapped in `<Box sx={{ display: 'contents' }}>` (or use a `Box` row wrapper with `gridColumn: '1 / -1'` for alternating background); left cell: `<Box sx={{ py: 1.5, px: 2, textAlign: 'right', bgcolor: rowBg }}><Typography variant="body2" color="text.secondary">{prop.label}</Typography>{prop.isKey && <Chip label="KEY" size="small" variant="outlined" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem', verticalAlign: 'middle' }} />}</Box>`; right cell: `<Box sx={{ py: 1.5, px: 2, bgcolor: rowBg }}><Typography variant="body2">{formatFieldValue(...)}</Typography></Box>`; compute `rowBg` as `index % 2 === 0 ? '#f8f9fb' : '#ffffff'`; keep edge case for empty props list

- [X] T015 [P] [US5] Update `src/components/AssetHistory/AssetHistory.tsx` — replace `<Card variant="outlined">` with `<Paper variant="outlined">` for each history entry card; replace `<CardContent>` with `<Box sx={{ p: 2 }}>` (or keep CardContent if Paper supports it — simpler: use `sx={{ p: 2 }}`); update `AccordionSummary` `Typography` from `variant="subtitle1"` to `variant="subtitle2"` to match the detail page typography scale; remove `Card` and `CardContent` imports; add `Paper` import

- [X] T016 [US5] Update `src/pages/AssetItemPage.tsx` — replace the `<Stack>` + standalone `<Typography>` header block with a single outlined `Paper` header card: `<Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}><Box sx={{ flexGrow: 1 }}><Typography variant="h5" component="h1">{schema.label}</Typography><Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mt: 0.5 }}>{assetKey}</Typography></Box><Tooltip title="Show QR code"><IconButton aria-label="Show QR code" onClick={() => setQrOpen(true)}><QrCode2Icon /></IconButton></Tooltip></Paper>`; remove the `<Typography variant="caption">` standalone key display and the old `Stack` header with its separate QR button

**Checkpoint (US5 complete)**: Detail page shows Paper header with monospace key. Two-column property grid with alternating rows and KEY chips. History accordion entries are Paper cards. QR dialog still works identically.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: TypeScript verification, quickstart walkthrough, and final visual consistency check.

- [X] T017 [P] Run `npm run build` — must produce zero TypeScript errors across all modified files
- [X] T018 [P] Run `npm run lint` — must produce zero new lint warnings in modified files
- [ ] T019 Follow the [quickstart.md](quickstart.md) final verification checklist against a live backend — confirm all 9 acceptance checkboxes pass
- [ ] T020 Visual consistency audit — open every page in the app and confirm no page retains the default MUI blue / default typography (SC-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Setup): No dependencies — start immediately
- **Phase 2** (Foundational): Depends on Phase 1 (font loaded before theme creates its typography)
- **Phase 3** (US1): Depends on Phase 2 — T002 and T003 must be complete
- **Phase 4** (US2): Depends on Phase 2 — T002/T003 must be complete; **also depends on Phase 3** for visual validation
- **Phase 5** (US3): Depends on Phase 4 — drawer interior changes build on the persistent layout from Phase 4
- **Phase 6** (US4): Depends on Phase 3 — theme must be active for row hover tint (`alpha(primary.main, 0.04)`)
- **Phase 7** (US5): Depends on Phase 3 — theme must be active for KEY chip `primary` colour; T014 and T015 can run in parallel with each other; T016 depends on T014 (header card style established)
- **Phase 8** (Polish): Depends on all user story phases complete

### User Story Independence

| Story | Can start after | Independently testable |
|---|---|---|
| US1 (Theme) | Phase 2 complete | ✅ Theme colour changes without reload |
| US2 (Persistent nav) | Phase 3 (US1) complete | ✅ Resize test confirms permanent/overlay modes |
| US3 (Drawer interior) | Phase 4 (US2) complete | ✅ Icon + highlight + settings verify independently |
| US4 (Asset list polish) | Phase 3 (US1) complete | ✅ Overflow menu + pagination verify independently |
| US5 (Asset detail polish) | Phase 3 (US1) complete | ✅ Header card + grid + KEY chip + history verify independently |

### Parallelisable Tasks

- **T009 + T010** (AssetNavItem + TxNavItem): different files, no mutual dependency — run in parallel
- **T014 + T015** (AssetDetail + AssetHistory): different files — run in parallel
- **T017 + T018** (build + lint): independent checks — run in parallel

---

## Parallel Execution Example: US3

```
T009 ─────────────────────────────────────┐
                                           ├──▶ T011 (Drawer index — uses updated nav items)
T010 ─────────────────────────────────────┘
```

## Parallel Execution Example: US5

```
T014 (AssetDetail grid) ──────────────────┐
                                           ├──▶ T016 (AssetItemPage header — depends on AssetDetail layout)
T015 (AssetHistory Paper) ────────────────┘
                                           (T015 independent of T016 — both depend only on US1 theme)
```

---

## Implementation Strategy

**MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1) — the theme factory alone makes the app look non-default, since every MUI component picks up the Inter font, border radius, and correct palette. This is the minimum shippable increment.

**Recommended delivery order**: US1 → US2 → US3 → US4 + US5 in parallel → Polish.

US4 and US5 are independent of each other and can be worked simultaneously. US3 must follow US2 because the drawer interior changes assume the permanent/temporary variant infrastructure is in place.

**All changes are purely presentational**: data-fetching logic, API calls, routing, and Zustand store structure are untouched throughout. At any mid-sequence checkpoint, reverting a single file returns that component to its previous visual state without breaking application functionality.
