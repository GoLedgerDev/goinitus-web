import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useNavigate } from 'react-router-dom';
import type { AssetListElement } from '@/api/types/schema';

interface AssetNavItemProps {
  asset: AssetListElement;
  onNavigate?: () => void;
}

export function AssetNavItem({ asset, onNavigate }: AssetNavItemProps) {
  const navigate = useNavigate();
  const isUnreachable = asset.drawerSection === 'unreachable';

  const handleClick = () => {
    if (!isUnreachable) {
      navigate(`/${asset.tag}/list`);
      onNavigate?.();
    }
  };

  return (
    <ListItemButton
      disabled={isUnreachable}
      onClick={handleClick}
      aria-label={asset.label}
      sx={{ pl: 4, opacity: isUnreachable ? 0.5 : 1 }}
    >
      <ListItemText
        primary={asset.label}
        primaryTypographyProps={{ variant: 'body2' }}
      />
    </ListItemButton>
  );
}
