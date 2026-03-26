import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import { useGlobalStore } from '@/store/globalStore';

interface HeaderProps {
  showMenuButton: boolean;
  onMenuClick: () => void;
}

export function Header({ showMenuButton, onMenuClick }: HeaderProps) {
  const schema = useGlobalStore((s) => s.schema);

  return (
    <AppBar position="sticky">
      <Toolbar>
        {showMenuButton && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
          {schema?.name ?? 'GoInitus'}
        </Typography>

        {schema?.version && (
          <Box component="span" sx={{ opacity: 0.75, fontSize: '0.8rem' }}>
            v{schema.version}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

