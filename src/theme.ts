import { createTheme, type Theme } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';

const FALLBACK_COLOR = '#1976d2';

/**
 * Builds a fully configured MUI theme keyed on the connected chaincode's primary colour.
 * @param primaryHex - Hex colour string (e.g. '#1976d2'). Falls back to '#1976d2' if null/invalid.
 * @returns A fully configured MUI Theme. Callers MUST memoize — this returns a new object every call.
 */
export function buildTheme(primaryHex: string | null | undefined): Theme {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: primaryHex || FALLBACK_COLOR,
      },
      background: {
        default: '#f8f9fb',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", system-ui, sans-serif',
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      subtitle2: {
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 0,
            borderRadius: 10,
            overflow: 'hidden',
          },
        },
      },
      MuiPaper: {
        variants: [
          {
            props: { variant: 'outlined' },
            style: { borderColor: 'rgba(0,0,0,0.08)' },
          },
        ],
      },
    },
  });
}
