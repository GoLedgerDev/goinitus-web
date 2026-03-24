# Data Model: Project Foundation — App Shell & GoFabric Connection

**Branch**: `001-project-foundation` | **Date**: 2026-03-24  
**Phase**: 1 — Design

All types live in `src/api/types/`. These are pure TypeScript interfaces — no runtime code.

---

## Entities

### Schema
Returned by `POST /api/query/getHeader/`. Represents the connected chaincode's identity.

```ts
// src/api/types/schema.ts
export interface Schema {
  /** Human-readable chaincode / app name */
  name: string;
  /** Chaincode version string */
  version: string;
  /** Current org's Membership Service Provider identifier (e.g. "Org1MSP") */
  orgMSP: string;
}
```

**Derived state** (computed in `globalStore`, never from API):
- `orgColor: string` — deterministic hex colour from `orgMSP` (see research R-02)

---

### AssetListElement
Returned by `POST /api/query/getSchema/` (no body). One element per asset type in the chaincode.

```ts
// src/api/types/schema.ts
export interface AssetListElement {
  /** Human-readable display name */
  label: string;
  /** Snake-case identifier used in API paths and @assetType field */
  tag: string;
  /** MSP regex patterns with write permission */
  writers: string[];
  /** MSP regex patterns with read permission; non-empty ⟹ private data collection */
  readers: string[];
  /** True if type was created at runtime via createAssetType */
  dynamic: boolean;
  /** Private data collection name, if applicable */
  collection?: string;
  /** Fields used to build human-readable display labels for asset instances */
  labelKeys: LabelKey[];
  // --- Derived fields (set during bootstrap, not from API) ---
  /** True if the current org has write permission on all key props */
  canCreate: boolean;
  /** Drawer section assignment */
  drawerSection: 'readWrite' | 'readOnly' | 'unreachable';
}

export interface LabelKey {
  assetType: string;
  dataType: string;
  tag: string;
  assetTag: string;
}
```

---

### InputType
Field descriptor; appears in asset schemas and transaction argument lists.

```ts
// src/api/types/schema.ts
export interface InputType {
  /** Field name / JSON key */
  tag: string;
  /** Human-readable label */
  label: string;
  required: boolean;
  /**
   * Primitive: "string" | "number" | "boolean" | "datetime" | "url"
   * List:      "[]string" | "[]number" | "[]datetime"
   * Asset ref: "<assetTag>->"  |  "[]<assetTag>->"
   * Freeform:  "@object" | "@prop"
   * Custom:    any other string (matches a key in DataTypeMap)
   */
  dataType: string;
  placeholder?: string;
  /** Validation error message (empty when valid) */
  error: string;
  disabled: boolean;
  /** Nesting depth for detail view rendering */
  route: string;
  /** True if this field is part of the asset's composite key */
  isKey: boolean;
  /** True when the form is in edit mode (key fields become read-only) */
  isEdit: boolean;
}
```

---

### TransactionListElement
Returned by `POST /api/query/getTx/` (list) and per-transaction detail calls.

```ts
// src/api/types/transaction.ts
export interface TransactionListElement {
  /** Human-readable name */
  label: string;
  /** Chaincode function name; used in API path */
  tag: string;
  /** Argument descriptors for form generation */
  args: InputType[];
  /** HTTP verb for invocation: "POST" | "PUT" | "GET" */
  method: 'POST' | 'PUT' | 'GET';
  menuIndex: number;
  description: string;
  /** Permission list (MSP identifiers or patterns) */
  callers: string[];
  /** True = internal chaincode operation; exclude from user-facing Drawer section */
  metaTx: boolean;
}
```

---

### DataTypeMap
Returned by `POST /api/query/getDataTypes/`.

```ts
// src/api/types/dataType.ts
export interface DataTypeDefinition {
  /** Accepted input formats / validation patterns */
  acceptedFormats: string[];
  /** Enumerated values for dropdown rendering, if present */
  dropDownValues?: Record<string, string>;
}

export type DataTypeMap = Record<string, DataTypeDefinition>;
```

---

### ServerConfig
Persisted in `localStorage`; managed by `configStore`.

```ts
// src/store/configStore.ts  (inline interface)
export interface ServerConfig {
  /** GoFabric REST server base URL, e.g. "http://localhost:80" */
  serverUrl: string;
  /** Base64-encoded "Basic <b64(user:pass)>", or null when not set */
  authToken: string | null;
}
```

**Validation rules**:
- `serverUrl` must be a non-empty string; must begin with `http://` or `https://`
- `authToken` must be `null` or match `/^Basic [A-Za-z0-9+/=]+$/`

---

## State Transitions

### Bootstrap lifecycle (`globalStore.bootstrapStatus`)

```
idle ──bootstrap()──▶ loading ──all 3 succeed──▶ success
                              └──any fails──────▶ error ──retry()──▶ loading
                              
loading: getDataTypes fails ──▶ (non-blocking toast, stays in loading → success)
success: credentials re-entry ──▶ (no status change; re-runs bootstrap sequence)
```

### Auth token lifecycle

```
null (initial)
  └──user submits creds──▶ "Basic <b64>"  (written to localStorage)
       └──logout action──▶ null           (cleared from localStorage)
       └──401 received ──▶ null           (cleared; credential form shown)
```
