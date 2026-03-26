import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppShell } from '@/layout/AppShell';
import { BootstrapLoader } from '@/components/BootstrapLoader/BootstrapLoader';
import { buildTheme } from '@/theme';
import { useGlobalStore } from '@/store/globalStore';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const AssetListPage = lazy(() => import('@/pages/AssetListPage').then((m) => ({ default: m.AssetListPage })));
const AssetItemPage = lazy(() => import('@/pages/AssetItemPage').then((m) => ({ default: m.AssetItemPage })));

export default function App() {
  const orgColor = useGlobalStore((s) => s.orgColor);
  const theme = useMemo(() => buildTheme(orgColor), [orgColor]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route
            index
            element={
              <Suspense fallback={<BootstrapLoader />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path=":assetTag/list"
            element={
              <Suspense fallback={<BootstrapLoader />}>
                <AssetListPage />
              </Suspense>
            }
          />
          <Route
            path=":assetTag/item/:key"
            element={
              <Suspense fallback={<BootstrapLoader />}>
                <AssetItemPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
