import type { InputType } from '@/api/types/schema';

// ── AssetSchema ───────────────────────────────────────────────────────────────

/**
 * Full schema for a single asset type.
 * Returned by: POST /api/query/getSchema/ with body { assetType: string }
 * Cached in: globalStore.schemaCache keyed by assetTag
 */
export interface AssetSchema {
  /** Snake-case asset type identifier — matches @assetType field in all instances */
  tag: string;
  /** Human-readable display name for the asset type */
  label: string;
  /** Ordered list of property descriptors — drives column/field order at runtime */
  props: InputType[];
  /** MSP regex patterns with write permission; null means no restriction */
  writers: string[] | null;
  /** MSP regex patterns with read permission; non-empty ⟹ private data collection; absent or null means public */
  readers?: string[] | null;
  /** Private data collection name — present when readers.length > 0 */
  collection?: string;
}

// ── AssetRecord ───────────────────────────────────────────────────────────────

/**
 * A single blockchain asset instance.
 * Returned by: POST /api/query/search (as array element) and POST /api/query/readAsset
 * All dynamic properties beyond @key and @assetType are unknown at type level;
 * narrow them to display strings via formatFieldValue only.
 */
export type AssetRecord = {
  /** Composite key string — stable identifier (e.g. "person:John") */
  '@key': string;
  /** Asset type tag — matches AssetSchema.tag */
  '@assetType': string;
} & Record<string, unknown>;

// ── AssetHistoryEntry ─────────────────────────────────────────────────────────

/**
 * A single ledger snapshot from POST /api/query/readAssetHistory.
 * The API returns entries chronological (oldest first); reverse before display.
 */
export type AssetHistoryEntry = AssetRecord & {
  /** ISO 8601 UTC timestamp of the ledger transaction that produced this state */
  _timestamp: string;
  /** MSP ID of the org that submitted this transaction */
  '@lastTouchBy': string;
  /** True when this entry records a deletion (tombstone) */
  isDelete?: boolean;
};

// ── Request / Response shapes ─────────────────────────────────────────────────

export interface AssetSearchSelector {
  '@assetType': string;
}

/** Public collection paginated search body */
export interface SearchQuery {
  query: {
    selector: AssetSearchSelector;
    limit: number;
    bookmark: string;
  };
  resolve: true;
}

/** Private collection search body — no limit/bookmark per API contract */
export interface PrivateSearchQuery {
  query: {
    selector: AssetSearchSelector;
    collection: string;
  };
  resolve: true;
}

export interface SearchResult {
  result: AssetRecord[];
  metadata: {
    fetchedRecordsCount: number;
    bookmark: string;
  };
}

export interface ReadAssetRequest {
  key: {
    '@assetType': string;
    '@key': string;
  };
  resolve: true;
}

export interface ReadAssetHistoryRequest {
  key: {
    '@assetType': string;
    '@key': string;
    resolve: true;
  };
  resolve: true;
}

export interface AssetHistoryResult {
  result: AssetHistoryEntry[];
}

export interface DeleteAssetRequest {
  key: {
    '@assetType': string;
    '@key': string;
  };
}
