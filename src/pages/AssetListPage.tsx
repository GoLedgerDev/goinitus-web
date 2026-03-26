import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import { searchAssets, deleteAsset } from '@/api/assets';
import type { AssetSchema, AssetRecord, SearchQuery, PrivateSearchQuery } from '@/api/types/asset';
import { AssetTable } from '@/components/AssetTable/AssetTable';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog';
import { useGlobalStore } from '@/store/globalStore';

const PAGE_LIMIT = 11; // fetch 11; length === 11 means next page exists

export function AssetListPage() {
  const { assetTag } = useParams<{ assetTag: string }>();
  const navigate = useNavigate();
  const dataTypeMap = useGlobalStore((s) => s.dataTypeMap);
  const checkPermission = useGlobalStore((s) => s.checkPermission);
  const fetchAssetSchema = useGlobalStore((s) => s.fetchAssetSchema);

  const [schema, setSchema] = useState<AssetSchema | null>(null);
  const [rows, setRows] = useState<AssetRecord[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [bookmark, setBookmark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const tag = assetTag ?? '';

  // ── Schema fetch (cached in globalStore) ─────────────────────────────────
  useEffect(() => {
    if (!tag) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchAssetSchema(tag)
      .then((s) => {
        if (!cancelled) {
          setSchema(s);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError((err as Error)?.message ?? 'Failed to load schema');
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [tag, fetchAssetSchema]);

  // ── Data fetch ────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (currentBookmark: string, currentSchema: AssetSchema) => {
      setIsLoading(true);
      setError(null);
      try {
        let body: SearchQuery | PrivateSearchQuery;
        if ((currentSchema.readers ?? []).length > 0 && currentSchema.collection) {
          body = {
            query: {
              selector: { '@assetType': tag },
              collection: currentSchema.collection,
            },
            resolve: true,
          } satisfies PrivateSearchQuery;
        } else {
          body = {
            query: {
              selector: { '@assetType': tag },
              limit: PAGE_LIMIT,
              bookmark: currentBookmark,
            },
            resolve: true,
          } satisfies SearchQuery;
        }

        const result = await searchAssets(body);
        const fetched = result.result;
        const next = fetched.length === PAGE_LIMIT;
        const displayRows = next ? fetched.slice(0, PAGE_LIMIT - 1) : fetched;

        setRows(displayRows);
        setHasNextPage(next);
        setBookmark(result.metadata.bookmark);
      } catch (err: unknown) {
        setError((err as Error)?.message ?? 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    },
    [tag],
  );

  // Trigger data fetch once schema is ready
  useEffect(() => {
    if (schema) {
      fetchData('', schema);
    }
  }, [schema, fetchData]);

  const handleNextPage = () => {
    if (schema) fetchData(bookmark, schema);
  };

  const canWrite = schema ? checkPermission(schema.writers ?? []) : false;

  // ── Delete flow ───────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!confirmKey || !schema) return;
    const keyToDelete = confirmKey;
    setConfirmKey(null);
    try {
      await deleteAsset({ key: { '@assetType': tag, '@key': keyToDelete } });
      toast.success('Asset deleted');
      if (schema) fetchData('', schema);
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Delete failed');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (error && !schema) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => {
              setError(null);
              setSchema(null);
              setIsLoading(true);
              fetchAssetSchema(tag)
                .then(setSchema)
                .catch((e: unknown) => setError((e as Error)?.message ?? 'Failed'));
            }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!schema) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h1">
          {schema.label}
        </Typography>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/${tag}/create`)}
          >
            Create
          </Button>
        )}
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchData('', schema)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!isLoading && rows.length === 0 && !error && (
        <Typography color="text.secondary">No records found.</Typography>
      )}

      {(isLoading || rows.length > 0) && (
        <AssetTable
          schema={schema}
          rows={rows}
          loading={isLoading}
          hasNextPage={hasNextPage}
          dataTypeMap={dataTypeMap}
          canWrite={canWrite}
          onView={(key) => navigate(`/${tag}/item/${encodeURIComponent(key)}`)}
          onEdit={(key) => navigate(`/${tag}/item/${encodeURIComponent(key)}/edit`)}
          onDelete={(key) => setConfirmKey(key)}
          onNextPage={handleNextPage}
        />
      )}

      <ConfirmDialog
        open={confirmKey !== null}
        title="Delete asset"
        message={`Are you sure you want to permanently delete "${confirmKey}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmKey(null)}
      />
    </Box>
  );
}
