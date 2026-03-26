import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppShell } from '@/layout/AppShell';
import { BootstrapLoader } from '@/components/BootstrapLoader/BootstrapLoader';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const AssetListPage = lazy(() => import('@/pages/AssetListPage').then((m) => ({ default: m.AssetListPage })));
const AssetItemPage = lazy(() => import('@/pages/AssetItemPage').then((m) => ({ default: m.AssetItemPage })));

const theme = createTheme();

export default function App() {
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
