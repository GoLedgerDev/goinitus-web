import { Fragment } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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
  if (schema.props.length === 0) {
    return (
      <Box sx={{ py: 1.5, px: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No properties defined for this asset type.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}>
      {schema.props.map((prop, index) => {
        const rowBg = index % 2 === 0 ? '#f8f9fb' : '#ffffff';
        return (
          <Fragment key={prop.tag}>
            {/* Label cell */}
            <Box
              sx={{
                py: 1.5,
                px: 2,
                textAlign: 'right',
                bgcolor: rowBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {prop.label}
              </Typography>
              {prop.isKey && (
                <Chip
                  label="KEY"
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
            {/* Value cell */}
            <Box
              sx={{
                py: 1.5,
                px: 2,
                bgcolor: rowBg,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {formatFieldValue(asset[prop.tag], prop.dataType, dataTypeMap)}
              </Typography>
            </Box>
          </Fragment>
        );
      })}
    </Box>
  );
}
