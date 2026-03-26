/**
 * Contract: Component Interface Patches
 *
 * Documents the prop interface changes for components modified in Feature 003.
 * "Patch" means: only changed/added props are shown. Unchanged props from Feature 002
 * are omitted — they continue to exist as-is.
 */

// ---------------------------------------------------------------------------
// AppDrawer (src/components/Drawer/index.tsx)
// ---------------------------------------------------------------------------

interface AppDrawerProps {
  /**
   * Drawer render mode.
   * - 'permanent': always visible on desktop (md+). `open`/`onClose` are ignored.
   * - 'temporary': overlay mode on mobile. Requires `open`/`onClose`.
   *
   * Determined by AppShell using useMediaQuery(theme.breakpoints.up('md')).
   */
  variant: 'permanent' | 'temporary';

  /**
   * Whether the overlay drawer is open. Ignored when variant='permanent'.
   */
  open: boolean;

  /**
   * Called when the user closes the overlay drawer (backdrop click / keyboard).
   * Ignored when variant='permanent'.
   */
  onClose: () => void;

  /**
   * Called when the user clicks the bottom-pinned settings item.
   * The parent (AppShell) owns the ServerConfigPanel state and opens it in response.
   */
  onSettingsClick: () => void;
}

// ---------------------------------------------------------------------------
// AssetNavItem (src/components/Drawer/AssetNavItem.tsx)
// ---------------------------------------------------------------------------

/**
 * Previously: no icon, no active highlight.
 * Now: renders a contextual icon, applies active route highlight.
 * The `onNavigate` prop is unchanged.
 *
 * Icon is derived internally from `asset.drawerSection`:
 *   'readWrite'   → StorageIcon
 *   'readOnly'    → LockIcon
 *   'unreachable' → BlockIcon (muted)
 *
 * Active state is derived internally from useLocation().pathname.
 */

// No new props. All additions are internal derivations from existing props.
// The component signature remains: AssetNavItemProps { asset: AssetListElement; onNavigate?: () => void }

// ---------------------------------------------------------------------------
// TxNavItem (src/components/Drawer/TxNavItem.tsx)
// ---------------------------------------------------------------------------

/**
 * Previously: no icon, no active highlight.
 * Now: renders SwapHorizIcon, applies active route highlight.
 * The `onNavigate` prop is unchanged.
 *
 * Active state is derived internally from useLocation().pathname.
 */

// No new props. Signature remains: TxNavItemProps { tx: TransactionListElement; onNavigate?: () => void }

// ---------------------------------------------------------------------------
// Header (src/components/Header/index.tsx)
// ---------------------------------------------------------------------------

interface HeaderProps {
  /**
   * NEW: Whether to render the hamburger (menu) icon button.
   * - true  → rendered (mobile viewport, passed from AppShell)
   * - false → not rendered (desktop viewport — drawer is permanent)
   *
   * This replaces the unconditional render the hamburger previously had.
   * AppShell passes: showMenuButton={!isDesktop}
   */
  showMenuButton: boolean;

  /**
   * NEW: Callback to open the overlay drawer. Only called when showMenuButton=true.
   * Replaces direct coupling to useGlobalStore.setDrawerOpen inside Header.
   * Passed from AppShell as: onMenuClick={() => setDrawerOpen(true)}
   */
  onMenuClick: () => void;
}

// Removed props (settings gear moved to Drawer):
//   Previously Header called setSettingsOpen internally → entire settings IconButton removed.
//   ServerConfigPanel import removed from Header.

// ---------------------------------------------------------------------------
// AssetTable (src/components/AssetTable/AssetTable.tsx)
// ---------------------------------------------------------------------------

interface AssetTablePropsAdditions {
  /**
   * NEW: Whether a previous page is available.
   * True when the page stack has more than the initial empty entry.
   */
  hasPrevPage: boolean;

  /**
   * NEW: Callback to load the previous page.
   */
  onPrevPage: () => void;
}

// Existing props retained as-is:
//   hasNextPage: boolean  → unchanged, still drives "Next →" disabled state
//   onNextPage: () => void → unchanged

// Removed props: None. All existing props remain.

// Visual changes (no prop changes required):
//   - Actions column: collapses 3 icon buttons into MoreVertIcon + Menu
//   - Row backgrounds: alternating via getRowClassName + sx
//   - Pagination area: bare IconButton replaced by labelled Button components

// ---------------------------------------------------------------------------
// AssetDetail (src/components/AssetDetail/AssetDetail.tsx)
// ---------------------------------------------------------------------------

// No prop interface changes. Signature remains:
//   AssetDetailProps { schema: AssetSchema; asset: AssetRecord; dataTypeMap: DataTypeMap }

// Visual changes only:
//   - List → CSS grid (display: 'grid', gridTemplateColumns: '200px 1fr')
//   - Left cell: prop.label, right-aligned, text.secondary
//   - Right cell: formatFieldValue output, text.primary
//   - Alternating row backgrounds
//   - KEY chip when prop.isKey === true (sourced from InputType.isKey)

// ---------------------------------------------------------------------------
// AssetItemPage (src/pages/AssetItemPage.tsx)
// ---------------------------------------------------------------------------

// No prop interface changes (it is a page component, no external props).

// Visual changes:
//   - Header Stack → outlined Paper card with h5 label + monospace @key + QR IconButton
//   - caption key display moved into the header card

// ---------------------------------------------------------------------------
// AssetListPage (src/pages/AssetListPage.tsx)
// ---------------------------------------------------------------------------

// No prop interface changes (it is a page component, no external props).

// Visual changes:
//   - Header Stack → outlined Paper card with h5 label + record count + Create Button right-aligned
//   - Pagination: adds hasPrevPage/onPrevPage props to AssetTable call

// Logic changes:
//   - Add pageStack state (see data-model.md)
//   - handleNextPage and handlePrevPage updated (see data-model.md)
//   - fetchData return value stores nextBookmark from result.metadata.bookmark (unchanged)
