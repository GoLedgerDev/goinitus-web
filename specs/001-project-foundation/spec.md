# Feature Specification: Project Foundation — App Shell & GoFabric Connection

**Feature Branch**: `001-project-foundation`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "001 - Project foundation: Vite + TS5 scaffold with Axios 1.x, Zustand global/config stores, GoFabric bootstrap API integration (getHeader, getSchema, getTx, getDataTypes), auth token flow, Header and schema-driven Drawer. No page content beyond a home screen."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — App Loads and Connects to a GoFabric Backend (Priority: P1)

A blockchain operator opens the GoInitus web app in a browser. The app automatically contacts the configured GoFabric REST server, retrieves the chaincode's identity information and full schema (assets, transactions, custom data types), and presents a navigable shell. The operator sees the chaincode name in the header and can immediately access assets and transactions from the side drawer — all without any manual schema configuration.

**Why this priority**: This is the foundation of the entire product. No other feature can work without the app successfully bootstrapping from a live GoFabric backend. If this does not work, the app is a blank page.

**Independent Test**: Point the app at a running GoFabric REST server, open the browser — the header displays the chaincode name, and the Drawer is populated with at least one asset or transaction entry pulled live from the backend.

**Acceptance Scenarios**:

1. **Given** a GoFabric REST server is reachable and credentials are valid, **When** the user opens the app, **Then** the header displays the chaincode name and version, and the Drawer is populated with all asset types and transactions from the chaincode schema.
2. **Given** the GoFabric server is unreachable, **When** the app tries to load, **Then** the user sees a clear connection error message with options to retry or configure the server address — no blank screen or unhandled crash.
3. **Given** the GoFabric server responds with 401 Unauthorized, **When** the app tries to load, **Then** a credential entry form is displayed, prompting the user for username and password before retrying.
4. **Given** the chaincode schema includes assets in private data collections, **When** the app loads, **Then** those assets appear in the Drawer under a separate read-only section.

---

### User Story 2 — Schema-Driven Navigation Drawer (Priority: P2)

A blockchain operator uses the side drawer to navigate between different asset types and chaincode transactions. The drawer automatically reflects the exact set of assets and transactions defined in the connected chaincode — with no code changes needed when the chaincode is upgraded with new types or transactions.

**Why this priority**: The navigable shell is the entry point to all other features. Without it, there is no way to reach any asset or transaction screen. It also validates the schema-driven architecture at its most visible layer.

**Independent Test**: Connect to two different GoFabric chaincodes (with different schemas). Verify the Drawer shows different entries for each without any code change.

**Acceptance Scenarios**:

1. **Given** bootstrap is complete, **When** the operator views the Drawer, **Then** asset types are grouped into read/write, read-only, and unreachable sections based on the current organisation's permissions.
2. **Given** bootstrap is complete, **When** the operator views the Drawer, **Then** all non-meta transactions appear in a separate transactions section.
3. **Given** an asset type has no read or write permissions for the current org, **When** the operator views the Drawer, **Then** that asset is shown in an unreachable section (visible but not actionable).
4. **Given** the operator reloads the page, **When** the app reconnects to the same backend, **Then** the Drawer contents are identical to the previous session.

---

### User Story 3 — Runtime Server Configuration (Priority: P3)

A blockchain operator can configure the GoFabric REST server address and authentication credentials directly in the browser without redeploying the app or editing configuration files. This allows the same deployed instance of GoInitus to be pointed at different GoFabric environments as needed.

**Why this priority**: Required for the app to be usable in real deployments where the backend address may vary. Lower priority than P1 and P2 because the app can still function with a build-time default URL while those stories are being developed.

**Independent Test**: With a working app connected to server A, open the settings panel, enter the address of server B with valid credentials, and confirm the Drawer reflects server B's schema without redeployment.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** the operator opens the settings panel and enters a new server address, **Then** the app reconnects and the Drawer reflects the new server's schema.
2. **Given** the operator has previously configured a custom server address, **When** the page is reloaded, **Then** the previously configured address is used automatically — not the build-time default.
3. **Given** the operator enters an address that is unreachable, **When** the connection attempt fails, **Then** the error state from User Story 1, scenario 2 is displayed and the previous configuration is preserved.
4. **Given** the operator provides new credentials via the credential form, **When** valid credentials are submitted, **Then** the bootstrap sequence completes and the Drawer is populated without a full page reload.

