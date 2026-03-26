import { useConfigStore } from '@/store/configStore';
import type {
  AssetSchema,
  AssetRecord,
  AssetHistoryResult,
  SearchQuery,
  PrivateSearchQuery,
  SearchResult,
  ReadAssetRequest,
  ReadAssetHistoryRequest,
  DeleteAssetRequest,
} from '@/api/types/asset';

function getClient() {
  return useConfigStore.getState().client;
}

// ── Schema ────────────────────────────────────────────────────────────────────

/**
 * Fetch the full schema for a single asset type.
 * Prefer globalStore.fetchAssetSchema() which wraps this with caching.
 */
export async function getAssetSchema(assetTag: string): Promise<AssetSchema> {
  const res = await getClient().post<AssetSchema>('/api/query/getSchema/', {
    assetType: assetTag,
  });
  return res.data;
}

// ── List ──────────────────────────────────────────────────────────────────────

/**
 * Paginated search for assets of a given type.
 * Pass SearchQuery for public collections, PrivateSearchQuery for private ones.
 */
export async function searchAssets(
  body: SearchQuery | PrivateSearchQuery,
): Promise<SearchResult> {
  const res = await getClient().post<SearchResult>('/api/query/search', body);
  return res.data;
}

// ── Detail ────────────────────────────────────────────────────────────────────

/**
 * Read a single asset by @key with nested references resolved.
 * Supply `collection` for assets in private data collections.
 */
export async function readAsset(
  body: ReadAssetRequest,
  collection?: string,
): Promise<AssetRecord> {
  const url = collection
    ? `/api/query/readAsset?collections=${encodeURIComponent(collection)}`
    : '/api/query/readAsset';
  const res = await getClient().post<AssetRecord>(url, body);
  return res.data;
}

// ── History ───────────────────────────────────────────────────────────────────

/**
 * Fetch the full ledger history for an asset.
 * Callers must reverse the result array before display (newest-first).
 */
export async function readAssetHistory(
  body: ReadAssetHistoryRequest,
): Promise<AssetHistoryResult> {
  const res = await getClient().post<AssetHistoryResult>(
    '/api/query/readAssetHistory',
    body,
  );
  return res.data;
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete an asset from the chaincode.
 * Callers must obtain confirmation before calling this function.
 */
export async function deleteAsset(body: DeleteAssetRequest): Promise<void> {
  await getClient().delete('/api/invoke/deleteAsset', { data: body });
}
