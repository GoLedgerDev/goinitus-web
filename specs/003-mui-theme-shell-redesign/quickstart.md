# Quickstart: UI Design Overhaul — Modern MUI Theme & Shell Redesign

**Branch**: `003-mui-theme-shell-redesign` | **Date**: 2026-03-25

Minimal steps to get this feature running locally and verify each user story against a live GoFabric backend. No new npm dependencies are introduced by this feature.

---

## Prerequisites

1. **Feature 002 complete**: The asset list and detail pages must be working with data loading from a live backend (`searchAssets`, `readAsset`, etc.).
2. **GoFabric backend running**: A cc-tools-demo instance reachable at your configured server URL with at least one asset type that has stored assets.
3. **No new packages to install**: All MUI components used (`alpha`, `useMediaQuery`, icon components, `Menu`, `Chip`, etc.) are already in `@mui/material` and `@mui/icons-material` which are installed.

---

## 1. Add the Inter font (index.html)

Add the Google Fonts preconnect and stylesheet links to `<head>` in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

**Verify**: After `npm run dev`, open DevTools Network tab and confirm `fonts.googleapis.com` requests return 200. The Inter font should appear in the page's computed styles on any text element.

---

## 2. Create `src/theme.ts`

Create the `buildTheme` factory as defined in [contracts/theme.ts](contracts/theme.ts) and [data-model.md](data-model.md).

Key details:
- Use `createTheme` from `@mui/material/styles`.
- Fall back to `'#1976d2'` when `primaryHex` is null/falsy.
- Typography: include `fontFamily: '"Inter", system-ui, sans-serif'`.
- Component overrides: `MuiButton`, `MuiAppBar`, `MuiDataGrid`, `MuiPaper`.

**Verify**: In `App.tsx` (Step 3), call `buildTheme('#e63822')` (a red) and confirm buttons and the active nav item render red.

---

## 3. Update `App.tsx`

Replace the static `createTheme()` call with the dynamic theme:

```tsx
import { useMemo } from 'react';
import { buildTheme } from '@/theme';
import { useGlobalStore } from '@/store/globalStore';

// Inside App():
const orgColor = useGlobalStore((s) => s.orgColor);
const theme = useMemo(() => buildTheme(orgColor), [orgColor]);
```

Remove the old `const theme = createTheme()` line.

**Verify (User Story 1)**: Connect to a chaincode. The primary colour (buttons, active nav outline) should match the chaincode's `orgColor`. Reconnect to a different chaincode (if available) and confirm the colour updates without a page reload.

---

## 4. Update `src/layout/AppShell.tsx`