---

### Edge Cases

- What happens when the backend returns an empty asset list (chaincode with no defined types)?
- What happens when `getDataTypes` fails but the other three bootstrap calls succeed?
- What happens when the server address stored from a previous session is no longer reachable on the next load?
- How does the app behave when the current org has no permissions on any asset type at all?
- What happens when the schema contains only dynamically-created asset types and no static ones?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST automatically initiate all four bootstrap queries (`getHeader`, `getSchema`, `getTx`, `getDataTypes`) on every page load before rendering navigable content.
- **FR-002**: The global application state MUST hold the full asset list, transaction list, org MSP identity, chaincode name and version, and authentication state, accessible across all parts of the app.
- **FR-003**: The server address and authentication credentials MUST be persisted across page reloads so users do not need to reconfigure on every visit.
- **FR-004**: The app MUST detect a 401 response from any bootstrap call and display a credential entry form, allowing the user to enter credentials and retry without a full page reload.
- **FR-005**: The app MUST detect a network failure during bootstrap and display a recoverable error screen with "Retry" and "Configure Server" actions.
- **FR-006**: The side Drawer MUST be populated dynamically from the schema data returned by bootstrap — no asset or transaction names may be hardcoded.
- **FR-007**: Assets in the Drawer MUST be grouped by the current org's access level: read/write, read-only, and unreachable.
- **FR-008**: Transactions in the Drawer MUST exclude meta-transactions (internal chaincode operations not intended for direct invocation by end users).
- **FR-009**: The home screen MUST display the chaincode name and version retrieved from `getHeader`.
- **FR-010**: The settings panel MUST allow the operator to change the server address and credentials at runtime; the change MUST take effect without redeployment.
- **FR-011**: A failure of the `getDataTypes` call MUST be handled gracefully — the app MUST continue loading with a non-blocking notification; it MUST NOT block the rest of the bootstrap sequence.
- **FR-012**: The org colour theme (derived from the org MSP identifier) MUST be applied to the app header on successful bootstrap.

### Key Entities

- **Schema**: The chaincode's identity — name, version, and the current organisation's MSP identifier. Retrieved from `getHeader`.
- **Asset Type**: A type of ledger record defined in the chaincode, with a label, tag, permission lists (readers/writers), optional private collection association, and a set of field descriptors. Retrieved via `getSchema`.
- **Transaction**: A chaincode function that can be invoked or queried, with a label, tag, invocation method, argument descriptor list, and permission list. Retrieved via `getTx`.
- **Custom Data Type**: An application-defined field type with accepted formats and optional enumerated values. Retrieved via `getDataTypes`.
- **Server Configuration**: The runtime-configurable server address and authentication credentials used to communicate with the GoFabric REST API.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The app fully loads (Drawer populated, home screen visible) in under 3 seconds when the GoFabric REST server responds within normal latency.
- **SC-002**: The four bootstrap queries are issued exactly once per page load; no duplicate calls occur on re-renders or navigation events.
- **SC-003**: A user entering valid credentials into the credential form sees the app fully load within 5 seconds — with no full page reload required.
- **SC-004**: The Drawer correctly reflects permission-based grouping for 100% of asset types returned by any connected GoFabric schema.
- **SC-005**: A connection error or 401 during bootstrap results in a user-visible, actionable error message within 2 seconds of the failure — never a blank screen or unhandled exception.
- **SC-006**: Server address and credential changes made in the settings panel are active on the very next app load with no additional user action required.

## Assumptions

- The GoFabric REST server is a separately deployed service already running and reachable; its setup and configuration are out of scope for this feature.
- Basic Auth (username/password) is the only authentication mechanism in scope for this feature. OAuth login is explicitly deferred to a later feature.
- The home screen is intentionally minimal (chaincode name and version only). Dashboard panels and analytics charts are out of scope.
- Responsive and mobile layout is out of scope for this feature; the target viewport is a desktop browser.
- A single GoFabric backend is connected at a time; multi-server switching or comparison is not in scope.
- The `getDataTypes` bootstrap call is best-effort: its failure must not block the application from loading.
