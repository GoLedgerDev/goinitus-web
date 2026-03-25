import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { useGlobalStore } from '@/store/globalStore';
import { AssetNavItem } from './AssetNavItem';
import { TxNavItem } from './TxNavItem';

const DRAWER_WIDTH = 260;

export function AppDrawer() {
  const isDrawerOpen = useGlobalStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useGlobalStore((s) => s.setDrawerOpen);
  const assetList = useGlobalStore((s) => s.assetList);
  const transactionList = useGlobalStore((s) => s.transactionList);

  const close = () => setDrawerOpen(false);

  const readWriteAssets = assetList.filter((a) => a.drawerSection === 'readWrite');
  const readOnlyAssets  = assetList.filter((a) => a.drawerSection === 'readOnly');
  const unreachableAssets = assetList.filter((a) => a.drawerSection === 'unreachable');

  return (
    <Drawer
      variant="temporary"
      open={isDrawerOpen}
      onClose={close}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      {/* Spacer so content starts below AppBar */}
      <Toolbar />

      <Box sx={{ overflow: 'auto' }}>
        {readWriteAssets.length > 0 && (
          <>
            <List
              subheader={
                <ListSubheader component="div">Assets</ListSubheader>
              }
              disablePadding
            >
              {readWriteAssets.map((asset) => (
                <AssetNavItem key={asset.tag} asset={asset} onNavigate={close} />
              ))}
            </List>
            <Divider />
          </>
        )}

        {readOnlyAssets.length > 0 && (
          <>
            <List
              subheader={
                <ListSubheader component="div">Assets (Read Only)</ListSubheader>
              }
              disablePadding
            >
              {readOnlyAssets.map((asset) => (
                <AssetNavItem key={asset.tag} asset={asset} onNavigate={close} />
              ))}
            </List>
            <Divider />
          </>
        )}

        {unreachableAssets.length > 0 && (
          <>
            <List
              subheader={
                <ListSubheader component="div">Assets (Unreachable)</ListSubheader>
              }
              disablePadding
            >
              {unreachableAssets.map((asset) => (
                <AssetNavItem key={asset.tag} asset={asset} onNavigate={close} />
              ))}
            </List>
            <Divider />
          </>
        )}

        {transactionList.length > 0 && (
          <List
            subheader={
              <ListSubheader component="div">Transactions</ListSubheader>
            }
            disablePadding
          >
            {transactionList.map((tx) => (
              <TxNavItem key={tx.tag} tx={tx} onNavigate={close} />
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}
