# Data Model: UI Design Overhaul — Modern MUI Theme & Shell Redesign

**Branch**: `003-mui-theme-shell-redesign` | **Date**: 2026-03-25  
**Phase**: 1 — Design

This feature introduces **no new backend types** and **no new Zustand store fields**. All changes are presentational. This document captures:

1. The new `src/theme.ts` module shape (a pure function, no class)
2. UI-local state models that live exclusively in React component state (never persisted)
3. Evolved component prop interfaces (captured as contracts — see `contracts/`)

---

## New Module: `src/theme.ts`

### `buildTheme(primaryHex)`

A pure factory function that accepts a primary colour and returns a fully configured MUI `Theme` object. It is called in `App.tsx` wrapped in `useMemo`.

```ts
// src/theme.ts
import { createTheme, type Theme } from '@mui/material/styles';

/**
 * Builds a complete MUI theme keyed on the connected chaincode's primary colour.
 * @param primaryHex - Hex colour string (e.g. '#1976d2'). Falls back to '#1976d2' if null/invalid.
 * @returns A fully configured MUI Theme.
 */
export function buildTheme(primaryHex: string | null | undefined): Theme
```

**Configured sections**:

| Section | Key settings |
|---|---|
| `palette` | `mode: 'light'`, `primary.main: primaryHex \|\| FALLBACK_COLOR`, `background.default: '#f8f9fb'`, `background.paper: '#ffffff'` |
| `typography` | `fontFamily: 'Inter, system-ui, sans-serif'`, `h5.fontWeight: 700`, `h6.fontWeight: 600`, `subtitle2.fontWeight: 600`, `subtitle2.letterSpacing: '0.02em'` |
| `shape` | `borderRadius: 10` |
| `components.MuiButton` | `styleOverrides.root: { textTransform: 'none', fontWeight: 600 }` |
| `components.MuiAppBar` | `styleOverrides.root: { boxShadow: 'none', borderBottom: '1px solid rgba(0,0,0,0.08)' }` |
| `components.MuiDataGrid` | `styleOverrides.root: { border: 0, borderRadius: 10, overflow: 'hidden' }` |
| `components.MuiPaper` | `variants: [{ props: { variant: 'outlined' }, style: { borderColor: 'rgba(0,0,0,0.08)' } }]` |

**Validation rules**:
- `primaryHex` is accepted as-is. If it is `null`, `undefined`, or an empty string, it falls back to `'#1976d2'` (MUI's default primary). No colour validation is performed — MUI's `createTheme` handles invalid values gracefully (the theme palette will compute but the colour may render incorrectly).
- The function is pure — calling it with the same `primaryHex` twice returns two different `Theme` objects by reference. The `useMemo` in `App.tsx` ensures it is only called when `orgColor` changes.

**State transitions**: Stateless — no internal state. Each call produces a new theme snapshot tied to the current `orgColor`.

---

## UI-Local State: `AssetTable` (row overflow menu)

Not stored in Zustand. Lives in `AssetTable` component only.

```ts
// Local to src/components/AssetTable/AssetTable.tsx
interface RowMenuState {
  anchorEl: HTMLElement;
  rowKey: string;
}

// useState: null = menu closed; non-null = menu open for rowKey
const [menuState, setMenuState] = useState<RowMenuState | null>(null);
```

**Lifecycle**:
- `null` → opens when user clicks `MoreVertIcon` button on any row → `setMenuState({ anchorEl, rowKey })`
- Open → closes when user clicks outside, presses Escape, or selects a menu item → `setMenuState(null)`
- Menu selection triggers the corresponding `onView` / `onEdit` / `onDelete` callback **after** `setMenuState(null)` to avoid stale closure on the key

---

## UI-Local State: `AssetListPage` (previous-page bookmark stack)

Not stored in Zustand. Lives in `AssetListPage` component only.

```ts
// Local to src/pages/AssetListPage.tsx

// Stack of input bookmarks — each entry is the bookmark SENT to the server for that page position.
// [''] means we are on page 1 (sent empty string to get first page).
// ['', 'abc123'] means we are on page 2 (sent 'abc123' to get current page).
const [pageStack, setPageStack] = useState<string[]>(['']);

// nextBookmark: the bookmark RETURNED from the most recent fetch.
// Passing this to fetchData would load the NEXT page.
// Renamed from the existing `bookmark` state for clarity.
const [nextBookmark, setNextBookmark] = useState('');
```

**Derived booleans** (not state — computed inline):
```ts
const hasPrevPage = pageStack.length > 1;         // can go back
const hasNextPage = /* from API response length */ // can go forward (unchanged from Feature 002)
```

**Transitions**:

| User action | `pageStack` transition | `fetchData` call |
|---|---|---|
| Initial load | `['']` (initial value) | `fetchData('', schema)` |
| Click "Next →" | push `nextBookmark` → `[..., nextBookmark]` | `fetchData(nextBookmark, schema)` |
| Click "← Previous" | pop → `prev.slice(0, -1)` | `fetchData(newTop, schema)` where `newTop = pageStack[pageStack.length - 2]` |
| Delete (refresh to page 1) | reset to `['']` | `fetchData('', schema)` |
| Asset tag changes | reset to `['']` | triggers normal data reload via `useEffect` |

**Invariant**: `pageStack[0]` is always `''`. The stack grows monotonically on "Next" and shrinks on "Previous". It never becomes empty.

---

## No Changes to Existing Types

The following types are **unchanged** from Feature 002:

- `AssetSchema`, `AssetRecord`, `AssetHistoryEntry` — `src/api/types/asset.ts`
- `Schema`, `AssetListElement`, `InputType` — `src/api/types/schema.ts`
- `TransactionListElement` — `src/api/types/transaction.ts`
- `DataTypeMap` — `src/api/types/dataType.ts`
- `GlobalState` in `globalStore.ts` — read-only access to `orgColor` (field already exists)
