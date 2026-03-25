import { create } from 'zustand';
import { toast } from 'react-toastify';
import { getHeader, getSchema, getTx, getDataTypes } from '@/api/bootstrap';
import { orgColor as computeOrgColor } from '@/utils/colorUtils';
import type { Schema, AssetListElement } from '@/api/types/schema';
import type { TransactionListElement } from '@/api/types/transaction';
import type { DataTypeMap } from '@/api/types/dataType';
import type { AxiosError } from 'axios';

export type BootstrapStatus = 'idle' | 'loading' | 'success' | 'error';

interface GlobalState {
  // Bootstrap lifecycle
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;
  /** Set to true when a 401 is received — triggers CredentialForm */
  needs401Form: boolean;

  // Schema data
  schema: Schema | null;
  orgColor: string | null;
  assetList: AssetListElement[];
  /** User-facing transactions (metaTx === false) */
  transactionList: TransactionListElement[];
  /** Internal meta-transactions (metaTx === true) — used by CRUD generators */
  metaTransactionList: TransactionListElement[];
  dataTypeMap: DataTypeMap;

  // UI state
  isDrawerOpen: boolean;

  // Actions
  bootstrap: () => Promise<void>;
  retry: () => Promise<void>;
  dismissCredentialForm: () => void;
  setDrawerOpen: (open: boolean) => void;

  // Helpers
  checkPermission: (list: string[]) => boolean;
  checkUnreachablePermission: (writers: string[], readers: string[]) => boolean;
  dataTypeBase: (dataType: string) => string;
  getDropDownValues: (dataType: string) => Record<string, string> | null;
}

function is401(err: unknown): boolean {
  return (err as AxiosError)?.response?.status === 401;
}

function resolveDrawerSection(
  asset: AssetListElement,
  orgMSP: string,
): AssetListElement['drawerSection'] {
  const canWrite = asset.writers.some((pattern) => orgMSP.includes(pattern) || new RegExp(pattern).test(orgMSP));
  const canRead = asset.readers.some((pattern) => orgMSP.includes(pattern) || new RegExp(pattern).test(orgMSP));
  if (canWrite) return 'readWrite';
  if (canRead) return 'readOnly';
  return 'unreachable';
}

export const useGlobalStore = create<GlobalState>()((set, get) => ({
  bootstrapStatus: 'idle',
  bootstrapError: null,
  needs401Form: false,

  schema: null,
  orgColor: null,
  assetList: [],
  transactionList: [],
  metaTransactionList: [],
  dataTypeMap: {},

  isDrawerOpen: false,

  bootstrap: async () => {
    // Exactly-once guard (SC-002 / research R-04)
    if (get().bootstrapStatus !== 'idle') return;
    set({ bootstrapStatus: 'loading', bootstrapError: null, needs401Form: false });

    const [headerResult, schemaResult, txResult] = await Promise.allSettled([
      getHeader(),
      getSchema(),
      getTx(),
    ]);

    // Detect 401 from any of the three required calls (C1 fix / A1 clarification)
    const any401 = [headerResult, schemaResult, txResult].some(
      (r) => r.status === 'rejected' && is401(r.reason),
    );
    if (any401) {
      set({ bootstrapStatus: 'error', needs401Form: true, bootstrapError: 'Authentication required' });
      return;
    }

    // Any other failure in the three required calls → ConnectError
    if (
      headerResult.status === 'rejected' ||
      schemaResult.status === 'rejected' ||
      txResult.status === 'rejected'
    ) {
      const firstErr =
        (headerResult.status === 'rejected' ? headerResult.reason : null) ??
        (schemaResult.status === 'rejected' ? schemaResult.reason : null) ??
        (txResult.status === 'rejected' ? txResult.reason : null);
      const message = (firstErr as AxiosError)?.message ?? 'Connection failed';
      set({ bootstrapStatus: 'error', bootstrapError: message });
      return;
    }

    const schema = headerResult.value;
    const rawAssets = schemaResult.value;
    const rawTxs = txResult.value;
    const color = computeOrgColor(schema.orgMSP);

    // Enrich assets with computed fields
    const assetList: AssetListElement[] = rawAssets.map((a) => ({
      ...a,
      canCreate: a.writers.some((p) => schema.orgMSP.includes(p) || new RegExp(p).test(schema.orgMSP)),
      drawerSection: resolveDrawerSection(a, schema.orgMSP),
    }));

    const transactionList = rawTxs.filter((tx) => !tx.metaTx);
    const metaTransactionList = rawTxs.filter((tx) => tx.metaTx);

    // getDataTypes is best-effort — failure must not block (FR-011)
    try {
      const dataTypeMap = await getDataTypes();
      set({ dataTypeMap });
    } catch {
      toast.warn('Custom data types could not be loaded. Some field types may be unavailable.');
    }

    set({
      bootstrapStatus: 'success',
      schema,
      orgColor: color,
      assetList,
      transactionList,
      metaTransactionList,
    });
  },

  retry: async () => {
    set({ bootstrapStatus: 'idle', needs401Form: false });
    await get().bootstrap();
  },

  dismissCredentialForm: () => {
    set({ needs401Form: false });
  },

  setDrawerOpen: (open) => set({ isDrawerOpen: open }),

  checkPermission: (list) => {
    const msp = get().schema?.orgMSP ?? '';
    if (!msp) return false;
    return list.some((pattern) => {
      try { return new RegExp(pattern).test(msp); }
      catch { return msp.includes(pattern); }
    });
  },

  checkUnreachablePermission: (writers, readers) => {
    const check = get().checkPermission;
    return !check(writers) && !check(readers);
  },

  dataTypeBase: (dataType) => {
    const def = get().dataTypeMap[dataType];
    if (!def) return dataType;
    const fmt = def.acceptedFormats[0];
    return fmt ?? dataType;
  },

  getDropDownValues: (dataType) => {
    return get().dataTypeMap[dataType]?.dropDownValues ?? null;
  },
}));
