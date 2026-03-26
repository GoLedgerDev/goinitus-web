import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Outlet } from 'react-router-dom';
import { useGlobalStore } from '@/store/globalStore';
import { Header } from '@/components/Header/index';
import { AppDrawer } from '@/components/Drawer/index';
import { BootstrapLoader } from '@/components/BootstrapLoader/BootstrapLoader';
import { ConnectError } from '@/components/ConnectError/ConnectError';
import { CredentialForm } from '@/components/CredentialForm/CredentialForm';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import { ServerConfigPanel } from '@/components/ServerConfigPanel/ServerConfigPanel';

export function AppShell() {
  const bootstrapStatus = useGlobalStore((s) => s.bootstrapStatus);
  const needs401Form = useGlobalStore((s) => s.needs401Form);
  const bootstrap = useGlobalStore((s) => s.bootstrap);
  const retry = useGlobalStore((s) => s.retry);
  const isDrawerOpen = useGlobalStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useGlobalStore((s) => s.setDrawerOpen);

  const [isConfigPanelOpen, setConfigPanelOpen] = useState(false);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Exactly-once bootstrap guard — globalStore itself checks bootstrapStatus before proceeding
  useEffect(() => {
    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (bootstrapStatus === 'loading' || bootstrapStatus === 'idle') {
    return <BootstrapLoader />;
  }

  if (bootstrapStatus === 'error') {
    return (
      <ConnectError
        onRetry={() => retry()}
        onConfigure={() => setConfigPanelOpen(true)}
      />
    );
  }

  // bootstrapStatus === 'success' — render full shell
  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          showMenuButton={!isDesktop}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <AppDrawer
            variant={isDesktop ? 'permanent' : 'temporary'}
            open={isDrawerOpen}
            onClose={() => setDrawerOpen(false)}
            onSettingsClick={() => setConfigPanelOpen(true)}
          />
          <Box component="main" sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>

      {/* 401 credential form — shown on top of successful shell too (token expires mid-session) */}
      <CredentialForm
        open={needs401Form}
        onClose={() => useGlobalStore.getState().dismissCredentialForm()}
      />

      {/* Settings panel — reachable from Drawer bottom settings item and ConnectError */}
      <ServerConfigPanel
        open={isConfigPanelOpen}
        onClose={() => setConfigPanelOpen(false)}
      />
    </ErrorBoundary>
  );
}

