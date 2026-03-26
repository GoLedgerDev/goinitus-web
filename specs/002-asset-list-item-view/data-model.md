# Data Model: Asset List & Item View

**Branch**: `002-asset-list-item-view` | **Date**: 2026-03-25  
**Phase**: 1 — Design

All new types live in `src/api/types/asset.ts`. These are pure TypeScript interfaces — no runtime code. Types are consumed by Zustand store slices and page components.

---

## Entities

### AssetSchema

Returned by `POST /api/query/getSchema/` with body `{ assetType: string }`. Represents the structural definition of a single asset type. Fetched once per session per `assetTag` and stored in `globalStore.schemaCache` keyed by `assetTag` (see Zustand additions below).

```ts
// src/api/types/asset.ts
export interface AssetSchema {
  /** Snake-case asset type identifier — matches AssetListElement.tag and @assetType values */
  tag: string;
  /** Human-readable display name for the asset type */
  label: string;
  /** Ordered list of property descriptors — drives column and field order at runtime */
  props: InputType[];  // InputType is defined in src/api/types/schema.ts
  /** MSP regex patterns with write permission */
  writers: string[];
  /** MSP regex patterns with read permission; non-empty ⟹ private data collection */
  readers: string[];
  /** Private data collection name — present when readers.length > 0 */
  collection?: string;
}
```

**Validation rules**:
- `tag` is a non-empty string matching the `@assetType` field in all `AssetRecord` instances of this type.
- `props[]` may be empty (type with only implicit key fields); pages must handle this without crashing.
- `readers.length > 0` implies `collection` is present; all data queries targeting this type must include the collection identifier.

**State transitions**: Immutable once fetched; cleared only on full page reload. Cache key: `assetTag` string.

---

### AssetRecord

Returned by `POST /api/query/search` (as array element inside `result`) and `POST /api/query/readAsset` (single record). A dynamic blockchain asset instance whose property keys are determined by the schema at runtime.

```ts
// src/api/types/asset.ts
export type AssetRecord = {
  /** Composite key string — stable identifier (e.g. "person:John") */
  '@key': string;
  /** Asset type tag — matches AssetSchema.tag */
  '@assetType': string;
} & Record<string, unknown>;
```

**Field typing discipline**: All dynamic properties beyond `@key` and `@assetType` are `unknown` at the type level. They are narrowed to display strings exclusively via `formatFieldValue(value, prop.dataType, dataTypeMap)` (see research R-08). The `any` type is forbidden per Constitution Principle III.

**State transitions**: Read-only; mutations go through dedicated invoke endpoints. In this feature, only deletion is implemented (Feature 003 adds create/edit).

---

### AssetHistoryEntry

Represents a single ledger snapshot returned by `POST /api/query/readAssetHistory`. The endpoint returns `{ result: AssetHistoryEntry[] }`. Each entry is the full asset record snapshot at a specific ledger transaction, augmented with ledger metadata fields.

```ts
// src/api/types/asset.ts
export type AssetHistoryEntry = AssetRecord & {
  /** ISO 8601 UTC timestamp of the ledger transaction that produced this state */
  _timestamp: string;
  /** MSP ID of the organisation that submitted this transaction */
  '@lastTouchBy': string;
  /** True when this entry records a deletion (tombstone) */
  isDelete?: boolean;
};
```

**Ordering**: The API returns entries in chronological order (oldest first). The UI reverses the array to display newest-first per FR-015.

---

### SearchQuery / SearchResult

Request and response shapes for `POST /api/query/search`.

```ts
// src/api/types/asset.ts

export interface AssetSearchSelector {
  '@assetType': string;
  [k: string]: unknown;
}

/** Request body for public-collection asset search (with pagination) */
export interface SearchQuery {
  query: {
    selector: AssetSearchSelector;
    limit: number;   // Always 11 (limit+1 pattern; see research R-03)
    bookmark: string; // '' on first call; metadata.bookmark from previous response thereafter
  };
  resolve: true;
}

/** Request body for private-collection asset search (no pagination params) */
export interface PrivateSearchQuery {
  query: {
    selector: AssetSearchSelector;
  };
  resolve: true;
  collection: string;
}

export interface SearchResult {
  result: AssetRecord[];
  metadata: {
    fetchedRecordsCount: number;
    bookmark: string;
  };
}
```

