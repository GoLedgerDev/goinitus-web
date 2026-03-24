<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0 (initial ratification)

Modified principles:    N/A — first edition
Added sections:         All (new document)
Removed sections:       N/A

Templates reviewed:
  ✅ .specify/templates/plan-template.md   — Constitution Check gate present; no updates needed
  ✅ .specify/templates/spec-template.md   — User story acceptance criteria align with principles
  ✅ .specify/templates/tasks-template.md  — Task category model aligns with principles
  ✅ .specify/templates/constitution-template.md — Source template; no changes required

Follow-up TODOs:
  - None. All fields resolved from ARCHITECTURE.md and project context.
-->

# GoInitus Web — Project Constitution

## Core Principles

### I. Modern Stack — Non-Negotiable Baseline

Every part of the rebuild MUST use **only** the approved modern stack. No legacy package
from the prior codebase may be re-introduced unless explicitly approved via a constitution
amendment.

Approved stack (locked versions as minimums):

| Concern              | Package                              |
|----------------------|--------------------------------------|
| Build tool           | **Vite** (no CRA / Webpack)          |
| React                | **React 19 + TypeScript 5.x**        |
| UI components        | **`@mui/material` v6**               |
| Tables               | **`@mui/x-data-grid`**               |
| Date pickers         | **`@mui/x-date-pickers` + `date-fns` v3** |
| Routing              | **React Router 6**                   |
| Global state         | **Zustand**                          |
| Forms & validation   | **React Hook Form + Zod**            |
| HTTP client          | **Axios 1.x**                        |
| OAuth                | **`@react-oauth/google`**            |
| Notifications        | **`react-toastify` v10**             |
| Docker base          | **`node:22-alpine` → `nginx:alpine`**|

Explicitly **banned** packages: `react-scripts` / CRA, `moment`, `@material-ui/*` (v4),
`material-table`, `@material-ui/pickers`, `react-google-login`, `mobx` / `mobx-react`.

**Rationale**: The legacy stack has critical EOL issues (Node 12, React 16, CRA),
multiple unpatched CVEs (Axios 0.21, react-google-login), and uses deprecated APIs that
make the product non-functional (Google OAuth) or unmaintainable.

### II. Schema-Driven UI (Core Invariant)

All forms, tables, and navigation routes MUST be generated dynamically at runtime from
the chaincode schema returned by the GoFabric REST API. No asset type, transaction, or
field name may be hardcoded in UI source files.

Rules:
- Forms MUST be assembled by `inputFactory.ts` mapping `InputType.dataType` → field component.
- Validation schemas MUST be assembled by `validationFactory.ts` mapping `InputType` → Zod schema.
- Routes MUST be generated from `assetList` and `transactionList` returned on app bootstrap.
- Permission-based visibility (canCreate, writers, readers, org MSP) MUST be derived from
  schema data at runtime — never hardcoded.

**Rationale**: GoInitus's core value proposition is that it works with *any* GoFabric
chaincode without modification. Hardcoding asset types would destroy this generic utility.

### III. Type Safety — End-to-End (NON-NEGOTIABLE)

All TypeScript code MUST be written at `strict: true` compiler settings. The `any` type
is **banned** except in generated adapter shims explicitly annotated with
`// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason>`.

Rules:
- All API request and response shapes MUST have a corresponding TypeScript type or
  interface in `src/api/types/`.
- Zod schemas for form fields MUST be derived programmatically from `InputType`; manually
  written Zod schemas for dynamic fields are not permitted.
- `unknown` MUST be used instead of `any` for external/untyped data; narrow with
  a type guard or Zod parse before use.

**Rationale**: The legacy codebase's lack of strict typing led to runtime errors, prop
drilling of `any`, and no compiler catching broken API contracts during the frequent
schema changes a Fabric chaincode goes through.

### IV. Secure by Default

Authentication credentials and server configuration MUST NOT be stored as plain text in
`localStorage`. Any browser-persisted data MUST be the minimum required.

Rules:
- Basic Auth tokens stored in `localStorage` MUST be treated as ephemeral session data
  and cleared on logout; the key preference is scoped HttpOnly cookies where feasible.
- The Axios client instance MUST be created reactively (via Zustand `configStore`)
  so the base URL can change without a full-page reload.
- No EOL runtime dependencies (Docker base images, npm packages) may be shipped to
  production.
- `axios` interceptors MUST sanitise error responses before logging to avoid leaking
  credentials or PII.
- `window.confirm()` MUST NOT be used; all destructive actions require a styled
  confirmation dialog component.

