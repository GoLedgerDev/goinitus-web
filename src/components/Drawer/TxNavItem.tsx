import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useNavigate } from 'react-router-dom';
import type { TransactionListElement } from '@/api/types/transaction';

interface TxNavItemProps {
  tx: TransactionListElement;
  onNavigate?: () => void;
}

export function TxNavItem({ tx, onNavigate }: TxNavItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${tx.tag}/transaction`);
    onNavigate?.();
  };

  return (
    <ListItemButton
      onClick={handleClick}
      aria-label={tx.label}
      sx={{ pl: 4 }}
    >
      <ListItemText
        primary={tx.label}
        primaryTypographyProps={{ variant: 'body2' }}
      />
    </ListItemButton>
  );
}
