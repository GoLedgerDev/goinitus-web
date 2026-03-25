import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Outlet } from 'react-router-dom';
import { useGlobalStore } from '@/store/globalStore';
import { Header } from '@/components/Header/index';
import { AppDrawer } from '@/components/Drawer/index';
import { BootstrapLoader } from '@/components/BootstrapLoader/BootstrapLoader';
import { ConnectError } from '@/components/ConnectError/ConnectError';
import { CredentialForm } from '@/components/CredentialForm/CredentialForm';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import { ServerConfigPanel } from '@/components/ServerConfigPanel/ServerConfigPanel';
import { useState } from 'react';

export function AppShell() {
  const bootstrapStatus = useGlobalStore((s) => s.bootstrapStatus);
  const needs401Form = useGlobalStore((s) => s.needs401Form);
  const bootstrap = useGlobalStore((s) => s.bootstrap);
  const retry = useGlobalStore((s) => s.retry);

  const [isConfigPanelOpen, setConfigPanelOpen] = useState(false);

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
      <Box sx={{ display: 'flex' }}>
        <Header />
        <AppDrawer />

        {/* Main content area */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {/* Spacer that matches AppBar height */}
          <Toolbar />
          <Outlet />
        </Box>
      </Box>

      {/* 401 credential form — shown on top of successful shell too (token expires mid-session) */}
      <CredentialForm
        open={needs401Form}
        onClose={() => useGlobalStore.getState().dismissCredentialForm()}
      />

      {/* Settings panel reachable from ConnectError "Configure Server" action */}
      <ServerConfigPanel
        open={isConfigPanelOpen}
        onClose={() => setConfigPanelOpen(false)}
      />
    </ErrorBoundary>
  );
}
