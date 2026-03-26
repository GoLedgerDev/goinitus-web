# Feature Specification: UI Design Overhaul — Modern MUI Theme & Shell Redesign

**Feature Branch**: `003-mui-theme-shell-redesign`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "UI Design Overhaul — Modern MUI Theme & Shell Redesign"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Design System & Dynamic Theme (Priority: P1)

A developer or operator opens the application connected to a chaincode. The application's visual style — colours on buttons, progress bars, and active states — automatically reflects the chaincode's brand colour (`orgColor`). When the connected chaincode changes and a different `orgColor` is returned, the entire colour palette updates without a page reload.

**Why this priority**: The dynamic theme is the foundation all other visual changes build upon. Without a coherent design token system, subsequent polish work on the shell and pages would be inconsistent and harder to maintain.

**Independent Test**: Can be fully tested by connecting to two chaincodes with different `orgColor` values and confirming that the primary colour changes across buttons, active nav items, and progress indicators in each case — without impacting any data-fetching or API behaviour.

**Acceptance Scenarios**:

1. **Given** the app is loaded with an `orgColor` value in `globalStore`, **When** the theme is applied, **Then** all MUI primary-colour elements (buttons, active nav highlight, loading indicators) reflect that colour.
2. **Given** `orgColor` changes in `globalStore` (e.g., user reconnects to a different chaincode), **When** the app re-renders, **Then** the new primary colour is reflected across the entire UI without a full page reload.
3. **Given** no `orgColor` is available, **When** the theme is applied, **Then** a sensible fallback colour is used and no visual error or blank screen occurs.
4. **Given** the app is rendered, **When** any heading (`h5`/`h6`) is visible, **Then** it uses the Inter typeface and appears heavier/bolder than body text.
5. **Given** any `Button` component is visible, **When** examined, **Then** its label is rendered in sentence case (no all-caps transformation) with a visible font weight.

---

### User Story 2 — Persistent Side Navigation (Priority: P2)

A user on a desktop monitor uses the application without ever needing to open a hamburger menu. The navigation sidebar is always visible and the content area begins to the right of it. On a mobile device or narrow viewport, the sidebar collapses and a hamburger icon in the header reveals it as an overlay on demand.

**Why this priority**: Persistent navigation is the second most impactful structural change. It establishes the shell layout that all pages sit within and removes a consistent friction point for desktop users who currently must open the drawer before navigating.

**Independent Test**: Can be fully tested by resizing the browser window across the desktop/mobile breakpoint and confirming the sidebar transitions between permanent and overlay modes, with the hamburger button appearing/disappearing accordingly.

**Acceptance Scenarios**:

1. **Given** the app is loaded on a desktop viewport (≥ md breakpoint), **When** the page is displayed, **Then** the navigation panel is permanently visible (240 px wide), no hamburger button is rendered in the header, and the main content begins to the right of the nav panel.
2. **Given** the app is loaded on a mobile viewport (< md breakpoint), **When** the page is displayed, **Then** the navigation panel is hidden by default and a hamburger icon is shown in the header.
3. **Given** a mobile viewport with the nav closed, **When** the user taps the hamburger icon, **Then** the nav slides in as an overlay drawer.
4. **Given** the user resizes from desktop to mobile, **When** the breakpoint is crossed, **Then** the layout transitions correctly without visual glitches or broken layouts.

---

### User Story 3 — Drawer Interior Redesign (Priority: P3)

A user opens or views the side navigation panel and immediately sees the chaincode name at the top, can identify asset and transaction categories at a glance via icons, and can see which route is currently active. A settings shortcut is available at the bottom of the panel without cluttering the top app bar.

**Why this priority**: The interior of the drawer directly affects daily usability for operators. Clear visual hierarchy between chaincode identity, nav sections, and the active page reduces cognitive load.

**Independent Test**: Can be fully tested by navigating between asset and transaction pages and verifying the active highlight moves, icons appear per item type, the brand header shows the chaincode name, and the settings item appears pinned at the bottom.

