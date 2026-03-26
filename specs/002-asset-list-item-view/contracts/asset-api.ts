// CONTRACT: src/api/assets.ts
// Asset API module — all network calls for the Asset List & Item View feature.
// This file is a TypeScript interface contract, not the implementation.
// All functions use the Axios client from configStore via getClient() (established in Feature 001).

import type {
  AssetSchema,
  AssetRecord,
  AssetHistoryEntry,
  AssetHistoryResult,
  SearchQuery,
  PrivateSearchQuery,
  SearchResult,
  ReadAssetRequest,
  ReadAssetHistoryRequest,
  DeleteAssetRequest,
} from '../api/types/asset';

// ── Schema ────────────────────────────────────────────────────────────────────

/**
 * Fetch the full schema for a single asset type.
 *
 * Endpoint: POST /api/query/getSchema/
 * Body:     { assetType: assetTag }
 * Response: AssetSchema
 *
 * Callers MUST check globalStore.schemaCache before calling this function.
 * Direct callers should prefer globalStore.fetchAssetSchema() which handles
 * caching automatically (see global-store-patch.ts).
 */
export declare function getAssetSchema(assetTag: string): Promise<AssetSchema>;

// ── List (paginated search) ───────────────────────────────────────────────────

/**
 * Paginated search for all assets of a given type.
 *
 * Public collection:
 *   Endpoint: POST /api/query/search
 *   Body:     SearchQuery  (limit: 11, bookmark: '' | next_cursor)
 *
 * Private collection (readers.length > 0):
 *   Endpoint: POST /api/query/search
 *   Body:     PrivateSearchQuery  (collection in body, no limit/bookmark)
 *
 * Response: SearchResult { result: AssetRecord[], metadata: { bookmark, fetchedRecordsCount } }
 *
 * Pagination convention (public):
 *   - If result.length === 11 → next page exists; strip 11th element; pass metadata.bookmark next call.
 *   - If result.length ≤ 10  → final page.
 */
export declare function searchAssets(
  body: SearchQuery | PrivateSearchQuery,
): Promise<SearchResult>;

// ── Detail (single asset read) ────────────────────────────────────────────────

/**
 * Read a single asset by @key with nested references resolved.
 *
 * Public collection:
 *   Endpoint: POST /api/query/readAsset
 *   Body:     ReadAssetRequest  { key: { '@assetType', '@key' }, resolve: true }
 *
 * Private collection (readers.length > 0):
 *   Endpoint: POST /api/query/readAsset?collections=<collectionName>
 *   Body:     same ReadAssetRequest body (collection appended to URL, not body)
 *
 * Response: AssetRecord (single object, not array)
 */
export declare function readAsset(
  body: ReadAssetRequest,
  collection?: string,
): Promise<AssetRecord>;

// ── History ───────────────────────────────────────────────────────────────────

/**
 * Fetch the full ledger history for an asset.
 *
 * Endpoint: POST /api/query/readAssetHistory
 * Body:     ReadAssetHistoryRequest
 *           { key: { '@assetType', '@key', resolve: true }, resolve: true }
 * Response: AssetHistoryResult  { result: AssetHistoryEntry[] }
 *
 * Callers MUST reverse the result array before display (newest-first per FR-015).
 * Re-exported convenience type: AssetHistoryEntry = AssetRecord & { _timestamp, @lastTouchBy, isDelete? }
 */
export declare function readAssetHistory(
  body: ReadAssetHistoryRequest,
): Promise<AssetHistoryResult>;

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete an asset from the chaincode.
 *
 * Endpoint: DELETE /api/invoke/deleteAsset
 * Body:     DeleteAssetRequest  { key: { '@assetType', '@key' } }
 * Response: void (Axios resolves on 2xx; rejects on error)
 *
 * Callers MUST require explicit user confirmation (ConfirmDialog) before
 * invoking this function — window.confirm() is banned per Constitution IV.
 * On success, callers MUST refetch the current page of search results to
 * reflect the deletion (FR-009).
 */
export declare function deleteAsset(body: DeleteAssetRequest): Promise<void>;
