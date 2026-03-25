import type { InputType } from './schema';

export interface TransactionListElement {
  label: string;
  /** Chaincode function name; used in API path */
  tag: string;
  args: InputType[];
  method: 'POST' | 'PUT' | 'GET';
  menuIndex: number;
  description: string;
  callers: string[];
  /** True = internal meta-transaction; excluded from user-facing Drawer */
  metaTx: boolean;
}
