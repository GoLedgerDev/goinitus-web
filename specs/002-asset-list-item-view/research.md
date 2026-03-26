# Research: Asset List & Item View

**Branch**: `002-asset-list-item-view` | **Date**: 2026-03-25  
**Phase**: 0 — Unknowns resolved before design

---

## R-01 — QR Code Library (new dependency justification)

**Decision**: Add `react-qr-code` as a new production dependency.

**Rationale**: FR-014 requires a QR code dialog on the detail page. No QR code generation capability exists in MUI v6 or any package already in the stack. `react-qr-code` is chosen over `qrcode.react` because it renders pure SVG (no canvas API required), is ~3.8 kB gzipped with zero peer deps beyond React, tree-shakes to a single component, renders crisply at all DPI levels, and is actively maintained. This satisfies Constitution Principle I (approved stack extension) with the documented justification expected in the PR description.

**Alternatives considered**:
- `qrcode.react` — heavier; uses canvas by default; its current release uses deprecated React patterns in strict mode.
- `qrcode` (headless npm package) + manual `<canvas>` — requires custom React integration wrapper; more code to own without benefit.
- Inline SVG QR computation — QR error-correction encoding is non-trivial to maintain; not worth reimplementing.

---

## R-02 — Per-Asset Schema Cache Location

**Decision**: Add a `schemaCache` slice to the existing `globalStore` Zustand store. The cache is typed as `Record<string, AssetSchema>` and keyed by `assetTag`. A single async action `fetchAssetSchema(assetTag: string): Promise<AssetSchema>` checks the cache first and issues `POST /api/query/getSchema/` with body `{ assetType: assetTag }` only on a miss. On success it merges the result into the store with `set(s => ({ schemaCache: { ...s.schemaCache, [assetTag]: result } }))`. The cache is initialised as `{}` on store creation and clears on full page reload (session-only; FR-018).

**Rationale**: Centralising the cache in `globalStore` means any page or component accesses it via `useGlobalStore(s => s.fetchAssetSchema)` without prop-drilling or duplicated fetch logic. Zustand v5's selective subscriptions ensure only components that read `schemaCache[assetTag]` re-render on a cache update — not the whole tree. FR-017 requires the cache to survive list↔detail navigation; since both pages share the same store instance, this is satisfied automatically.

**Alternatives considered**:
- React Context per-page — breaks FR-017; each navigation unmounts the page and clears context.
- React Query / SWR — constitution mandates Zustand for state; introducing a query-caching library adds a second state layer which Principle I implicitly prohibits.
- Separate `assetSchemaStore.ts` Zustand store — possible but adds a file without benefit; schema data is tightly coupled to bootstrap context (`orgMSP` for permission checks), so co-location in `globalStore` is preferable.

---

## R-03 — Pagination Strategy

**Decision**: Use cursor/bookmark pagination with `limit: 11`. The search API is called with `limit: 11`; if `result.length === 11`, a next page exists — the 11th element is stripped from display so only 10 rows render; if `result.length ≤ 10`, this is the final page and the "Next" button is disabled. The `metadata.bookmark` string from the previous response is passed as `bookmark` in the next request (`bookmark: ''` for the first call). Per-page state (`currentPage`, `bookmark[]`, `rows`, `hasNextPage`, `isLoading`, `error`) is local React state in `AssetListPage` — it is transient and page-bound, so Zustand is not warranted.

**Rationale**: This matches the legacy limit-11 pattern preserved in ARCHITECTURE.md, avoiding a protocol change. MUI X DataGrid v7's `paginationMode="server"` accepts an external `rowCount` and `paginationModel` prop, which integrate cleanly with cursor-based pagination without requiring offset/count semantics the backend does not provide.

**Special case — private data collections**: When `AssetListElement.readers.length > 0`, the search body omits `limit`/`bookmark` and adds `collection: assetSchema.collection`. The full result is paginated client-side in this case (private collections are typically small).

**Alternatives considered**:
- `limit: 10` with a server-side `hasMore` flag — GoFabric does not return such a flag; limit+1 is the standard cc-tools pattern.
- Infinite scroll / virtualised list — rejected; spec requires explicit page-by-page navigation per FR-004.
- Client-side pagination of all records — rejected; public collection lists can be arbitrarily large.

---

## R-04 — MUI X DataGrid Column Generation

**Decision**: Generate `GridColDef[]` from `AssetSchema.props` at render time inside `AssetTable`. Each `InputType` entry maps to a `GridColDef` with `field = prop.tag`, `headerName = prop.label`, `flex: 1`, and a `renderCell` that delegates to `fieldFormatters.formatFieldValue(value, prop.dataType, dataTypeMap)`. An additional "Actions" column (pinned right) contains View, Edit, Delete `IconButton` elements each with an `aria-label`. The DataGrid is set to `paginationMode="server"` and `disableRowSelectionOnClick`.

**Rationale**: Constitution Principle II mandates schema-driven columns. Constitution Principle I mandates `@mui/x-data-grid` for tables. `renderCell` provides full control over nested/list value rendering while keeping column definition declarative. `flex: 1` on all data columns and the fixed-width Actions column allow the table to fill available width correctly for any number of columns.

**Alternatives considered**:
- MUI plain `<Table>` — banned by constitution (Principle I mandates DataGrid for tables).
- Per-column component switching in JSX — replaced by the `renderCell`+`fieldFormatters` pattern which is easier to extend.

