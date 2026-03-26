import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useNavigate, useLocation } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import type { TransactionListElement } from '@/api/types/transaction';

interface TxNavItemProps {
  tx: TransactionListElement;
  onNavigate?: () => void;
}

export function TxNavItem({ tx, onNavigate }: TxNavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith(`/${tx.tag}/transaction`);

  const handleClick = () => {
    navigate(`/${tx.tag}/transaction`);
    onNavigate?.();
  };

  return (
    <ListItemButton
      onClick={handleClick}
      aria-label={tx.label}
      aria-current={isActive ? 'page' : undefined}
      sx={{
        pl: 2,
        borderLeft: '3px solid',
        borderColor: isActive ? 'primary.main' : 'transparent',
        bgcolor: isActive
          ? (theme) => alpha(theme.palette.primary.main, 0.08)
          : 'transparent',
      }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <SwapHorizIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={tx.label}
        primaryTypographyProps={{ variant: 'body2' }}
      />
    </ListItemButton>
  );
}