**Acceptance Scenarios**:

1. **Given** the drawer is visible, **When** examined, **Then** the chaincode name (`schema.name`) appears at the top as a visually distinct heading above the nav items.
2. **Given** the drawer is visible and nav items are rendered, **When** each item is examined, **Then** Assets use `StorageIcon`, Transactions use `SwapHorizIcon`, private/read-only assets use `LockIcon`, and unreachable assets use `BlockIcon` in a muted/greyed style.
3. **Given** the user is on a specific asset or transaction page, **When** the drawer is viewed, **Then** the corresponding nav item is highlighted with a left border in `primary.main` and a tinted background.
4. **Given** the user is on one page and clicks a different nav item, **When** the navigation occurs, **Then** the active highlight moves to the new item.
5. **Given** the drawer is visible, **When** the bottom of the panel is examined, **Then** a settings icon/button is pinned to the bottom; the top app bar shows only the chaincode name and version — no settings gear.

---

### User Story 4 — Asset List Page Polish (Priority: P4)

A user viewing an asset list page sees a clearly structured header card identifying the asset type and record count, a clean table with alternating row backgrounds, and a compact overflow menu per row instead of three always-visible icon buttons. Pagination is controlled by labelled "Previous" / "Next" buttons.

**Why this priority**: The asset list is the most frequently visited page. Reducing visual noise and standardising the layout improves operator throughput.

**Independent Test**: Can be fully tested by navigating to any asset list, verifying the header card structure, clicking the per-row overflow menu to confirm all three actions (View, Edit, Delete) are accessible, and verifying pagination buttons are labelled and disabled correctly.

**Acceptance Scenarios**:

1. **Given** an asset list page is displayed, **When** the user views the top of the page, **Then** an outlined Paper card shows the asset type label as a large heading, a secondary count line ("N records"), and the Create button right-aligned.
2. **Given** an asset list with rows, **When** the user examines a row, **Then** a single `MoreVertIcon` button replaces the three individual icon buttons; clicking it opens a menu with View, Edit, and Delete items.
3. **Given** the overflow menu is open, **When** the user selects Delete, **Then** the same confirmation dialog is triggered as before — behaviour is unchanged.
4. **Given** a multi-page asset list, **When** the user views the pagination area, **Then** labelled "← Previous" and "Next →" buttons are shown; "← Previous" is disabled on the first page and "Next →" is disabled on the last page.
5. **Given** rows are visible, **When** the table is examined, **Then** alternating row backgrounds are applied, and hovering a row shows a subtle tint.

---

### User Story 5 — Asset Detail Page Polish (Priority: P5)

A user viewing an asset detail page sees a structured header card with the asset type, its `@key` in monospace, and the QR button. Below, the properties are displayed as a two-column grid (label / value) with alternating row backgrounds. Key fields are annotated with a `KEY` chip. The ledger history accordion matches the overall card styling.

**Why this priority**: Detail pages are used during troubleshooting and auditing. A clear property grid and history makes information faster to scan.

**Independent Test**: Can be fully tested by opening any asset detail page, verifying the header card, scrolling through the property grid (two columns, alternating rows, KEY chips), and expanding the ledger history.

**Acceptance Scenarios**:

1. **Given** an asset detail page is displayed, **When** the user views the top, **Then** an outlined Paper header card shows the asset type label (`h5`), the `@key` in monospace secondary typography, and the QR `IconButton` right-aligned.
2. **Given** the property section is visible, **When** the user scans the properties, **Then** a two-column grid layout is used: left column (label, right-aligned, muted colour) and right column (formatted value).
3. **Given** a property where `isKey === true` is shown, **When** examined, **Then** a small outlined `KEY` chip in `primary` colour appears next to the label.
4. **Given** the ledger history accordion is present, **When** expanded, **Then** history entry cards use the same outlined `Paper` style and typography scale as the main property grid.
5. **Given** the user clicks the QR `IconButton`, **When** the dialog opens, **Then** behaviour is identical to the previous implementation.