**Rationale**: TD-05 (plain-text auth in localStorage) and TD-02/TD-03/TD-04 (EOL/CVE
stack) represent exploitable attack surfaces on a blockchain explorer that holds
org credentials.

### V. Validated Forms Always

Every form submission MUST pass client-side validation before the HTTP call is made.
Silent submissions with empty required fields are forbidden.

Rules:
- `InputType.required` MUST be mapped to `.min(1)` or `.nonempty()` in the Zod schema.
- `InputType.dataType` MUST drive the Zod type applied (`z.string()`, `z.number()`,
  `z.coerce.date()`, etc.).
- Validation errors MUST be displayed inline next to the offending field using
  React Hook Form's `formState.errors`.
- The Submit button MUST be disabled while the form is in an invalid or submitting state.

**Rationale**: TD-07 documented that `required` was stored in the schema but never
enforced, letting users submit incomplete transactions directly to the chaincode,
which resulted in opaque ledger-level errors.

### VI. Accessible & Observable UI

Every interactive element MUST be keyboard-navigable and carry sufficient ARIA semantics.
Every async operation MUST have a visible loading state.

Rules:
- All icon-only buttons MUST have `aria-label`.
- Asset picker dropdowns (formerly `CAssetInput`) MUST show a loading indicator while
  fetching options from `/api/query/search`.
- Route-level code splitting via `React.lazy` + `Suspense` MUST be applied to all page
  components in `src/pages/`.
- Each screen MUST be wrapped in a React Error Boundary that renders a recoverable
  error UI instead of a blank page.
- Loading skeletons (using MUI `Skeleton`) MUST replace spinner-only loading for tables
  and detail views.

**Rationale**: TD-08 (inaccessible delete confirm), TD-12 (no loading state on pickers),
TD-13 (no error boundaries) collectively degrade UX and accessibility. The rebuild is
the right time to establish these as enforced norms.

## Tech Stack Constraints

The following constraints govern technology decisions for every feature built on this
project.

- **No new dependencies** may be added without a documented justification in the PR
  description referencing the relevant principle from this constitution.
- **Styling** MUST use MUI's `sx` prop and `@emotion/styled`; `styled-components` is
  banned to eliminate the dual CSS-in-JS runtime present in the legacy codebase.
- **Date handling** MUST use `date-fns` v3 exclusively; `moment`, `dayjs`, and
  `luxon` are not permitted alongside it.
- The **GoFabric REST API URL patterns** (`/api/query/<txName>`, `/api/invoke/<txName>`)
  MUST be preserved — do not introduce a proxy layer that changes these paths, as
  the chaincode operator configures them on the server side.
- **Dashboard panels** MUST be runtime-configurable (user-supplied endpoint URL, panel
  type, label) — hardcoded dashboard data is strictly forbidden.

## Development Workflow

All code changes touching a principle-governed area MUST pass this checklist before
merge:

1. **Constitution Check** — Does the change comply with all six Core Principles?
2. **Type gate** — `tsc --noEmit` passes with zero errors.
3. **Form validation gate** — Any new form field has a corresponding Zod rule derived
   from its `InputType`.
4. **No banned packages** — `npm ls <package>` returns nothing for all banned packages.
5. **Accessibility spot-check** — Any new interactive element has `aria-label` or
   visible label text; runs through at least keyboard tab-focus manually.
6. **Security review** — No credentials, tokens, or user PII written to `console.log`.

Branch naming convention: `###-short-description` (e.g., `001-vite-migration`).

## Governance

This constitution supersedes all prior practices and informal conventions inherited from
the legacy GoInitus codebase. All feature specifications, plans, and task lists MUST
reference and comply with this document.

**Amendment procedure**:
1. Open a PR editing `.specify/memory/constitution.md`.
2. State the version bump type (MAJOR / MINOR / PATCH) and rationale in the PR
   description.
3. Update `LAST_AMENDED_DATE` and `CONSTITUTION_VERSION`.
4. At least one other team member MUST review and approve principle changes (MINOR or
   MAJOR bumps).
5. Run the `speckit.constitution` agent to propagate changes to dependent templates.

**Versioning policy**:
- MAJOR: removal or redefinition of an existing principle.
- MINOR: new principle added or a section materially expanded.
- PATCH: wording clarifications, typo fixes, non-semantic changes.

**Compliance**: All PR reviewers are responsible for verifying adherence to this
constitution. Non-compliant PRs MUST be blocked until resolved.

---

**Version**: 1.0.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
