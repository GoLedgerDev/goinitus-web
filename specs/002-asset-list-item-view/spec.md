# Feature Specification: Asset List & Item View

**Feature Branch**: `002-asset-list-item-view`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Feature 002: Asset List & Item View — schema-driven asset list page with pagination and private collection support, asset detail page with full field rendering and ledger history, and a cross-cutting per-asset schema cache so navigating between list and detail does not re-fetch schemas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Schema-Driven Asset List Page (Priority: P1)

A blockchain operator clicks on an asset type in the side drawer and is taken to a paginated list of all assets of that type. The column headers and cell formats are generated automatically from the asset's schema — the operator never needs to know in advance which fields exist. They can scroll through pages of results, see human-readable values for each field, and use the list as the entry point for viewing, creating, editing, or deleting assets.

**Why this priority**: The list page is the highest-traffic screen in the app and is the gateway to all other read and write operations. It directly proves the schema-driven pipeline end-to-end against live data. Without it, the drawer navigation added in Feature 001 leads nowhere.

**Independent Test**: Connect to a running GoFabric backend with at least one asset type containing stored assets. Click the asset type in the Drawer, verify the list page loads with correct columns derived from the schema, and verify rows reflect real chaincode data — no hardcoded column names needed.

**Acceptance Scenarios**:

1. **Given** bootstrap is complete and an asset type has stored assets, **When** the operator clicks the asset type in the Drawer, **Then** the list page appears with one column per schema property, labelled with the property's human-readable label.
2. **Given** the list page is open, **When** the initial data loads, **Then** up to 10 assets are shown per page with a visual indicator if more pages exist.
3. **Given** the operator is on a list page with multiple pages of data, **When** they navigate to the next page, **Then** the app fetches the next batch of results from the backend using the pagination cursor returned by the previous response, without reloading already-fetched pages.
4. **Given** an asset type has `readers` defined (it lives in a private data collection), **When** the list page loads, **Then** the data query includes the collection identifier so that private assets are correctly returned.
5. **Given** the asset type has no stored assets, **When** the list page loads, **Then** the table is empty and a user-friendly "no records found" message is displayed.
6. **Given** the list page is open, **When** the operator clicks the "Create" button, **Then** they are navigated to the asset creation route for that asset type (the button is present if the current org has write permission; navigation target is a stub implemented in Feature 003).
7. **Given** a row is present in the list, **When** the operator clicks "View" on that row, **Then** they are navigated to the asset detail page for that asset.
8. **Given** a row is present in the list and the current org has write permission, **When** the operator clicks "Edit" on that row, **Then** they are navigated to the asset edit route (stub for Feature 003).
9. **Given** a row is present in the list and the current org has write permission, **When** the operator clicks "Delete" and confirms, **Then** the asset is removed from the chaincode and the list refreshes to reflect the deletion.

---

### User Story 2 — Asset Detail Page (Priority: P2)

A blockchain operator clicks "View" on an asset row (or navigates directly by URL) and sees a full-detail page for that single asset. Every property from the schema appears as a labelled row with a formatted value. Nested asset references are resolved so the operator sees actual field values rather than raw key identifiers. From this page the operator can open a QR code dialog for the asset's composite key, and can expand the full ledger history to audit every state change ever recorded on-chain.

**Why this priority**: The detail view completes the read path of the schema-driven pipeline and unlocks audit capability (history). It is the logical next step after the list and is needed before any create/edit form work, because it validates that `readAsset` with `resolve: true` returns a fully-materialised asset.

**Independent Test**: Navigate to a known asset's detail page by URL. Verify all schema-defined properties display with correct labels and values. Open the QR code dialog and confirm it encodes the `@key`. Expand ledger history and verify at least one historical state entry is shown.

**Acceptance Scenarios**:

1. **Given** the operator navigates to an asset's detail URL, **When** the page loads, **Then** it fetches the asset by `@key` with nested references resolved, and renders one labelled row per schema property with a human-readable formatted value.
2. **Given** a property's value is a nested asset reference, **When** the detail page renders, **Then** the nested asset's key label is shown inline rather than a raw identifier string.
3. **Given** the detail page is open, **When** the operator clicks the QR code button, **Then** a dialog appears with a scannable QR code encoding the asset's `@key`.
4. **Given** the detail page is open, **When** the operator expands or navigates to the ledger history section, **Then** the app fetches the full history from the backend and renders each historical state as a readable snapshot ordered newest-first.
5. **Given** an asset `@key` that does not exist on the backend, **When** the operator navigates to that detail URL, **Then** a clear not-found message is shown instead of a crash or blank screen.
6. **Given** an asset that resides in a private data collection, **When** the detail page is accessed, **Then** the read request includes the collection identifier so the private asset is correctly returned.