---

### Edge Cases

- What happens when `orgColor` is `null`, `undefined`, or an invalid hex string? The theme must not crash; a safe fallback colour must be applied.
- What happens when `schema.name` is empty or not yet loaded? A placeholder or loading state must be shown instead of a broken heading.
- What happens when an asset list has zero records? The header card must show "0 records" and both pagination buttons must be disabled.
- What happens when there is only a single page of results? Both pagination buttons must reflect their correct disabled state.
- What happens when the overflow menu is open and the user clicks outside it? The menu must close without triggering any action.
- What happens when the window is resized rapidly across the `md` breakpoint? The layout must not break or display intermediate inconsistent states.

## Requirements *(mandatory)*

### Functional Requirements

**Theme & Design System**

- **FR-001**: The application MUST expose a `buildTheme(primaryHex: string)` function that accepts a hex colour string and returns a fully configured MUI theme.
- **FR-002**: The theme MUST apply the Inter typeface as the primary font family (loaded via Google Fonts in `index.html`).
- **FR-003**: The theme MUST configure `h5` headings at weight 700, `h6` at weight 600, and `subtitle2` at weight 600 with `0.02em` letter-spacing.
- **FR-004**: All `Button` components MUST have label text in their natural case (no uppercase transformation) with font weight 600.
- **FR-005**: The theme palette MUST use `mode: 'light'`, `background.default: '#f8f9fb'`, `background.paper: '#ffffff'`, with `primary.main` driven by the `primaryHex` argument.
- **FR-006**: The theme MUST apply a global border radius of 10.
- **FR-007**: The `MuiAppBar` component override MUST remove its box shadow and apply a subtle bottom border (`1px solid rgba(0,0,0,0.08)`).
- **FR-008**: The `MuiDataGrid` component override MUST remove the outer border and apply the global border radius of 10.
- **FR-009**: The outlined variant of `MuiPaper` MUST use a muted border colour (`rgba(0,0,0,0.08)`).
- **FR-010**: `App.tsx` MUST subscribe to `orgColor` from `globalStore` and pass it to `buildTheme`, wrapped in `useMemo` so the theme object is only re-created when `orgColor` changes.

**Persistent Side Navigation**

- **FR-011**: On viewports at or above the `md` breakpoint, the navigation panel MUST be permanently visible at 240 px wide with no hamburger button rendered in the header.
- **FR-012**: On viewports below the `md` breakpoint, the navigation panel MUST be hidden by default and triggered by a hamburger button shown in the header.
- **FR-013**: The layout MUST use a flex-based structure so the content area begins to the right of the permanent nav panel without relying on `Toolbar` offset tricks.
- **FR-014**: Breakpoint branching MUST use `useTheme` and `useMediaQuery` to select between `variant="permanent"` and `variant="temporary"` drawer modes; changes confined to `AppShell.tsx` and `Drawer/index.tsx`.

**Drawer Interior**

- **FR-015**: The drawer MUST display the chaincode name (`schema.name`) as a visually prominent heading at the top of the nav panel.
- **FR-016**: Each nav item MUST display a contextual MUI icon to the left of its label: Assets → `StorageIcon`, Transactions → `SwapHorizIcon`, private/read-only assets → `LockIcon`, unreachable assets → `BlockIcon` (muted/greyed style).
- **FR-017**: The active nav item (matching the current URL path) MUST be highlighted with a 3 px left border in `primary.main` and a tinted background at `alpha(primary.main, 0.08)`.
- **FR-018**: A settings icon control MUST be pinned to the bottom of the nav panel via `marginTop: 'auto'`.
- **FR-019**: The top app bar MUST display only the chaincode name and version; the settings gear MUST be removed from the app bar.

**Asset List Page**

