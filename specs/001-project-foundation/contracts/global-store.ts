// CONTRACT: src/store/globalStore.ts
// Zustand store — global application state populated on bootstrap.
// This file is a TypeScript interface contract, not the implementation.

import type { AssetListElement, Schema, InputType } from '../api/types/schema';
import type { TransactionListElement } from '../api/types/transaction';
import type { DataTypeMap } from '../api/types/dataType';

export type BootstrapStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GlobalState {
  // ── Bootstrap status ───────────────────────────────────────────────────────
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;

  // ── Schema data (populated on successful bootstrap) ────────────────────────
  /** Chaincode identity from getHeader */
  schema: Schema | null;
  /** Computed from schema.orgMSP — deterministic hex colour */
  orgColor: string | null;
  /** All asset types, enriched with canCreate + drawerSection */
  assetList: AssetListElement[];
  /** User-facing transactions (metaTx === false) */
  transactionList: TransactionListElement[];
  /** Internal chaincode transactions (metaTx === true) — used by CRUD generators */
  metaTransactionList: TransactionListElement[];
  /** Custom data type definitions from getDataTypes */
  dataTypeMap: DataTypeMap;

  // ── UI state ───────────────────────────────────────────────────────────────
  isDrawerOpen: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Run the full 4-call bootstrap sequence. No-op if already loading/success. */
  bootstrap: () => Promise<void>;
  /** Reset to idle and re-run bootstrap (called by Retry button). */
  retry: () => Promise<void>;

  setDrawerOpen: (open: boolean) => void;

  // ── Helpers ────────────────────────────────────────────────────────────────
  /**
   * Returns true if the current org's MSP matches any entry in the permission list.
   * Performs a simple string-includes check against each pattern.
   */
  checkPermission: (list: string[]) => boolean;
  /**
   * Returns true if the org can neither read nor write an asset
   * (both writers and readers checks fail).
   */
  checkUnreachablePermission: (writers: string[], readers: string[]) => boolean;
  /**
   * Resolves a custom dataType name to its base primitive type.
   * Returns the input unchanged if no mapping is found.
   */
  dataTypeBase: (dataType: string) => string;
  /**
   * Returns the dropdown values for an enum-like custom dataType, or null.
   */
  getDropDownValues: (dataType: string) => Record<string, string> | null;
}