Apply the two-level flex layout and responsive drawer logic described in [research.md](research.md#r-002) and [contracts/component-patches.ts](contracts/component-patches.ts):

1. Change outer `Box` to `display: 'flex', flexDirection: 'column', minHeight: '100vh'`.
2. Add inner `Box` for `display: 'flex', flexGrow: 1, overflow: 'hidden'` wrapping `AppDrawer` and the main content.
3. Remove `<Toolbar />` spacer from the main content area.
4. Add `useMediaQuery(theme.breakpoints.up('md'))` → `isDesktop`.
5. Pass `variant={isDesktop ? 'permanent' : 'temporary'}`, `open={isDrawerOpen}`, `onClose={() => setDrawerOpen(false)}`, `onSettingsClick={() => setConfigPanelOpen(true)}` to `AppDrawer`.
6. Pass `showMenuButton={!isDesktop}` and `onMenuClick={() => setDrawerOpen(true)}` to `Header`.

**Verify (User Story 2)**:
- On desktop (≥ 900 px wide): nav panel is visible at all times, no hamburger button in header, content starts immediately to the right.
- On mobile (< 900 px wide): nav is hidden, hamburger icon is visible in the header.
- Click hamburger → nav slides in as overlay. Click backdrop → nav closes.
- Resize window across 900 px → layout transitions cleanly.

---

## 5. Update `src/components/Header/index.tsx`

Apply the changes from [contracts/component-patches.ts](contracts/component-patches.ts):

1. Accept `showMenuButton: boolean` and `onMenuClick: () => void` props.
2. Render the hamburger `IconButton` only when `showMenuButton` is true.
3. Remove the settings `SettingsIcon` `IconButton` entirely.
4. Remove the `useState` for `isSettingsOpen` and the `ServerConfigPanel` import/render.
5. Remove direct `useGlobalStore(setDrawerOpen)` coupling — use the `onMenuClick` prop instead.

**Verify**: On desktop, the header shows only the chaincode name and version. On mobile, the hamburger is present. No settings gear anywhere in the AppBar.

---

## 6. Update `src/components/Drawer/index.tsx`

Apply the changes from [contracts/component-patches.ts](contracts/component-patches.ts):

1. Accept `variant`, `open`, `onClose`, `onSettingsClick` props.
2. Add brand header at the top: `schema.name` as a `Typography` heading.
3. Replace verbose `ListSubheader` strings with compact labels ("Assets", "Private Assets", "Blocked", "Transactions").
4. Use the two-level flex layout for bottom-pinned settings (see [research.md R-007](research.md#r-007)).
5. Add a bottom-pinned settings `ListItemButton` that calls `onSettingsClick`.
6. Remove `ModalProps` when `variant='permanent'`.

**Verify (User Story 3)**: Open the nav. Top shows chaincode name. Each section has compact label. Bottom shows a Settings item. Settings item opens the config panel. On desktop, the gear from the AppBar is gone.

---

## 7. Update `src/components/Drawer/AssetNavItem.tsx` and `TxNavItem.tsx`

Apply icon and active highlight additions:

**AssetNavItem**:
1. Import `StorageIcon`, `LockIcon`, `BlockIcon` from `@mui/icons-material`.
2. Derive the icon from `asset.drawerSection` (see contracts).
3. Add `ListItemIcon` wrapping the icon.
4. Use `useLocation()` + `location.pathname.startsWith(`/${asset.tag}`)` for `isActive`.
5. Apply `borderLeft` + `bgcolor` conditional styles as per [research.md R-006](research.md#r-006).

**TxNavItem**:
1. Import `SwapHorizIcon`.
2. Add `ListItemIcon` wrapping `SwapHorizIcon`.
3. Use `useLocation()` + `location.pathname.startsWith(`/${tx.tag}/transaction`)` for `isActive`.
4. Apply same active styles.

**Verify (User Story 3)**: Navigate to an asset list page. The corresponding nav item shows a left-border highlight and tinted background. Navigate to another — highlight moves. Each item shows its icon.

---

## 8. Update `src/pages/AssetListPage.tsx`

Apply the header card and pagination state changes:

1. Replace the `Stack` header with an outlined `Paper` card containing `h5` label, record count `Typography`, and right-aligned Create `Button`.
2. Add `pageStack` state and `handlePrevPage` / update `handleNextPage` (see [data-model.md](data-model.md)).
3. Pass `hasPrevPage` and `onPrevPage` to `AssetTable`.
4. Track `totalFetched` (or derive from `rows.length` for count display).

**Record count note**: The actual total record count is not available from the CouchDB `search` API. Display the count of records on the **current page** as "Showing N records" or display the fetched count. This is acceptable for the MVP — a future feature can add a count endpoint.

**Verify (User Story 4)**: Asset list shows a Paper header with label, count, and Create button. Navigating forward and backward works correctly with "← Previous" disabled on page 1 and "Next →" disabled on the last page.

---

## 9. Update `src/components/AssetTable/AssetTable.tsx`

Apply overflow menu, row styling, and pagination button changes:

1. Add `hasPrevPage: boolean` and `onPrevPage: () => void` to props.
2. Add `menuState` local state (see [data-model.md](data-model.md)).
3. Replace the 3-icon actions column with a single `MoreVertIcon` `IconButton`.
4. Render a `Menu` + `MenuItem` list anchored to `menuState.anchorEl` below the DataGrid.
5. Add `getRowClassName` for alternating rows + `sx` rules (see [research.md R-004](research.md#r-004)).
6. Replace the `›` pagination `IconButton` with labelled `Button` components.

**Verify (User Story 4)**: Each row has one `⋮` button. Clicking it opens a menu with View / Edit / Delete. Delete still triggers the same `ConfirmDialog`. Previous/Next buttons are labelled. Alternating row colours visible. Hover shows a subtle tint.

---

## 10. Update `src/pages/AssetItemPage.tsx`

Apply the header card changes:

1. Replace the `Stack` + `Typography` header with an outlined `Paper` card.
2. Card contains: asset type label (`h5` left), `@key` in monospace secondary text (centre/left), QR `IconButton` (right-aligned).
3. Remove the standalone `Typography` key caption below the header.

**Verify (User Story 5)**: Asset detail page shows a card-style header. The `@key` renders in monospace. QR button still works identically.

---

## 11. Update `src/components/AssetDetail/AssetDetail.tsx`

Apply the two-column grid and KEY chip:

1. Replace `List` with a `Box` using `display: 'grid', gridTemplateColumns: '200px 1fr'`.
2. Left cells: prop label, `textAlign: 'right'`, `color: 'text.secondary'`, + `KEY` chip when `prop.isKey === true`.
3. Right cells: formatted value, `color: 'text.primary'`.
4. Alternating row backgrounds: every even property row gets `bgcolor: '#f8f9fb'` spanning both columns (use a wrapper Box per row or CSS `:nth-child` on the grid).
5. The KEY chip: `<Chip label="KEY" size="small" variant="outlined" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />`.

**Verify (User Story 5)**: Detail page shows a two-column layout. Key fields show a small KEY chip. Property values are aligned left. Rows alternate colours.

---

## 12. Update `src/components/AssetHistory/AssetHistory.tsx`

Sync the history card styling to the new design language:

1. Replace `Card variant="outlined"` with `Paper variant="outlined"` for each history entry.
2. Update the `Accordion` `AccordionSummary` to use `variant="subtitle2"` typography consistent with the detail page.

**Verify (User Story 5)**: Expand the Ledger History accordion. Each entry renders as an outlined Paper card matching the style of the main property grid.

---

## Final Verification

After all 12 changes:

1. Run `npm run build` — must produce zero TypeScript errors.
2. Run `npm run dev` — connect to a live backend.
3. Confirm:
   - [ ] Desktop: permanent sidebar visible, no hamburger in header
   - [ ] Mobile: hamburger visible, sidebar toggles as overlay
   - [ ] Every nav item shows an icon; active item is highlighted
   - [ ] Chaincode name in sidebar top; settings at bottom; no gear in AppBar
   - [ ] Asset list page: Paper header, overflow menus, Previous/Next buttons, alternating rows
   - [ ] Asset detail page: Paper header with monospace key, two-column grid, KEY chips
   - [ ] Ledger history: outlined Paper entry cards
   - [ ] Primary colour matches chaincode `orgColor` on buttons and active states
   - [ ] QR dialog, ConfirmDialog, error states, and empty states all work identically
