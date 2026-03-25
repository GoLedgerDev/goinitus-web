import { Box, Typography, Button, Stack } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

interface ConnectErrorProps {
  message?: string;
  onRetry: () => void;
  onConfigure: () => void;
}

export function ConnectError({ message, onRetry, onConfigure }: ConnectErrorProps) {
  return (
    <Box
      role="alert"
      aria-label="Connection error"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        p: 4,
      }}
    >
      <WifiOffIcon sx={{ fontSize: 64, color: 'text.secondary' }} aria-hidden="true" />
      <Typography variant="h5">Cannot connect to GoFabric server</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={480}>
        {message ?? 'The server is unreachable or returned an unexpected error. Check your server address and try again.'}
      </Typography>
      <Stack direction="row" spacing={2} mt={1}>
        <Button variant="contained" onClick={onRetry} aria-label="Retry connection">
          Retry
        </Button>
        <Button variant="outlined" onClick={onConfigure} aria-label="Open server configuration">
          Configure Server
        </Button>
      </Stack>
    </Box>
  );
}
