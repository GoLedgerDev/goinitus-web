/**
 * Contract: src/theme.ts
 *
 * Defines the public API of the theme factory module.
 * This module has no named exports beyond `buildTheme`.
 * No class, no default export — named export only for tree-shaking clarity.
 */

import type { Theme } from '@mui/material/styles';

/**
 * Builds a fully configured MUI Theme from a primary hex colour.
 *
 * Rules:
 * - primaryHex null/undefined/'' → falls back to the MUI default primary '#1976d2'.
 * - The returned Theme is a new object on every call; callers MUST memoize.
 * - Pure function: no side-effects, no module-level state.
 * - Configures: palette, typography (Inter), shape (borderRadius 10),
 *   and the following component overrides:
 *     MuiButton      → textTransform: none, fontWeight: 600
 *     MuiAppBar      → boxShadow: none, borderBottom muted
 *     MuiDataGrid    → border: 0, borderRadius: 10
 *     MuiPaper       → outlined variant borderColor muted
 */
export declare function buildTheme(primaryHex: string | null | undefined): Theme;

/**
 * Usage in App.tsx:
 *
 *   import { buildTheme } from '@/theme';
 *
 *   const orgColor = useGlobalStore((s) => s.orgColor);
 *   const theme = useMemo(() => buildTheme(orgColor), [orgColor]);
 *
 *   return (
 *     <ThemeProvider theme={theme}>
 *       ...
 *     </ThemeProvider>
 *   );
 */
