import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { formatFieldValue } from '@/utils/fieldFormatters';
import type { AssetSchema, AssetRecord } from '@/api/types/asset';
import type { DataTypeMap } from '@/api/types/dataType';

interface AssetDetailProps {
  schema: AssetSchema;
  asset: AssetRecord;
  dataTypeMap: DataTypeMap;
}

export function AssetDetail({ schema, asset, dataTypeMap }: AssetDetailProps) {
  return (
    <List disablePadding>
      {schema.props.map((prop, index) => (
        <div key={prop.tag}>
          <ListItem
            sx={{ py: 1, px: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'baseline' }, gap: 1 }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ minWidth: 180, flexShrink: 0 }}
            >
              {prop.label}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {formatFieldValue(asset[prop.tag], prop.dataType, dataTypeMap)}
            </Typography>
          </ListItem>
          {index < schema.props.length - 1 && <Divider />}
        </div>
      ))}
      {schema.props.length === 0 && (
        <ListItem sx={{ px: 0 }}>
          <Typography variant="body2" color="text.secondary">
            No properties defined for this asset type.
          </Typography>
        </ListItem>
      )}
    </List>
  );
}
