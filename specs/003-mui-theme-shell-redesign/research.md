# Research: UI Design Overhaul — Modern MUI Theme & Shell Redesign

**Branch**: `003-mui-theme-shell-redesign` | **Date**: 2026-03-25  
**Phase**: 0 — Research

All research was resolved through direct analysis of the MUI v6 documentation, the approved stack versions, and the existing source code. No external agents were dispatched — every question was answerable from first principles or confirmed via package inspection.

---

## R-001 — `alpha()` import path in MUI v6

**Question**: Is `import { alpha } from '@mui/material/styles'` the correct path in MUI v6, and does it accept a CSS color string or only hex?

**Decision**: `import { alpha } from '@mui/material/styles'` is correct for MUI v5 and v6. It accepts any CSS color string (hex, `rgb()`, named) and returns an `rgba()` string. It also works inside `sx` prop callbacks: `(theme) => alpha(theme.palette.primary.main, 0.08)`.

**Rationale**: Confirmed as the canonical path in the MUI v6 public API. The function is re-exported from `@mui/system` internally but the `@mui/material/styles` path is stable and recommended by MUI docs.

**Alternatives considered**: `@mui/system/colorManipulator` — works but is an internal path; not recommended for direct use.

---

## R-002 — Sticky vs. fixed AppBar for mobile/desktop layout

**Question**: The spec says "no Toolbar offset tricks — use a proper flex layout". Does this mean changing `position="fixed"` to `position="sticky"`, and what is the recommended two-level flex structure?

**Decision**: Switch the AppBar to `position="sticky"` inside a column-flex container. The outer layout becomes a two-level structure:

```
Box (display: 'flex', flexDirection: 'column', minHeight: '100vh')
  └── AppBar (position="sticky", top: 0, zIndex: drawer+1)
  └── Box (display: 'flex', flexGrow: 1, overflow: 'hidden')
        └── AppDrawer (240px permanent on desktop)
        └── Box component="main" (flexGrow: 1, overflow: 'auto', p: 3)
              └── <Outlet />
```

With `position="sticky"`, the AppBar participates in the document flow. Because the outer column-flex has `minHeight: '100vh'`, main content fills the remaining height. Because `main` has `overflow: 'auto'`, the AppBar stays visible when the user scrolls main content — exactly like a fixed bar but without needing a `<Toolbar />` spacer.

**Rationale**: The `<Toolbar />` spacer in the current code is a visual hack — it adds 64 px of blank space because the fixed AppBar overlaps the document. The sticky approach is the "Application layout" pattern documented in MUI's system layout examples. It is cleaner because the positioning is expressed through the flex tree, not through a mock spacer element.

**Alternatives considered**: Keeping `position="fixed"` + using `AppBar`'s `sx={{ mb: '64px' }}` on the flex row — valid but equally hacky. Rejected.

---

## R-003 — Permanent vs. temporary Drawer: configuration differences

**Question**: When switching between `variant="permanent"` and `variant="temporary"`, which props change and which stay the same?

**Decision**: The following props differ per variant:

| Prop | `permanent` | `temporary` |
|---|---|---|
| `open` | Irrelevant (always rendered) | Controls visibility |
| `onClose` | N/A | Required for close handler |
| `ModalProps` | Not applicable | `{ keepMounted: true }` (mobile perf) |
| `elevation` | 0 (no shadow needed) | Default (shadow shows overlay depth) |

Size and `sx` styling for `MuiDrawer-paper` is identical for both variants. The `AppDrawer` component will accept a `variant` prop from `AppShell` and conditionally apply the above differences. The `open` and `onClose` props are always passed — for permanent variant they are silently ignored by MUI.

**Rationale**: Centralising variant switching in `AppShell` keeps `AppDrawer` as a controlled component. This is the pattern MUI's "Responsive drawer" official example follows.

**Alternatives considered**: Two separate components (`PermanentDrawer`, `TemporaryDrawer`) — rejected as unnecessary duplication for a simple conditional.

---

## R-004 — DataGrid alternating row backgrounds