---

## R-05 — Delete Confirmation Pattern

**Decision**: Implement a reusable `ConfirmDialog` component (MUI `Dialog` + `DialogTitle` + `DialogContent` + `DialogActions`). It takes `open: boolean`, `title: string`, `message: string`, `onConfirm: () => void`, `onCancel: () => void` props. The Delete `IconButton` in the Actions column sets `confirmTarget` local state to the asset's `@key`; the `ConfirmDialog` renders with `open = confirmTarget !== null`. Only on explicit "Delete" button click inside the dialog does the `deleteAsset` API call fire.

**Rationale**: Constitution Principle IV explicitly bans `window.confirm()`. An MUI Dialog is fully keyboard-navigable (Tab to Cancel/Delete, Enter to activate, Escape to cancel), satisfying Principle VI. The reusable `ConfirmDialog` may also be used in Feature 003 (delete asset type).

**Alternatives considered**:
- `window.confirm()` — banned by constitution.
- Inline "are you sure?" row expansion — more complex; obscures the rest of the list; harder to make accessible.

---

## R-06 — React Router v7 Dynamic Routes

**Decision**: Add two `React.lazy`-loaded routes to `App.tsx`:
- `/:assetTag/list` → `<AssetListPage />`
- `/:assetTag/item/:key` → `<AssetItemPage />`

Both are nested under the existing `<Route path="/" element={<AppShell />}>` so they inherit the AppShell layout. `useParams<{ assetTag: string }>()` and `useParams<{ assetTag: string; key: string }>()` provide type-safe param access. Both pages are wrapped in `<Suspense fallback={<BootstrapLoader />}>` per Constitution Principle VI.

**Note on React version**: The user request mentioned React 18, but `package.json` shows `react: ^19.0.0`, consistent with the constitution's approved stack. All implementation targets React 19.

**Note on router version**: `react-router-dom: ^7.4.0` is installed. The `<Routes>/<Route>` data API is unchanged from v6 in non-framework mode (the project uses `BrowserRouter` via Vite's standard entrypoint). No breaking changes affect this feature.

**Alternatives considered**:
- File-based routing (Remix/React Router v7 "framework mode") — out of scope; would require restructuring `main.tsx` and the entire route tree established in Feature 001.

---

## R-07 — Ledger History Rendering

**Decision**: Render the ledger history as a collapsible MUI `Accordion` section at the bottom of `AssetItemPage`, implemented as an `AssetHistory` component. The `AssetHistory` component manages its own `historyEntries`, `loading`, and `error` local state. On the first `Accordion` expansion, it calls `readAssetHistory` and stores the result. Entries are reversed (`[...entries].reverse()`) to show newest-first per FR-015. Each expanded entry renders a `Card` containing the same field rows used by the main detail view, plus the `_timestamp` / `@lastTouchBy` ledger metadata.

**Rationale**: Lazy-loading history (on accordion expansion) defers a potentially large API call until the user explicitly requests it, minimising unnecessary requests on initial page load. No separate history route is needed per spec. Accordion is a stable MUI v6 component.

**History response format** (from ARCHITECTURE.md legacy analysis): The `readAssetHistory` endpoint returns `{ result: Array<AssetRecord & { '_timestamp': string; '@lastTouchBy': string }> }`. Each element is a full asset snapshot with ledger metadata included as `_timestamp` and `@lastTouchBy` fields. The `isDelete` field is included when the entry represents a tombstone.

**Alternatives considered**:
- Separate history route — adds navigation complexity not required by spec.
- Eager history fetch with the asset — wastes bandwidth; history may be large and is rarely viewed on every visit.
- MUI Lab `Timeline` — unstable API in v6; `Accordion` + `Card` is stable and sufficient.

---

## R-08 — Field Formatting by DataType

**Decision**: Create `src/utils/fieldFormatters.ts` exporting:
```ts
export function formatFieldValue(
  value: unknown,
  dataType: string,
  dataTypeMap: DataTypeMap,
): string
```

Format rules by `dataType`:

| Pattern | Rule |
|---------|------|
| `boolean` | `"Yes"` / `"No"` |
| `datetime` | `format(parseISO(String(value)), 'PPpp')` — `date-fns` locale-aware |
| `number` | `Number(value).toLocaleString()` |
| `[]<T>` (list) | Array joined with `", "` ; if length > 3: first 3 + `"… +N more"` |
| `<assetTag>->` (asset ref) | Display the nested object's `@key` field string |
| `[]<assetTag>->` | Array of asset refs: each mapped to `@key`, joined, truncated as above |
| Custom dataType | Check `dataTypeMap[dataType].dropDownValues`; use label if found |
| `string`, `url`, default | `String(value ?? '')` |
| `null` / `undefined` | `"—"` (em-dash) |

**Rationale**: One centralised formatter ensures SC-004 (no raw JSON visible) across both the DataGrid `renderCell` and the detail field rows. `date-fns` (`parseISO`, `format`) is already in the stack and constitution-mandated; `moment`/`dayjs` are banned.

**Alternatives considered**:
- Per-component inline switch statements — duplicated logic, brittle.
- `Intl.DateTimeFormat` directly — lacks the ISO 8601 parsing provided by `parseISO`; `date-fns` is already present.
