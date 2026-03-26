import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import StorageIcon from '@mui/icons-material/Storage';
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate, useLocation } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import type { AssetListElement } from '@/api/types/schema';

interface AssetNavItemProps {
  asset: AssetListElement;
  onNavigate?: () => void;
}

export function AssetNavItem({ asset, onNavigate }: AssetNavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isUnreachable = asset.drawerSection === 'unreachable';
  const isActive = location.pathname.startsWith(`/${asset.tag}`);

  const handleClick = () => {
    if (!isUnreachable) {
      navigate(`/${asset.tag}/list`);
      onNavigate?.();
    }
  };

  const IconComponent =
    asset.drawerSection === 'readWrite'
      ? StorageIcon
      : asset.drawerSection === 'readOnly'
        ? LockIcon
        : BlockIcon;

  return (
    <ListItemButton
      disabled={isUnreachable}
      onClick={handleClick}
      aria-label={asset.label}
      aria-current={isActive ? 'page' : undefined}
      sx={{
        pl: 2,
        borderLeft: '3px solid',
        borderColor: isActive ? 'primary.main' : 'transparent',
        bgcolor: isActive
          ? (theme) => alpha(theme.palette.primary.main, 0.08)
          : 'transparent',
        opacity: isUnreachable ? 0.5 : 1,
      }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <IconComponent fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={asset.label}
        primaryTypographyProps={{ variant: 'body2' }}
      />
    </ListItemButton>
  );
}
