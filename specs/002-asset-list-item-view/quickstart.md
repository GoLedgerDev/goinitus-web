# Quickstart: Asset List & Item View

**Branch**: `002-asset-list-item-view` | **Date**: 2026-03-25

Minimal steps to get this feature running locally and verifiable against a live GoFabric backend.

---

## Prerequisites

1. **Feature 001 complete**: The app shell, bootstrap, Drawer, and credential form must be working. Confirm with `npm run dev` and a successful bootstrap cycle.
2. **GoFabric backend running**: A cc-tools-demo instance reachable at your configured server URL with at least one asset type that has stored assets.
3. **`react-qr-code` installed**: This package is new in this feature.

---

## 1. Install the new dependency

```bash
cd /Users/venzi/repos/goledgerdev/goinitus-web
npm install react-qr-code
```

Verify it is listed in `package.json` `dependencies`. This is the only new dependency introduced by Feature 002 (justified in research R-01).

---

## 2. Add new type definitions

Create `src/api/types/asset.ts` with the types defined in [data-model.md](data-model.md):
- `AssetSchema`
- `AssetRecord`
- `AssetHistoryEntry`, `AssetHistoryResult`
- `SearchQuery`, `PrivateSearchQuery`, `SearchResult`
- `ReadAssetRequest`, `ReadAssetHistoryRequest`
- `DeleteAssetRequest`

---

## 3. Create the asset API module

Create `src/api/assets.ts` implementing all five functions from the contract:
```
getAssetSchema  →  POST /api/query/getSchema/  { assetType }
searchAssets    →  POST /api/query/search
readAsset       →  POST /api/query/readAsset   (optional ?collections= param)
readAssetHistory→  POST /api/query/readAssetHistory
deleteAsset     →  DELETE /api/invoke/deleteAsset
```

All functions call `useConfigStore.getState().client` (same pattern as `src/api/bootstrap.ts`).

---

## 4. Add the schema cache slice to globalStore

In `src/store/globalStore.ts`, add to the `GlobalState` interface:
```ts
schemaCache: Record<string, AssetSchema>;
fetchAssetSchema: (assetTag: string) => Promise<AssetSchema>;
```

In the `create<GlobalState>()` implementation:
- Initialise `schemaCache: {}`.
- Implement `fetchAssetSchema` with the cache-check-then-fetch pattern (see [contracts/global-store-patch.ts](contracts/global-store-patch.ts)).

---

## 5. Create the utility and components

In this order (each builds on the previous):

1. `src/utils/fieldFormatters.ts` — `formatFieldValue(value, dataType, dataTypeMap)` (research R-08)
2. `src/components/ConfirmDialog/ConfirmDialog.tsx` — MUI Dialog for delete confirmation
3. `src/components/QrCodeDialog/QrCodeDialog.tsx` — MUI Dialog + `<QRCode>` from `react-qr-code`
4. `src/components/AssetDetail/AssetDetail.tsx` — schema-driven field rows
5. `src/components/AssetHistory/AssetHistory.tsx` — collapsible Accordion calling `readAssetHistory`
6. `src/components/AssetTable/AssetTable.tsx` — MUI DataGrid with runtime columns + actions

---

## 6. Create the page components

1. `src/pages/AssetListPage.tsx` — route `/:assetTag/list`
   - `useParams<{ assetTag: string }>()`
   - `useEffect` calls `fetchAssetSchema(assetTag)` then `searchAssets` with `limit: 11`
   - Renders `<AssetTable>` with `schema`, `rows`, `hasNextPage`, `onNextPage`, `onDelete`
   - Shows MUI `Skeleton` while loading

2. `src/pages/AssetItemPage.tsx` — route `/:assetTag/item/:key`
   - `useParams<{ assetTag: string; key: string }>()`
   - `useEffect` calls `fetchAssetSchema(assetTag)` then `readAsset`
   - Renders `<AssetDetail>` + `<QrCodeDialog>` + `<AssetHistory>`

---

## 7. Register the routes

In `src/App.tsx`, add inside the `<Route path="/" element={<AppShell />}>` block:

```tsx
const AssetListPage = lazy(() =>
  import('@/pages/AssetListPage').then((m) => ({ default: m.AssetListPage })),
);
const AssetItemPage = lazy(() =>
  import('@/pages/AssetItemPage').then((m) => ({ default: m.AssetItemPage })),
);

// Inside <Routes> → <Route path="/">:
<Route
  path=":assetTag/list"
  element={
    <Suspense fallback={<BootstrapLoader />}>
      <AssetListPage />
    </Suspense>
  }
/>
<Route
  path=":assetTag/item/:key"
  element={
    <Suspense fallback={<BootstrapLoader />}>
      <AssetItemPage />
    </Suspense>
  }
/>
```

---

## 8. Verify locally

```bash
npm run dev
```

Checklist:
- [ ] Type-check passes: `npx tsc --noEmit`
- [ ] Click an asset type in the Drawer → navigates to `/:assetTag/list`
- [ ] List renders with column headers matching schema `props[].label`
- [ ] Row values display in human-readable format (no raw JSON)
- [ ] Pagination: "Next" button appears when >10 results; clicking loads next page
- [ ] Private collection asset type: list loads correctly (verify in network inspector that request has `collection` field)
- [ ] Delete: clicking Delete opens the ConfirmDialog (not `window.confirm`); confirming refreshes the list
- [ ] Click "View" on a row → navigates to `/:assetTag/item/:key`
- [ ] Detail page: all schema fields rendered with labels
- [ ] QR code dialog opens and shows a scannable SVG QR code
- [ ] History accordion expands and shows historical entries newest-first
- [ ] Navigate List → Detail → back to List: zero additional schema requests in DevTools network tab

---

## 9. Run tests

```bash
npm run test
```

Key test areas to cover:
- `fieldFormatters.ts` unit tests (all dataType branches)
- `AssetTable` renders correct columns from a mock schema
- `ConfirmDialog` closes on Cancel without calling `onConfirm`
- `AssetListPage` calls `fetchAssetSchema` exactly once per mount with the same `assetTag`
- `globalStore.fetchAssetSchema` returns cached value on second call without network request

---

## Key file paths summary

| File | Status | Purpose |
|------|--------|---------|
| `src/api/types/asset.ts` | NEW | All new TypeScript types |
| `src/api/assets.ts` | NEW | Asset API functions |
| `src/utils/fieldFormatters.ts` | NEW | Field value formatting by dataType |
| `src/store/globalStore.ts` | MODIFIED | +schemaCache, +fetchAssetSchema |
| `src/pages/AssetListPage.tsx` | NEW | `/:assetTag/list` route |
| `src/pages/AssetItemPage.tsx` | NEW | `/:assetTag/item/:key` route |
| `src/components/AssetTable/AssetTable.tsx` | NEW | MUI DataGrid list |
| `src/components/AssetDetail/AssetDetail.tsx` | NEW | Detail field rows |
| `src/components/AssetHistory/AssetHistory.tsx` | NEW | Ledger history accordion |
| `src/components/QrCodeDialog/QrCodeDialog.tsx` | NEW | QR code dialog |
| `src/components/ConfirmDialog/ConfirmDialog.tsx` | NEW | Delete confirmation dialog |
| `src/App.tsx` | MODIFIED | +2 lazy routes |
