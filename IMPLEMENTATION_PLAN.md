# Implementation Plan — GoInitus Web Rewrite

> Companion to `ARCHITECTURE.md` (the reverse-engineering document for legacy `go-initus`). This
> document turns that analysis into an actionable plan for rebuilding `goinitus-web` from scratch.
> It has been cross-checked against the actual `go-initus` source (`develop` branch, the live
> branch — `master` is stale) and against the `ccapi-go` backend source, not just against
> `ARCHITECTURE.md`'s prose. Corrections and additions found during that cross-check are called
> out explicitly in [Appendix A](#appendix-a-corrections-to-architecturemd).

## Scope

This is a **full feature-parity rewrite** of `go-initus` (`develop` branch) against the **unchanged**
`ccapi-go` REST contract (`/api/query/*` for reads, `/api/invoke/*` for writes, one endpoint per
chaincode transaction, plus the `getHeader` / `getSchema` / `getTx` / `getDataTypes` bootstrap
calls). The new app must render the same schema-driven forms/tables/routes, support the same input
types, and hit the same endpoints with the same request/response shapes — no asset type, field
name, or transaction name may be hardcoded, exactly as today. **No new product features** are in
scope. The only additions allowed are fixes to items already logged as technical debt in
`ARCHITECTURE.md`'s TD-01..TD-28 list (or the additional items found in Appendix A), and only where
the fix is a natural side effect of rebuilding the affected piece rather than extra work bolted on
top. Every such opportunistic fix is called out separately in the parity checklist below so it's
never confused with a parity requirement.

## Target stack

**Confirmed** (per Samuel Venzi's feedback on this PR): the rewrite modernizes the frontend
tooling/libraries below without regard for compatibility with the legacy stack. This is a
frontend-only decision — it has no bearing on the `ccapi-go` REST contract, which per the Scope
section above stays unchanged (`/api/query/*` / `/api/invoke/*`, same endpoints, same
request/response shapes). "Modernize the stack" means the client-side framework/build/state/form
libraries, not the API surface the client talks to. They largely reuse `ARCHITECTURE.md` §9's
modernization table, which held up under cross-checking; call-outs below note where this plan
diverges from that table.

| Concern | Recommendation | Why |
|---|---|---|
| Framework | React 19 + TypeScript 5 | Direct continuation of the existing React codebase; avoids a framework migration on top of a stack migration. |
| Build tool | Vite | CRA (`react-scripts`) is deprecated; Vite is the de facto CRA replacement with minimal config. |
| UI kit | MUI v6 (`@mui/material`) + `@mui/x-data-grid` + `@mui/x-date-pickers` | Same design language as today's MUI v4 app, so the visual/UX delta for users is minimal; MUI v6 is actively maintained and the v4→v6 migration path is well documented. |
| State management | Zustand | Legacy MobX 5 uses the old decorator API; Zustand gives a comparably small, hooks-first store without MobX's decorator/build-config baggage. Confirmed — no need to preserve MobX for compatibility with the legacy codebase. |
| Forms & validation | React Hook Form + Zod | Legacy hand-rolled MobX `Input` classes have no validation at all (TD-07); RHF+Zod lets validation be derived mechanically from the schema's `required`/`dataType` fields with far less boilerplate than the current per-type class hierarchy. |
| HTTP client | Axios 1.x | Same library as today (minimizes behavioral surprises in error handling/interceptors), just on a non-CVE'd major version. |
| Routing | React Router 6 | Direct successor to the router already in use (v5); routes are still generated dynamically from schema data at runtime, same pattern as `Routes.tsx` today. |
| Dates | date-fns | Already a dependency today (alongside `moment`); consolidating on it alone drops `moment` + `@date-io/moment` entirely. |

## Feature parity checklist

Legend: **P** = parity requirement (must ship, matches legacy behavior exactly). **TD-fix** =
opportunistic tech-debt fix bundled into that piece of work. **Deferred** = a related TD item that
is explicitly *not* addressed in this rewrite (tracked for a future pass).

### Bootstrap / schema loading

| Legacy module | New implementation must cover | TD handling |
|---|---|---|
| `store/Globals.tsx: resetGlobals()` | On load: `POST /api/query/getHeader/`, `POST /api/query/getSchema/`, `POST /api/query/getTx/` in parallel, then `POST /api/query/getDataTypes/` (failure toasts but doesn't block boot), then one `POST /api/query/getTx` per transaction tag and one `POST /api/query/getSchema/` per asset tag to compute `canCreate`/`labelKeys`/permissions. **P** | TD-fix: schema/header responses cached in `localStorage` with a TTL/version key to cut boot-time round-trips (ARCHITECTURE.md §9 rec). TD-fix: replace magic strings (`@Goinitus:authToken`, `askForToken`, `@assetType`, `@key`, …) with named constants (TD-17). |
| `services/api.ts` base-URL resolution | Priority order `localStorage` override → build-time env var → Nginx-injected cookie; Basic Auth header from `localStorage`; 401 → sentinel that opens the credentials panel. **P** | TD-fix: make base URL reactive instead of requiring `window.location.reload()` (TD-06). |
| `Header` / `Drawer` nav | Sections for Assets (Read/Write, Read-Only, Unreachable), Active Transactions, Non-Callable Transactions, Dynamic Type Transactions, populated from `assetList`/`transactionList`/`checkPermission()`. **P** | TD-fix: dedupe React route `key` props (TD-10, applies to the route-generation step this section feeds). |
| Org MSP permission checks (`checkPermission`, `checkUnreachablePermission`) | Regex-match current `orgMSP` against `writers`/`readers`/`callers` lists (`$`-prefixed = negation escape as today). **P** | — |
| Org color theming | Deterministic-per-org color persisted in `localStorage`, used for header/drawer theming. **P** | TD-fix opportunistic: widen `randomColor()`'s palette range beyond the current 4-hex-digit set (TD-19) — cosmetic, cheap, skip if it risks scope creep. |

### Asset CRUD

| Legacy module | New implementation must cover | TD handling |
|---|---|---|
| `screens/Form` + `generators/FormGenerator` | Create (`POST /api/invoke/createAsset` with body `{ asset: [{ '@assetType', ...fields }] }`) and edit (`PUT /api/invoke/updateAsset` with body `{ update: { '@assetType', ...fields } }`) for any asset type, incl. pre-populating from `POST /api/query/readAsset` in edit mode, key fields read-only on edit, tabbed public/private field views. **P** — see Appendix A for the exact private-collection wire format (`~asset`/`~update` + `?@collections=`) that must be preserved byte-for-byte. | TD-fix: enforce `required` in the UI via Zod (today it's stored but never checked — TD-07). |
| `screens/List` + `generators/TableGenerator` | Paginated table (`POST /api/query/search`, CouchDB selector, limit 11/bookmark cursor), row actions (History/View/Edit/Delete) gated by presence of the corresponding entry in `standardTxList` and by write permission. **P** | TD-fix: replace `window.confirm()` on delete with a real dialog (TD-08). TD-fix: fix the direct-mutation pattern in `setInitialData` while it's being rewritten anyway (TD-14). |
| Asset history (`List` with `:key` param) | `POST /api/query/readAssetHistory`, no CRUD actions on history rows, shows `@lastTouchBy`/`_timestamp`. **P** | — |
| `screens/Item` (detail view) | `POST /api/query/readAsset` with `resolve: true`; retry against the private-collection query param when the response carries `@hash`; copy-to-clipboard per field; QR code of `@key`; dropdown value resolution. **P** | TD-fix: fix the `collection` state / `useEffect` dependency loop risk while this screen is rewritten (TD-15). |
| Delete (`deleteAsset`) | `DELETE /api/invoke/deleteAsset` with `{ key: { '@assetType', '@key' } }`. **P** | — |
| Input types | All 13 input model/component pairs: Text, Number, Boolean, Date, Asset, AssetList, TextList, NumberList, DateList, AnyAsset, DropDown, DropDownList, PropList, OAuthCredential, XYTCredential (see Appendix A — ARCHITECTURE.md's catalog is accurate here). **P** | Deferred: `react-google-login`'s underlying Google API is shut down (TD-01) — OAuthCredential input must still exist and hit the same backend contract, but needs a working OAuth library; see open questions. |

### Dynamic asset-type management

| Legacy module | New implementation must cover | TD handling |
|---|---|---|
| `screens/DynamicTxForm` (createAssetType) | Hardcoded `tag`/`label`/`description`/`props[]` fields (with inline `PropListInput` for props), gated by `dynamicTxsAllowed` (org is in `createAssetType`'s callers). Submits `POST /api/invoke/createAssetType` with `{ assetTypes: [{ tag, label, description, props }] }`. **P** | — |
| `screens/DynamicTxForm` (deleteAssetType) | Dropdown of dynamic (`dynamic: true`) asset tags + `force` flag. Submits `POST /api/invoke/deleteAssetType` with `{ assetTypes: [{ tag, force }] }`. **P** | — |
| `screens/UpdateTypeForm` + `generators/UpdateTypeFormGenerator` | Edit an existing dynamic asset type's `props[]`. **P** | — |

### Custom transactions

| Legacy module | New implementation must cover | TD handling |
|---|---|---|
| `screens/TxForm` + `generators/TxFormGenerator` | Render args for any non-meta transaction from `transactionList`; HTTP verb from `tx.method` (`POST`→invoke POST, `PUT`→invoke PUT, anything else→`GET /api/query/<tag>?@request=<base64 JSON>` then navigate to `/show/@txres?objres=<base64>`); gated by `checkPermission(tx.callers)`. **P** | — |
| Transient/private tx args | Any arg flagged `private` in its schema definition must be sent with its key prefixed `~` so `ccapi-go` routes it as Fabric transient data (confirmed server-side in `ccapi-go`'s invoke handlers — see Appendix A). This is **missing from `ARCHITECTURE.md`**, but it is real, live behavior on `develop` and must be preserved. **P** | — |
| CURL preview | Every query/invoke screen must offer a "preview as curl" action that mirrors the real request about to be sent (method, URL, body), with nested asset refs trimmed to `{ '@assetType', '@key' }`. **P** | — |

### Dashboard

| Legacy module | New implementation must cover | TD handling |
|---|---|---|
| `screens/Dashboard` + `DashboardStore` | A dashboard route exists and renders a grid of panels (chart / fixed-value / pie), matching today's **hardcoded** panel list and hardcoded `localhost` endpoints. **P**, but see open question below — legacy dashboard is explicitly noted (both in `ARCHITECTURE.md` TD-09/TD-18 and confirmed against source: `DashboardStore.tsx` ships 4 hardcoded panels pointing at `http://localhost/length?asset=productOrder`) as "essentially unimplemented." Parity here means "exists and doesn't crash," not "is useful." | Deferred by default: making the dashboard actually config-driven is a *feature improvement*, not parity, and must be called out to Samuel rather than silently added — see Open Questions. |

### Auth

| Legacy module | New implementation must cover | TD handling |
|---|---|---|
| Server config panel + Basic Auth | In-browser server-address configuration, `Basic <base64(user:pass)>` credential entry on 401, persisted in `localStorage`. **P** — this is the actual `ccapi-go` contract: auth is fully optional server-side (`ENABLE_AUTH` env var) and, when enabled, is verified against a single hardcoded `AUTH_USER`/`AUTH_PASS` pair via a custom Gin middleware (not per-user accounts). The frontend cannot authenticate any differently than "send correct Basic Auth header or don't." | TD-fix opportunistic: don't store the raw Basic Auth token in a way that's *more* exposed than today; a full auth hardening pass (HttpOnly cookies, short-lived tokens) would require a `ccapi-go` change and is out of scope — flagged as open question. |

## Phased roadmap

- **Phase 0 — Project scaffold & API client.** Vite + TS project skeleton, chosen UI kit installed, typed Axios client wrapping every endpoint in the table above (`getHeader`, `getSchema`, `getTx`, `getDataTypes`, `search`, `readAsset`, `readAssetHistory`, `createAsset`, `updateAsset`, `deleteAsset`, `createAssetType`, `deleteAssetType`, generic `invoke/<tag>` and `query/<tag>`), base-URL resolution (localStorage → env → cookie) and Basic Auth header wiring, Docker/nginx deploy scaffold on a current Node/nginx base (fixes TD-02). Nothing user-facing ships yet.
- **Phase 1 — Schema bootstrap + read-only asset browsing.** Full `resetGlobals()`-equivalent bootstrap flow; Header + Drawer nav generated from the live schema; dynamic route generation (`Main`, per-asset `list`, `list/:key` history, `show/:key` detail) — covers `Main`, `List` (read path), `Item`, and asset history. No create/edit/delete yet. This is the first phase a stakeholder can actually click through.
- **Phase 2 — Create / edit / delete forms.** `FormGenerator` equivalent: all 13 input types, create/edit/delete against `createAsset`/`updateAsset`/`deleteAsset`, private-collection field handling (`~asset`/`~update`, `?@collections=`), key-field lock on edit, CURL preview. Covers `Form` screen and the write side of `List`'s row actions.
- **Phase 3 — Custom transactions + dynamic asset-type management.** `TxForm` (any non-meta transaction, including the `private`-arg `~`-prefix convention), `DynamicTxForm` (createAssetType/deleteAssetType), `UpdateTypeForm`. Covers every remaining `/api/invoke/*` and `/api/query/*` endpoint not already exercised in Phase 2.
- **Phase 4 — Dashboard.** Port the existing hardcoded panel set (chart/fixed/pie) as-is for parity. Whether to go further is an open question for Samuel, not a default deliverable of this phase.
- **Phase 5 — Auth hardening + polish.** Server-config panel, 401 → credentials flow, OAuth/XYT credential inputs wired to a *working* provider (see open questions), error boundaries per screen (TD-13), loading states for async pickers (TD-12), accessible delete confirmation (TD-08), and a pass through the remaining opportunistic TD fixes called out per-domain above.

## Out of scope / open questions

Needs a decision from Samuel Venzi before or during implementation:

1. **Dashboard ambition**: legacy dashboard is hardcoded and widely regarded (per `ARCHITECTURE.md` and confirmed in source) as barely implemented. Does the rewrite target byte-for-byte parity with the current hardcoded panels (cheapest, matches "no more than legacy"), or is this the moment to make it schema/config-driven (a real feature addition, out of this plan's default scope unless explicitly greenlit)?
2. **OAuthCredentialInput**: `react-google-login` depends on a Google API that was shut down in March 2023 (TD-01), so this input type is currently non-functional in production. Do we (a) reimplement against `@react-oauth/google` to restore actual working OAuth parity, or (b) keep the input type and its wire format for schema compatibility but accept it may need further backend-side coordination? Either way this is more than a drop-in library swap and needs sign-off.
3. **XYTCredentialInput**: depends on an external "fingerprint server" (`fingerprintServer.url`/`port` in `Globals`) that, per source inspection, is stored but apparently never wired into an actual request path beyond the credential dialog itself. Confirm this integration is still needed/used by any real deployment before committing effort to it.
4. **Auth model**: `ccapi-go`'s Basic Auth is a single shared `AUTH_USER`/`AUTH_PASS` pair gated by `ENABLE_AUTH`, not per-user accounts. Any "auth hardening" in Phase 5 is necessarily cosmetic (how the token is stored/transmitted client-side) unless `ccapi-go` itself changes — confirm whether backend auth changes are on the table or if the frontend must work within this constraint permanently.
5. **Deployment target**: legacy ships as a Docker image (Node build stage → Nginx serve, base-URL injected via cookie). Confirm this deployment shape is unchanged for the rewrite, or whether a different hosting target (e.g., static CDN + runtime config endpoint) is preferred now that the app is being rebuilt anyway.
6. **Private-collection query param asymmetry**: `readAsset` takes `?collections=<plain collection name>` while `createAsset`/`updateAsset` take `?@collections=<base64-encoded JSON array of names>` (see Appendix A). This is a `ccapi-go` contract quirk, not something the frontend can unilaterally fix. Flagging so it isn't mistaken for a frontend bug during implementation — no action needed unless Samuel wants to raise it with the `ccapi-go` team separately (would be a backend-repo change, out of scope here).
7. **`getDataTypes` failure handling**: legacy silently toasts and continues booting if this call fails. Confirm that degraded-but-usable behavior (custom dropdown/enum types just won't resolve) is still acceptable, or whether it should block boot instead.

---

## Appendix A: corrections to ARCHITECTURE.md

Found while cross-checking `ARCHITECTURE.md` against `go-initus`'s actual `develop` branch (the
live branch — `ARCHITECTURE.md` states it was generated 2026-03-24 and its code excerpts match
`master`, which has since diverged from `develop`) and against `ccapi-go`'s source:

1. **Missing: transient/private transaction-argument prefixing.** `generators/TxFormGenerator/index.tsx`
   (develop only) prefixes any argument whose schema entry has `private: true` with `~` before
   sending it to `/api/invoke/<tag>` or `/api/invoke/<tag>` (PUT), e.g. `{ foo: 1 }` →
   `{ '~foo': 1 }`. This is how `ccapi-go` routes a value into Fabric transient data instead of the
   public transaction payload. `store/inputs/types.d.ts` has a `private?: boolean` field to
   support this. `ARCHITECTURE.md`'s API reference and component catalog don't mention this at
   all — it must be preserved in the rewrite for any transaction whose args include private
   fields.
2. **Inaccurate: `createAsset`/`updateAsset` request bodies.** `ARCHITECTURE.md`'s endpoint table
   (rows 11–12) describes the body as generic "asset fields JSON." The actual bodies are wrapped:
   `POST /api/invoke/createAsset` sends `{ asset: [{ '@assetType': tag, ...fields }] }` (note the
   array), and `PUT /api/invoke/updateAsset` sends `{ update: { '@assetType': tag, ...fields } }`.
   For assets in a private collection (`readers` present), the wrapper keys themselves flip to
   `~asset` / `~update` (transient data) and `createAsset` additionally gets a
   `?@collections=<base64(JSON array of collection names)>` query parameter — note this is a
   *different* encoding from `readAsset`'s `?collections=<plain collection name>` (confirmed in
   `generators/FormGenerator/index.tsx`). The rewrite's API client must replicate this exactly,
   including the query-param asymmetry between read and write (flagged as open question 6 above).
3. **Confirmed accurate**: `Routes.tsx`'s dynamic route generation (and its duplicate-`key` bug,
   TD-10), `Globals.tsx`'s bootstrap sequence and permission-check logic, `DashboardStore.tsx`'s
   hardcoded panel list pointing at `http://localhost/length?asset=productOrder` (TD-09/TD-18),
   the 13-input-type catalog, and the `ccapi-go` optional-Basic-Auth model (`ENABLE_AUTH` env var
   gating a custom Gin middleware that checks against a single `AUTH_USER`/`AUTH_PASS` pair, not
   per-user accounts) were all spot-checked against source and match `ARCHITECTURE.md`'s
   description.
4. **Minor**: the `develop` branch has otherwise only cosmetic differences from what
   `ARCHITECTURE.md`'s excerpts show (arrow-function parens, `err: any` typing, an `@ts-ignore`
   removed) — i.e., the divergence between `master` and `develop` is small in volume but item 1
   above is a real functional gap, not just formatting.
