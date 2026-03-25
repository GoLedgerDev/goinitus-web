import { Box, Skeleton, Stack } from '@mui/material';

export function BootstrapLoader() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }} aria-label="Loading application…" role="status">
      {/* App bar skeleton */}
      <Skeleton variant="rectangular" width="100%" height={64} animation="wave" />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Drawer skeleton */}
        <Box sx={{ width: 240, p: 2, borderRight: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1.5}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={36} animation="wave" />
            ))}
          </Stack>
        </Box>
        {/* Content skeleton */}
        <Box sx={{ flex: 1, p: 4 }}>
          <Skeleton variant="text" width="40%" height={48} animation="wave" />
          <Skeleton variant="text" width="25%" height={28} animation="wave" sx={{ mt: 1 }} />
        </Box>
      </Box>
    </Box>
  );
}
