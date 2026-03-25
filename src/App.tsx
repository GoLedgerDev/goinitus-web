import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppShell } from '@/layout/AppShell';
import { BootstrapLoader } from '@/components/BootstrapLoader/BootstrapLoader';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));

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
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
