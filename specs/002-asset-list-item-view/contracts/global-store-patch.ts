// CONTRACT: src/store/globalStore.ts  (additions for Feature 002)
// This file documents only the new fields and actions added to GlobalState.
// It does not reproduce the full Feature 001 contract — see contracts/global-store.ts
// in specs/001-project-foundation/contracts/ for the base interface.

import type { AssetSchema } from '../api/types/asset';

// ── Schema Cache Slice ────────────────────────────────────────────────────────

/**
 * Additions to GlobalState for per-asset schema caching (FR-017, FR-018).
 * Merge these into the existing GlobalState interface in src/store/globalStore.ts.
 */
export interface GlobalStateSchemaCachePatch {
  // ── State ──────────────────────────────────────────────────────────────────

  /**
   * In-memory cache of per-asset-type schemas.
   * Key:   assetTag string (e.g. "person", "book")
   * Value: full AssetSchema fetched from POST /api/query/getSchema/ { assetType }
   *
   * Lifecycle:
   *   - Initialised as {} on store creation.
   *   - Populated on first navigation to any page for a given assetTag.
   *   - NEVER written to localStorage or sessionStorage (FR-018).
   *   - NEVER invalidated within a session; cleared only by full page reload.
   */
  schemaCache: Record<string, AssetSchema>;

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch and cache the schema for a given assetTag.
   *
   * Behaviour:
   *   1. If schemaCache[assetTag] exists → return it immediately (no network).
   *   2. Otherwise → call POST /api/query/getSchema/ { assetType: assetTag }.
   *   3. On success → merge result into schemaCache and return it.
   *   4. On error → throw the error; consumers catch and display an error state.
   *
   * Thread safety:
   *   Zustand set() is synchronous and atomic. Concurrent calls for the same
   *   assetTag will both trigger a network request if the first hasn't resolved
   *   yet (no in-flight deduplication in this design). This is acceptable given
   *   the single-page navigation model — callers mount once per assetTag.
   *
   * Usage:
   *   const fetchAssetSchema = useGlobalStore(s => s.fetchAssetSchema);
   *   useEffect(() => {
   *     fetchAssetSchema(assetTag).then(setSchema).catch(setError);
   *   }, [assetTag, fetchAssetSchema]);
   *
   * @param assetTag  The snake-case asset type identifier (e.g. "person")
   * @returns         Resolves with the AssetSchema from cache or network
   * @throws          AxiosError on network failure; callers must handle
   */
  fetchAssetSchema: (assetTag: string) => Promise<AssetSchema>;
}
