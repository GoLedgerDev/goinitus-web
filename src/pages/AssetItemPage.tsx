import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import type { AxiosError } from 'axios';
import { readAsset } from '@/api/assets';
import type { AssetSchema, AssetRecord } from '@/api/types/asset';
import { AssetDetail } from '@/components/AssetDetail/AssetDetail';
import { AssetHistory } from '@/components/AssetHistory/AssetHistory';
import { QrCodeDialog } from '@/components/QrCodeDialog/QrCodeDialog';
import { useGlobalStore } from '@/store/globalStore';

export function AssetItemPage() {
  const { assetTag, key } = useParams<{ assetTag: string; key: string }>();
  const dataTypeMap = useGlobalStore((s) => s.dataTypeMap);
  const fetchAssetSchema = useGlobalStore((s) => s.fetchAssetSchema);

  const [schema, setSchema] = useState<AssetSchema | null>(null);
  const [asset, setAsset] = useState<AssetRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const tag = assetTag ?? '';
  const assetKey = key ? decodeURIComponent(key) : '';

  // ── Schema + asset fetch (will be replaced by cache in Phase 5) ──────────
  useEffect(() => {
    if (!tag || !assetKey) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    const fetchAll = async () => {
      try {
        const s = await fetchAssetSchema(tag);
        if (cancelled) return;
        setSchema(s);

        const readBody = {
          key: { '@assetType': tag, '@key': assetKey },
          resolve: true as const,
        };
        const a = await readAsset(
          readBody,
          (s.readers ?? []).length > 0 ? s.collection : undefined,
        );
        if (!cancelled) setAsset(a);
      } catch (err: unknown) {
        if (cancelled) return;
        const axiosErr = err as AxiosError;
        if (axiosErr?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(axiosErr?.message ?? 'Failed to load asset');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [tag, assetKey, fetchAssetSchema]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Skeleton variant="text" width="40%" height={40} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={36} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (notFound) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Asset not found. It may have been deleted or the key is invalid.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!schema || !asset) return null;

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h1">
          {schema.label} — Detail
        </Typography>
        <Tooltip title="Show QR code">
          <IconButton aria-label="Show QR code" onClick={() => setQrOpen(true)}>
            <QrCode2Icon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Key: {assetKey}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <AssetDetail schema={schema} asset={asset} dataTypeMap={dataTypeMap} />
      </Paper>

      <Divider sx={{ mb: 2 }} />

      <AssetHistory
        assetTag={tag}
        assetKey={assetKey}
        schema={schema}
        dataTypeMap={dataTypeMap}
      />

      <QrCodeDialog
        open={qrOpen}
        assetKey={assetKey}
        onClose={() => setQrOpen(false)}
      />
    </Box>
  );
}