**Question**: Does MUI DataGrid v7 support alternating row backgrounds natively, or must we use `getRowClassName` + `sx` rules?

**Decision**: Use `getRowClassName` returning `'even-row'` or `'odd-row'` based on `params.indexRelativeToCurrentPage % 2 === 0`, then target those class names in the DataGrid's `sx` prop:

```tsx
<DataGrid
  getRowClassName={(params) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'
  }
  sx={{
    '& .even-row': { bgcolor: '#f8f9fb' },
    '& .odd-row': { bgcolor: '#ffffff' },
    '& .MuiDataGrid-row:hover': {
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
    },
  }}
/>
```

`indexRelativeToCurrentPage` is always accurate even with virtual rendering because it refers to the visible row order, not the overall dataset index.

**Rationale**: DataGrid v7 has no built-in `stripedRows` prop (that feature was discussed in GitHub issues but not shipped). CSS-only approaches using `:nth-of-type` are unreliable with virtual rendering because the DOM nodes are recycled. `getRowClassName` is the stable, documented approach.

**Alternatives considered**: Pure CSS `nth-of-type` selector on DataGrid row elements — rejected due to virtual rendering DOM inconsistency.

---

## R-005 — Removing DataGrid outer border in MUI v6 theme overrides

**Question**: What is the correct `MuiDataGrid` theme override to remove the outer border and apply border radius?

**Decision**: In `buildTheme`'s `components` section:

```ts
MuiDataGrid: {
  styleOverrides: {
    root: {
      border: 0,
      borderRadius: 10,
      overflow: 'hidden', // required for border-radius to clip inner grid lines
    },
  },
},
```

The DataGrid's outer border is applied via the `root` class. Setting `border: 0` removes it. The `borderRadius` on the root clips the inner grid. Note that `overflow: 'hidden'` is needed on the root element or the corner grid lines will bleed past the radius.

**Rationale**: The `border` property on the `root` element is confirmed as the override target in the MUI DataGrid v7 customisation docs. Setting it to `0` (integer, not `'none'`) is the correct form for CSS shorthand under Emotion.

**Alternatives considered**: `border: 'none'` string — also works but `0` is more idiomatic in MUI theme overrides.

---

## R-006 — Active nav item route matching

**Question**: What is the most reliable way to detect an active route in a nav component using React Router v7?

**Decision**: Use `useLocation()` from `react-router-dom` inside each nav item component. For asset nav items, check `location.pathname.startsWith(`/${asset.tag}`)`. For transaction nav items, check `location.pathname.startsWith(`/${tx.tag}/transaction`)`.

Apply active styles conditionally:

```tsx
const isActive = location.pathname.startsWith(`/${asset.tag}`);

<ListItemButton
  sx={{
    borderLeft: '3px solid',
    borderColor: isActive ? 'primary.main' : 'transparent',
    bgcolor: isActive
      ? (theme) => alpha(theme.palette.primary.main, 0.08)
      : 'transparent',
  }}
>
```

The `borderLeft: '3px solid transparent'` for inactive items prevents layout shift (the 3 px space is always reserved; only the colour changes).

**Rationale**: `useLocation` is stable in React Router v7. The `startsWith` check (rather than exact match) ensures the highlight persists when navigating to sub-paths like `/:assetTag/item/:key`.

**Alternatives considered**: `<NavLink>` component with `isActive` — not usable inside a `ListItemButton` without additional wrapper complexity. Rejected.

---

## R-007 — Bottom-pinned settings in Drawer

**Question**: What is the correct flex layout to pin a settings item to the bottom of the Drawer panel regardless of how many nav items appear above it?

**Decision**: The drawer's inner content Box uses:

```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
  {/* Nav sections — fills remaining height */}
  <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
    {/* ... nav lists ... */}
  </Box>

  {/* Settings — always at bottom */}
  <Divider />
  <List disablePadding>
    <ListItemButton onClick={onSettingsClick} aria-label="Open settings">
      <ListItemIcon><SettingsIcon /></ListItemIcon>
      <ListItemText primary="Settings" />
    </ListItemButton>
  </List>
</Box>
```

