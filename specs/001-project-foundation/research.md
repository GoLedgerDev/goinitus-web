# Research: Project Foundation — App Shell & GoFabric Connection

**Branch**: `001-project-foundation` | **Date**: 2026-03-24  
**Phase**: 0 — Unknowns resolved before design

---

## R-01 — Reactive Axios Instance (Resolves TD-06)

**Decision**: Create the Axios instance inside Zustand `configStore` using a factory function. The store exposes `getClient()` which returns the current instance. When `setServerUrl()` or `setAuthToken()` is called, the store creates a new Axios instance with the updated `baseURL` / `Authorization` header — no page reload required.

**Rationale**: The legacy codebase resolved the base URL at module load time, requiring `window.location.reload()` on every server-address change (TD-06). Zustand stores are reactive singletons; creating the Axios instance inside the store allows any subscriber to access the always-current client.

**Implementation pattern**:
```ts
// configStore.ts
interface ConfigState {
  serverUrl: string;
  authToken: string | null;
  client: AxiosInstance;
  setServerUrl: (url: string) => void;
  setAuthToken: (user: string, pass: string) => void;
  clearAuth: () => void;
}

const makeClient = (url: string, token: string | null): AxiosInstance => {
  const instance = axios.create({ baseURL: url });
  if (token) instance.defaults.headers.common['Authorization'] = token;
  instance.interceptors.response.use(
    (r) => r,
    (err: AxiosError) => {
      // Sanitise before logging (Principle IV)
      const sanitised = { status: err.response?.status, url: err.config?.url };
      console.error('[api error]', sanitised);
      return Promise.reject(err);
    }
  );
  return instance;
};
```

**Alternatives considered**: React Context with `useMemo` — rejected because Axios instance updates would force context re-renders across the whole tree.

---

## R-02 — Org Colour Theming from MSP Identifier (FR-012)

**Decision**: Derive a deterministic colour from the `orgMSP` string using a simple djb2 hash clamped to a perceptually-distinct palette of 8 dark MUI-compatible hex values. Store the resolved colour in `globalStore.orgColor` and apply it to the MUI `AppBar` via `sx={{ bgcolor: orgColor }}`.

**Rationale**: The legacy `randomColor()` used Math.random(), which changed on every load (TD-19). A deterministic hash ensures the same org always gets the same colour across sessions and devices, which matters for org recognition in multi-org scenarios.

**Implementation**:
```ts
// colorUtils.ts
const PALETTE = [
  '#1565C0', '#00695C', '#4527A0', '#AD1457',
  '#E65100', '#283593', '#2E7D32', '#6A1B9A',
];

export function orgColor(msp: string): string {
  let h = 5381;
  for (let i = 0; i < msp.length; i++) h = (h * 33) ^ msp.charCodeAt(i);
  return PALETTE[Math.abs(h) % PALETTE.length];
}
```

**Alternatives considered**: CSS custom properties derived from hsl(hash) — rejected because arbitrary hsl values may fail WCAG contrast on white text; the fixed palette guarantees it.

---

## R-03 — Auth Token Storage & Lifecycle (Constitution §IV)

**Decision**: Store the Basic Auth token under `localStorage` key `@goinitus:authToken` with the following lifecycle rules:
1. **Written**: only when the user submits valid credentials via the credential form.
2. **Read**: on app boot inside `configStore` initialiser to rehydrate the Axios instance.
3. **Cleared**: on explicit logout action and on receiving a `401` after credential re-entry (indicates the stored token is stale).
4. **Never logged**: Axios error interceptor strips the `Authorization` header before any console output.

**Rationale**: The constitution acknowledges localStorage as the current approach while forbidding plain-text logging and requiring clear-on-logout. HttpOnly cookies require server cooperation (Nginx `proxy_cookie_path`), which is out of scope for feature 001.

**Key names** (constants in `src/api/constants.ts`):
```ts
export const AUTH_TOKEN_KEY   = '@goinitus:authToken';
export const SERVER_URL_KEY   = '@goinitus:restServer';
export const AUTH_SENTINEL    = 'askForToken'; // never persisted; in-memory signal only
```

**Alternatives considered**: sessionStorage — rejected because the spec requires persistence across page reloads (FR-003). Short-lived JWTs — deferred to a later auth feature.

---

## R-04 — Bootstrap Sequence & Exactly-Once Semantics (SC-002)

**Decision**: Run bootstrap once per page load from a single `useEffect(() => { bootstrap() }, [])` call in `AppShell.tsx`. The `globalStore.bootstrapStatus` field (`'idle' | 'loading' | 'success' | 'error'`) acts as a guard: `bootstrap()` returns immediately if status is not `'idle'`. React Strict Mode double-invocation is handled because the abort check re-reads store state (not a closure variable).

**Bootstrap sequence** (FR-001):
1. Set `bootstrapStatus = 'loading'`
2. `Promise.allSettled([getHeader(), getSchema(), getTx()])` — parallel; all three are required
3. If any of the three fails: set `bootstrapStatus = 'error'`; surface recoverable error screen (SC-005)
4. `getDataTypes()` — called separately after step 2 succeeds; failure → non-blocking toast (FR-011)
5. Set `bootstrapStatus = 'success'`; render app shell

**Rationale**: `Promise.allSettled` instead of `Promise.all` allows differentiating which call failed for targeted error messaging. `getDataTypes` failure must not block the render.

**Alternatives considered**: React Query (`useQuery`) for each bootstrap call — rejected because bootstrap is a one-shot imperative sequence, not a re-fetchable query tied to a component lifecycle.

---

## R-05 — Meta-Transaction Filtering (FR-008)

**Decision**: GoFabric's `getTx` endpoint (both list and per-tx detail) returns a `metaTx: boolean` field on each transaction descriptor. Transactions with `metaTx === true` are internal chaincode operations (`createAsset`, `updateAsset`, `deleteAsset`, `readAsset`, etc.) and MUST NOT appear in the Drawer's user-facing transactions section.

**Filter rule**:
```ts
const userTxList = txList.filter((tx) => !tx.metaTx);
const metaTxList = txList.filter((tx) => tx.metaTx);
// metaTxList is stored in globalStore for use by TableGenerator in later features
```

**Source**: Confirmed from `ARCHITECTURE.md §5 → Globals.resetGlobals()`: "separates meta-txs from user-txs".

---

## R-06 — Permission-Based Drawer Grouping (FR-007)

**Decision**: Three asset sections in the Drawer, derived at bootstrap time:

| Section | Condition |
|---------|-----------|
| **Read / Write** | `checkPermission(asset.writers)` is true |
| **Read Only** | `checkPermission(asset.writers)` is false AND `checkPermission(asset.readers)` is true |
| **Unreachable** | `checkPermission(asset.writers)` is false AND `checkPermission(asset.readers)` is false |

`checkPermission(list: string[])` resolves by matching `globalStore.orgMSP` against each string in `list` using a simple `String.includes` or regex match (preserving the legacy pattern).

Assets with `readers.length > 0` (private data collection) that the org can read appear in Read Only, not in Read/Write, even if they also have write permission patterns — this matches the legacy Drawer behaviour from `ARCHITECTURE.md §5 → Drawer`.

---

## All Unknowns Resolved

No `NEEDS CLARIFICATION` items remain. All design decisions above are grounded in the existing `ARCHITECTURE.md`, `constitution.md`, and feature spec.