---

### User Story 3 — Per-Asset Schema Cache (Priority: P3)

As an operator browses between the list and detail pages of the same asset type, the app does not re-fetch the asset's schema on every navigation. The schema for each asset type is fetched once per session and served from an in-memory cache for all subsequent navigations. This makes repeated browsing fast and reduces unnecessary load on the GoFabric REST server.

**Why this priority**: This is a cross-cutting quality-of-life improvement that prevents redundant network calls. It is not blocking for P1 or P2 (users can still browse without it), but it is required for the polished read path experience described in the feature's goals.

**Independent Test**: Open the browser's network inspector. Navigate from the list of asset type "X" to an item detail, then navigate back to the list. Verify that `POST /api/query/getSchema/` with `{ assetType: "X" }` appears exactly once in the network log across both page loads.

**Acceptance Scenarios**:

1. **Given** the operator navigates to an asset type's list page for the first time, **When** the page loads, **Then** the app fetches that asset type's schema from the backend exactly once.
2. **Given** the schema for asset type "X" has already been fetched, **When** the operator navigates to the detail page of an asset of type "X" in the same session, **Then** no additional schema fetch is made for type "X".
3. **Given** the schema is cached for asset type "X", **When** the operator navigates back to the list page for "X", **Then** the list renders immediately using the cached schema without an additional network call.
4. **Given** the operator performs a full page reload, **When** the app reinitialises, **Then** the schema cache starts empty and schemas are re-fetched as needed (cache is session-only, not persisted across reloads).

---

### Edge Cases

- **Empty collection**: Asset type exists in the schema but has zero stored assets → list shows empty-state message, no error.
- **Schema with no displayable props**: An asset type has only key fields and no additional props → detail page shows key field(s) only with appropriate labelling.
- **Large number of props**: Asset schema has 20+ properties → list renders a horizontal scrollable table; detail page renders all rows without layout breakage.
- **Deleted asset navigated directly**: Operator bookmarks a detail URL, the asset is deleted by another org, and the operator reopens it → clear not-found message, no crash.
- **Boolean / datetime field types**: Props with `boolean` or `datetime` data types are rendered in human-readable format (e.g., "Yes / No" for booleans, locale-aware date string for datetimes) rather than raw JSON values.
- **List-type fields**: Props with list types (e.g., `[]string`, `[]number`) are shown in the list and detail view in a compact representation; clicking expands or shows a modal with all values.
- **Network timeout on pagination**: Backend does not respond to a next-page request → the current page remains displayed with an error indicator and a retry option.
- **Delete confirmation cancelled**: Operator clicks Delete but cancels the confirmation dialog → no request is made, asset remains in the list.
- **Private collection access denied**: Current org's MSP does not match `readers` → the app shows a permission-denied message rather than an empty list that might be mistaken for "no data".

---

## Requirements *(mandatory)*

### Functional Requirements

**List Page**

- **FR-001**: When a user navigates to `/${assetTag}/list`, the app MUST fetch the full schema for that asset type (including `props[]`, `readers`, and `collection`) before rendering the list.
- **FR-002**: The list table MUST generate one column per entry in `props[]`, using the property's `label` as the column header.
- **FR-003**: The list table MUST render column values according to the property's `dataType`, applying appropriate formatting (e.g., date formatting for `datetime`, "Yes/No" for `boolean`).
- **FR-004**: The list MUST paginate results, fetching up to 10 assets per page, using the pagination cursor from the previous response to fetch the next page.
- **FR-005**: When `readers` are present on the asset type, the data query MUST include the asset's `collection` identifier so that private assets are returned correctly.
- **FR-006**: The list MUST display a "Create" button visible to users whose organisation has write permission on the asset type; clicking it navigates to the creation route for that asset type.
- **FR-007**: Each row in the list MUST have a "View" action that navigates to the asset detail page at `/${assetTag}/item/:key`.
- **FR-008**: Each row MUST have an "Edit" action (visible only when the current org has write permission) that navigates to the asset edit route.
- **FR-009**: Each row MUST have a "Delete" action (visible only when the current org has write permission) that requires confirmation before invoking the delete operation on the backend; on success, the list refreshes.
- **FR-010**: When no assets are found, the list MUST display a user-friendly empty-state message.
- **FR-011**: When the backend returns an error during data fetch, the list MUST display a descriptive error state with a retry option; it MUST NOT crash.

