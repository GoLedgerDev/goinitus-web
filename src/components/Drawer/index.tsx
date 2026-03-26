import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SettingsIcon from '@mui/icons-material/Settings';
import { useGlobalStore } from '@/store/globalStore';
import { AssetNavItem } from './AssetNavItem';
import { TxNavItem } from './TxNavItem';

const DRAWER_WIDTH = 240;

interface AppDrawerProps {
  variant: 'permanent' | 'temporary';
  open: boolean;
  onClose: () => void;
  onSettingsClick: () => void;
}

export function AppDrawer({ variant, open, onClose, onSettingsClick }: AppDrawerProps) {
  const schema = useGlobalStore((s) => s.schema);
  const assetList = useGlobalStore((s) => s.assetList);
  const transactionList = useGlobalStore((s) => s.transactionList);

  const readWriteAssets = assetList.filter((a) => a.drawerSection === 'readWrite');
  const readOnlyAssets  = assetList.filter((a) => a.drawerSection === 'readOnly');
  const unreachableAssets = assetList.filter((a) => a.drawerSection === 'unreachable');

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={variant === 'temporary' ? { keepMounted: true } : undefined}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Brand header */}
        <Box sx={{ px: 2, py: 2.5 }}>
          <Typography variant="subtitle2" noWrap>
            {schema?.name ?? '—'}
          </Typography>
        </Box>
        <Divider />

        {/* Scrollable nav area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {readWriteAssets.length > 0 && (
            <>
              <List
                subheader={<ListSubheader component="div">Assets</ListSubheader>}
                disablePadding
              >
                {readWriteAssets.map((asset) => (
                  <AssetNavItem key={asset.tag} asset={asset} onNavigate={onClose} />
                ))}
              </List>
              <Divider />
            </>
          )}

          {readOnlyAssets.length > 0 && (
            <>
              <List
                subheader={<ListSubheader component="div">Private Assets</ListSubheader>}
                disablePadding
              >
                {readOnlyAssets.map((asset) => (
                  <AssetNavItem key={asset.tag} asset={asset} onNavigate={onClose} />
                ))}
              </List>
              <Divider />
            </>
          )}

          {unreachableAssets.length > 0 && (
            <>
              <List
                subheader={<ListSubheader component="div">Blocked Assets</ListSubheader>}
                disablePadding
              >
                {unreachableAssets.map((asset) => (
                  <AssetNavItem key={asset.tag} asset={asset} onNavigate={onClose} />
                ))}
              </List>
              <Divider />
            </>
          )}

          {transactionList.length > 0 && (
            <List
              subheader={<ListSubheader component="div">Transactions</ListSubheader>}
              disablePadding
            >
              {transactionList.map((tx) => (
                <TxNavItem key={tx.tag} tx={tx} onNavigate={onClose} />
              ))}
            </List>
          )}
        </Box>

        {/* Bottom-pinned settings */}
        <Divider />
        <List disablePadding>
          <ListItemButton onClick={onSettingsClick} aria-label="Open settings">
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}

