import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid';
import { useMemo } from 'react';
import { formatFieldValue } from '@/utils/fieldFormatters';
import type { AssetSchema, AssetRecord } from '@/api/types/asset';
import type { DataTypeMap } from '@/api/types/dataType';

interface AssetTableProps {
  schema: AssetSchema;
  rows: AssetRecord[];
  loading: boolean;
  hasNextPage: boolean;
  dataTypeMap: DataTypeMap;
  canWrite: boolean;
  onView: (key: string) => void;
  onEdit: (key: string) => void;
  onDelete: (key: string) => void;
  onNextPage: () => void;
}

export function AssetTable({
  schema,
  rows,
  loading,
  hasNextPage,
  dataTypeMap,
  canWrite,
  onView,
  onEdit,
  onDelete,
  onNextPage,
}: AssetTableProps) {
  const columns: GridColDef[] = useMemo(() => {
    const propCols: GridColDef[] = schema.props.map((prop) => ({
      field: prop.tag,
      headerName: prop.label,
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) =>
        formatFieldValue(params.value, prop.dataType, dataTypeMap),
    }));

    const actionsCol: GridColDef = {
      field: '__actions__',
      headerName: 'Actions',
      width: canWrite ? 120 : 60,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const key = params.row['@key'] as string;
        return (
          <Stack direction="row">
            <Tooltip title="View">
              <IconButton
                size="small"
                aria-label={`View ${key}`}
                onClick={() => onView(key)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canWrite && (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    aria-label={`Edit ${key}`}
                    onClick={() => onEdit(key)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    aria-label={`Delete ${key}`}
                    onClick={() => onDelete(key)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        );
      },
    };

    return [...propCols, actionsCol];
  }, [schema.props, dataTypeMap, canWrite, onView, onEdit, onDelete]);

  if (loading && rows.length === 0) {
    return (
      <Stack spacing={1}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={40} />
        ))}
      </Stack>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row['@key'] as string}
        paginationMode="server"
        hideFooterPagination
        disableRowSelectionOnClick
        autoHeight
        loading={loading}
        sx={{ '& .MuiDataGrid-cell': { alignItems: 'center' } }}
      />
      {hasNextPage && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Load next page">
            <span>
              <IconButton
                onClick={onNextPage}
                disabled={loading}
                aria-label="Load next page"
                size="small"
              >
                ›
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
