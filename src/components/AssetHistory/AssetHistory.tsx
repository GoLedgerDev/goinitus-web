import { useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { readAssetHistory } from '@/api/assets';
import type { AssetSchema, AssetHistoryEntry } from '@/api/types/asset';
import type { DataTypeMap } from '@/api/types/dataType';
import { AssetDetail } from '@/components/AssetDetail/AssetDetail';
import type { AssetRecord } from '@/api/types/asset';

interface AssetHistoryProps {
  assetTag: string;
  assetKey: string;
  schema: AssetSchema;
  dataTypeMap: DataTypeMap;
}

export function AssetHistory({ assetTag, assetKey, schema, dataTypeMap }: AssetHistoryProps) {
  const [entries, setEntries] = useState<AssetHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExpand = async (_: React.SyntheticEvent, expanded: boolean) => {
    if (!expanded || loaded) return;
    setLoading(true);
    setError(null);
    try {
      const result = await readAssetHistory({
        key: { '@assetType': assetTag, '@key': assetKey, resolve: true },
        resolve: true,
      });
      // Reverse: API returns oldest-first; we display newest-first (FR-015)
      setEntries([...result.result].reverse());
      setLoaded(true);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Accordion onChange={handleExpand}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="history-content" id="history-header">
        <Typography variant="subtitle1">Ledger History</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && loaded && entries.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No history available.
          </Typography>
        )}
        {entries.map((entry, i) => (
          <Card key={i} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip label={entry._timestamp} size="small" variant="outlined" />
                <Chip label={entry['@lastTouchBy'] as string} size="small" />
                {entry.isDelete && <Chip label="Deleted" size="small" color="error" />}
              </Box>
              <AssetDetail
                schema={schema}
                asset={entry as AssetRecord}
                dataTypeMap={dataTypeMap}
              />
            </CardContent>
          </Card>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