**Detail Page**

- **FR-012**: When a user navigates to `/${assetTag}/item/:key`, the app MUST fetch the single asset by `@key` with nested asset references resolved.
- **FR-013**: The detail page MUST render one row per property from the asset's schema, each row showing the property's `label` and the asset's formatted value for that property.
- **FR-014**: The detail page MUST include a QR code action that, when activated, opens a dialog displaying a scannable QR code encoding the asset's full `@key` string.
- **FR-015**: The detail page MUST provide access to the asset's full ledger history; activating it fetches the history from the backend and renders each historical state in reverse-chronological order.
- **FR-016**: When the `@key` does not exist on the backend, the detail page MUST display a not-found message instead of crashing.

**Schema Cache**

- **FR-017**: The app MUST cache the schema response for each asset type after the first fetch within a session; subsequent navigations to any page for the same asset type MUST use the cached schema without issuing another schema request.
- **FR-018**: The schema cache MUST be stored in in-memory client-side state and MUST be cleared when the user performs a full page reload; no schema data is persisted to browser storage.

### Key Entities

- **Asset Schema** (`AssetSchema`): The structural definition of one asset type, including its tag, label, ordered list of property descriptors (`props[]`), writers, readers, and optional private collection name. Fetched once per type per session and cached.
- **Asset Instance** (`AssetRecord`): A single blockchain asset of a given type. Has a composite key (`@key`), an `@assetType` field matching the schema tag, and one value per property defined in the schema.
- **Asset History Entry**: A point-in-time snapshot of an asset's state as recorded on the ledger. Each entry includes the asset's field values at that moment and a timestamp.
- **Pagination Cursor**: An opaque bookmark string returned by the backend after each paginated query, used to request the next page. The app MUST NOT interpret or modify its content.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can navigate from the Drawer to a fully rendered, data-populated asset list page in under 3 seconds on a local area network connection.
- **SC-002**: An operator can open an asset detail page with all fields populated and nested references resolved in under 3 seconds on a local area network connection.
- **SC-003**: Navigating from an asset list to a detail page and back to the list produces zero additional schema fetch requests after the first visit; the schema is served from cache.
- **SC-004**: All schema-defined property types (string, number, boolean, datetime, list types, asset references) display in a human-readable format on both the list and detail views with no raw JSON visible to the operator.
- **SC-005**: The list page correctly handles asset types with private data collections without any special configuration by the operator — the collection is detected from the schema automatically.
- **SC-006**: A delete action completes (confirmed by list refresh) in under 5 seconds on a local area network connection; a cancelled delete causes zero changes to the backend state.
- **SC-007**: The app displays a meaningful error message (not a blank screen or unhandled exception) for every identified error path: unreachable backend, not-found asset, empty result set, and access-denied collection.

---

## Assumptions

- Bootstrap (Feature 001) has completed successfully and the global schema (asset list, data types) is already loaded in the Zustand global store before Feature 002 routes are rendered.
- The GoFabric REST server is the source of truth for schema and data; the app does not validate or transform schema field types beyond formatting them for display.
- Row-level "Edit" action navigates to a route that will be fully implemented in Feature 003 (Create / Edit Forms); in this feature the route target may be a stub page.
- The "Delete" action is fully implemented in this feature (not deferred), since it uses a simple confirm → API call → refresh pattern with no form input.
- List pagination uses a cursor/bookmark strategy as returned by `/api/query/search`; offset-based pagination is not used.
- The 10-asset-per-page default is assumed based on the existing legacy implementation (`limit: 11`, using the 11th item only as an indicator that a next page exists). Exact page size can be adjusted at planning without impacting scope.
- The schema cache is session-scoped (in-memory client-side state); persistent caching across reloads is out of scope for this feature.
- The QR code encodes the raw `@key` string returned by the API; the QR format or encoding standard is not dictated by this spec.
- Ledger history is read-only; no actions (rollback, compare versions) are in scope for this feature.
- The "Edit" action visibility is gated on the current org's write permission derived from the cached asset schema's `writers` list, consistent with the permission logic already established in Feature 001.
- Mobile layout optimisation is out of scope; the app targets desktop browser operators.