**Pagination rules** (enforced by `AssetListPage`):
1. First call: `bookmark: ''`.
2. On response: if `result.length === 11` → next page exists; store `metadata.bookmark`; display only first 10 rows.
3. If `result.length ≤ 10` → final page; disable "Next" button.
4. Private collection: omit `limit`/`bookmark`; use `PrivateSearchQuery`; paginate `result` client-side if needed.

---

### ReadAssetRequest / ReadAssetHistoryRequest / DeleteAssetRequest

```ts
// src/api/types/asset.ts

export interface ReadAssetRequest {
  key: {
    '@assetType': string;
    '@key': string;
  };
  resolve: true;
}

/**
 * POST /api/query/readAssetHistory
 * Note: resolve appears in both key and the top-level body per ARCHITECTURE.md.
 */
export interface ReadAssetHistoryRequest {
  key: {
    '@assetType': string;
    '@key': string;
    resolve: true;
  };
  resolve: true;
}

export interface DeleteAssetRequest {
  key: {
    '@assetType': string;
    '@key': string;
  };
}

export interface AssetHistoryResult {
  result: AssetHistoryEntry[];
}
```

**Private collection reads**: When `AssetSchema.readers.length > 0`, `readAsset` is called via `POST /api/query/readAsset?collections=<collection>` — the `collection` is passed as a URL query parameter, not in the body.

---

## Zustand — GlobalStore Additions (Schema Cache Slice)

The following fields and actions are added to `GlobalState` in `src/store/globalStore.ts`. The contract definition is in `specs/002-asset-list-item-view/contracts/global-store-patch.ts`.

```ts
// Addition to GlobalState interface (src/store/globalStore.ts)

/** Per-asset-type schema cache. Keyed by assetTag. Session-only (cleared on reload). */
schemaCache: Record<string, AssetSchema>;

/**
 * Fetch the full schema for a given assetTag.
 * - On cache hit: returns immediately with no network call (FR-017).
 * - On cache miss: calls POST /api/query/getSchema/ { assetType: assetTag }.
 * - On success: stores result in schemaCache and returns it.
 * - On error: throws; callers handle error display.
 */
fetchAssetSchema: (assetTag: string) => Promise<AssetSchema>;
```

**Implementation notes**:
- `schemaCache` initialised as `{}` in the store's initial state.
- `fetchAssetSchema` must be an async function that checks `get().schemaCache[assetTag]` before fetching.
- Cache entries are never invalidated within a session (no TTL); cleared only by page reload.
- The function is called at the top of both `AssetListPage` and `AssetItemPage` inside a `useEffect`.

---

## Source Code Layout (new and modified files)

```text
src/
├── api/
│   ├── assets.ts             # NEW — getAssetSchema(), searchAssets(), readAsset(),
│   │                         #        readAssetHistory(), deleteAsset()
│   └── types/
│       └── asset.ts          # NEW — all types defined above
├── components/
│   ├── AssetTable/
│   │   └── AssetTable.tsx    # NEW — MUI DataGrid, server-side pagination, Actions column
│   ├── AssetDetail/
│   │   └── AssetDetail.tsx   # NEW — schema-driven labelled field rows (list of key+value)
│   ├── AssetHistory/
│   │   └── AssetHistory.tsx  # NEW — MUI Accordion; lazy-loads history on first expansion
│   ├── QrCodeDialog/
│   │   └── QrCodeDialog.tsx  # NEW — MUI Dialog + react-qr-code <QRCode> SVG
│   └── ConfirmDialog/
│       └── ConfirmDialog.tsx # NEW — reusable MUI Dialog for destructive action confirmation
├── pages/
│   ├── AssetListPage.tsx     # NEW — /:assetTag/list
│   └── AssetItemPage.tsx     # NEW — /:assetTag/item/:key
├── store/
│   └── globalStore.ts        # MODIFIED — add schemaCache + fetchAssetSchema
├── utils/
│   └── fieldFormatters.ts    # NEW — formatFieldValue(value, dataType, dataTypeMap)
└── App.tsx                   # MODIFIED — add two lazy-loaded nested routes
```
