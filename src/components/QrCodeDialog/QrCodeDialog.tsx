import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import QRCode from 'react-qr-code';

interface QrCodeDialogProps {
  open: boolean;
  assetKey: string;
  onClose: () => void;
}

export function QrCodeDialog({ open, assetKey, onClose }: QrCodeDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="qr-dialog-title">
      <DialogTitle id="qr-dialog-title">
        Asset QR Code
        <IconButton
          aria-label="Close QR code dialog"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <QRCode value={assetKey} size={220} />
      </DialogContent>
    </Dialog>
  );
}
