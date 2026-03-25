import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useGlobalStore } from '@/store/globalStore';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';

export function HomePage() {
  const schema = useGlobalStore((s) => s.schema);

  return (
    <ErrorBoundary>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center', maxWidth: 480 }}>
          <Typography variant="h4" gutterBottom>
            {schema?.name ?? '—'}
          </Typography>
          {schema?.version && (
            <Typography variant="subtitle1" color="text.secondary">
              Version {schema.version}
            </Typography>
          )}
        </Paper>
      </Box>
    </ErrorBoundary>
  );
}