- **FR-020**: The asset list page header MUST be an outlined `Paper` card containing the asset type label as `h5`, a secondary record count line, and the Create button right-aligned.
- **FR-021**: Per-row action buttons MUST be collapsed into a single `MoreVertIcon` menu `IconButton` per row that opens an MUI `Menu` with View, Edit, and Delete `MenuItem` entries.
- **FR-022**: Pagination controls MUST be labelled `Button` components ("← Previous" and "Next →"), disabled at the first and last page respectively.
- **FR-023**: Table rows MUST alternate between `#f8f9fb` and `#ffffff` backgrounds, with a hover tint of `alpha(primary.main, 0.04)`.

**Asset Detail Page**

- **FR-024**: The asset detail header MUST be an outlined `Paper` card containing the asset type label (`h5`), the `@key` in monospace secondary typography, and the QR `IconButton` right-aligned in a single full-width row.
- **FR-025**: Asset properties MUST be displayed in a two-column grid: left column (label, right-aligned, `text.secondary`) and right column (formatted value, `text.primary`).
- **FR-026**: Rows in the property grid MUST use alternating backgrounds to aid readability.
- **FR-027**: Properties where `isKey === true` MUST show a small outlined `KEY` chip in `primary` colour next to the label.
- **FR-028**: Ledger history accordion entries MUST use the same outlined `Paper` style and typography scale as the main property grid.

**Preserved Behaviour**

- **FR-029**: All existing API calls, Zustand store logic (beyond reading `orgColor`), routing, and data-fetching logic MUST remain unchanged.
- **FR-030**: The `react-qr-code` dialog, `ConfirmDialog`, `AssetHistory` data logic, and all error/empty states MUST continue to function identically after the redesign.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing navigation flows — viewing asset lists, opening detail pages, accessing transaction pages — remain fully functional after the redesign with zero regression in navigability.
- **SC-002**: The primary colour updates across buttons, active nav highlights, and progress indicators within a single render cycle when the connected chaincode's brand colour changes, with no full page reload required.
- **SC-003**: On a desktop viewport (≥ md), reaching any navigable page after login requires no drawer-open action — navigation is permanently one click away.
- **SC-004**: On any asset list page with 10+ rows, there are no longer three always-visible icon buttons per row; all three row actions remain accessible via a single overflow menu per row.
- **SC-005**: All three row actions (View, Edit, Delete) through the overflow menu produce identical outcomes to the previous direct-button implementation.
- **SC-006**: The asset detail property grid renders all properties without truncation or overflow on a standard 1280 px wide desktop viewport.
- **SC-007**: Every page in the application reflects the new visual style after the overhaul — no page retains the default out-of-the-box MUI appearance.
- **SC-008**: The application loads and renders without visible unstyled content flash caused by the theme or font loading.

## Assumptions

- The Inter font is publicly accessible and will be loaded via a Google Fonts `<link>` tag in `index.html`; no self-hosting is required.
- `globalStore` already exposes an `orgColor` field populated during the bootstrap/connect flow; this feature reads but does not modify store logic.
- `AppShell.tsx` and `Drawer/index.tsx` are the canonical locations for layout changes; no new layout wrapper files are needed.
- Breakpoint boundaries follow the default MUI breakpoint scale (`md` = 900 px); no custom breakpoints are needed.
- The `AssetTable` component is the correct place to implement row-level overflow menu and styling changes.
- The `AssetDetail` component is the correct place to implement the two-column property grid and header card changes.
- "Unreachable assets" refer to asset types from the schema that the current user cannot access — their nav items are already rendered in a disabled state and this feature preserves that behaviour.
- The settings action currently triggered from the app bar gear icon will be re-wired to the bottom-pinned nav item without changing the settings panel's implementation.
- No accessibility (WCAG) compliance audit is required for this feature — default MUI accessibility is sufficient.
- Dark mode support is explicitly out of scope; the theme is always `mode: 'light'`.