The outer Box is `height: '100%'` (the drawer paper fills the viewport height). The inner scroll area is `flexGrow: 1, overflowY: 'auto'`. The settings list has no `flexGrow` and thus sits at the bottom when the flex column fills its height.

**Rationale**: This is the standard "sticky footer" flex pattern. It requires no absolute positioning and gracefully handles overflow on the nav list while keeping settings anchored.

**Alternatives considered**: `marginTop: 'auto'` on the settings Box — works only when the nav list is NOT scrollable (because `auto` margin absorbs remaining space only if `overflow: hidden`/`visible`). The flex-grow approach is more robust.

---

## R-008 — Previous-page pagination with CouchDB-style bookmarks

**Question**: The current pagination tracks only a single forward `bookmark`. What state model supports "← Previous" with CouchDB bookmarks?

**Decision**: Maintain a `pageStack: string[]` in `AssetListPage` alongside the existing `nextBookmark` state (renamed from `bookmark` for clarity):

```ts
const [pageStack, setPageStack] = useState<string[]>(['']); // [''] = on page 1
const [nextBookmark, setNextBookmark] = useState('');        // bookmark returned by last fetch
```

- **Loading page N**: `fetchData(pageStack[pageStack.length - 1], schema)` — uses the top of the stack.
- **Going next**: push `nextBookmark` onto stack → `setPageStack(prev => [...prev, nextBookmark])` → then call `fetchData(nextBookmark, schema)`.
- **Going prev**: pop the stack → `setPageStack(prev => prev.slice(0, -1))` → call `fetchData(newTop, schema)` where `newTop = pageStack[pageStack.length - 2]`.
- **hasPrevPage**: `pageStack.length > 1`.
- **Reset** (on delete or tag change): `setPageStack([''])`, `fetchData('', schema)`.

The stack models the navigation history as a sequence of input bookmarks. Each entry is the bookmark that was *sent* to the server to obtain the page at that stack position.

**Rationale**: CouchDB bookmarks are opaque cursors — there is no "previous" concept in the API. The only correct approach for backward pagination is to cache the sequence of input bookmarks. The stack safely supports multiple back/forward navigations.

**Alternatives considered**: Fetching the entire dataset and paginating client-side — rejected; violates the server-side pagination contract established in Feature 002 (`PAGE_LIMIT = 11`). Re-fetching from the beginning on every "previous" click — possible but wastes an API call and is jarring when returning from deep pages.

---

## R-009 — Row-level overflow menu state in DataGrid

**Question**: DataGrid `renderCell` functions are called in a virtual render context. How should per-row menu anchor state be managed without causing stale closures?

**Decision**: Store the menu anchor as a single piece of state in `AssetTable`:

```ts
const [menuState, setMenuState] = useState<{ anchorEl: HTMLElement; rowKey: string } | null>(null);
```

The `renderCell` callback sets this via `event.currentTarget`. Because all rows share the same menu (only one can be open at a time), there is no stale closure risk — the state is a single object, not one per row.

```tsx
// In actions column renderCell:
const key = params.row['@key'] as string;
return (
  <IconButton
    size="small"
    aria-label={`Row actions for ${key}`}
    aria-haspopup="true"
    onClick={(e) => setMenuState({ anchorEl: e.currentTarget, rowKey: key })}
  >
    <MoreVertIcon fontSize="small" />
  </IconButton>
);
```

The `Menu` component is rendered **outside** the DataGrid (at the bottom of the `AssetTable` return), anchored to `menuState.anchorEl`. This avoids z-index conflicts with the DataGrid's virtual scroll layer.

**Rationale**: Rendering the Menu outside the DataGrid is required because DataGrid cells have `overflow: hidden` applied during virtual rendering. Anchoring to a state object (not a ref) is idiomatic React because it triggers re-render to show/hide the menu.

**Alternatives considered**: One `useState` per row — rejected; impractical with server-side dynamic columns. `useRef` for anchor — rejected; ref changes don't trigger re-render.
