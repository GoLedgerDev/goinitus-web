import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import Box from '@mui/material/Box';
import { useGlobalStore } from '@/store/globalStore';
import { ServerConfigPanel } from '@/components/ServerConfigPanel/ServerConfigPanel';

export function Header() {
  const schema = useGlobalStore((s) => s.schema);
  const orgColor = useGlobalStore((s) => s.orgColor);
  const setDrawerOpen = useGlobalStore((s) => s.setDrawerOpen);

  const [isSettingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: orgColor ?? 'primary.main',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
            {schema?.name ?? 'GoInitus'}
          </Typography>

          {schema?.version && (
            <Box component="span" sx={{ mr: 2, opacity: 0.75, fontSize: '0.8rem' }}>
              v{schema.version}
            </Box>
          )}

          <IconButton
            color="inherit"
            onClick={() => setSettingsOpen(true)}
            aria-label="open settings"
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <ServerConfigPanel
        open={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
