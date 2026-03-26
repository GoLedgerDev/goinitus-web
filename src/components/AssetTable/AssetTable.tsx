import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { alpha } from '@mui/material/styles';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { formatFieldValue } from '@/utils/fieldFormatters';
import type { AssetSchema, AssetRecord } from '@/api/types/asset';
import type { DataTypeMap } from '@/api/types/dataType';

interface RowMenuState {
  anchorEl: HTMLElement;
  rowKey: string;
}

interface AssetTableProps {
  schema: AssetSchema;
  rows: AssetRecord[];
  loading: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  dataTypeMap: DataTypeMap;
  canWrite: boolean;
  onView: (key: string) => void;
  onEdit: (key: string) => void;
  onDelete: (key: string) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function AssetTable({
  schema,
  rows,
  loading,
  hasNextPage,
  hasPrevPage,
  dataTypeMap,
  canWrite,
  onView,
  onEdit,
  onDelete,
  onNextPage,
  onPrevPage,
}: AssetTableProps) {
  const [menuState, setMenuState] = useState<RowMenuState | null>(null);

  const closeMenu = () => setMenuState(null);

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
      headerName: '',
      width: 56,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const key = params.row['@key'] as string;
        return (
          <IconButton
            size="small"
            aria-label={`Row actions for ${key}`}
            aria-haspopup="true"
            onClick={(e) => setMenuState({ anchorEl: e.currentTarget, rowKey: key })}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        );
      },
    };

    return [...propCols, actionsCol];
  }, [schema.props, dataTypeMap]);

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
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'
        }
        sx={{
          '& .MuiDataGrid-cell': { alignItems: 'center' },
          '& .even-row': { bgcolor: '#f8f9fb' },
          '& .odd-row': { bgcolor: '#ffffff' },
          '& .MuiDataGrid-row:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          },
        }}
      />

      {/* Row actions menu — rendered outside DataGrid to avoid z-index / overflow issues */}
      <Menu
        anchorEl={menuState?.anchorEl}
        open={menuState !== null}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() => {
            const key = menuState!.rowKey;
            closeMenu();
            onView(key);
          }}
        >
          View
        </MenuItem>
        {canWrite && (
          <MenuItem
            onClick={() => {
              const key = menuState!.rowKey;
              closeMenu();
              onEdit(key);
            }}
          >
            Edit
          </MenuItem>
        )}
        {canWrite && (
          <MenuItem
            onClick={() => {
              const key = menuState!.rowKey;
              closeMenu();
              onDelete(key);
            }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>

      {(hasPrevPage || hasNextPage) && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            disabled={!hasPrevPage || loading}
            onClick={onPrevPage}
            startIcon={<ChevronLeftIcon />}
          >
            Previous
          </Button>
          <Button
            size="small"
            disabled={!hasNextPage || loading}
            onClick={onNextPage}
            endIcon={<ChevronRightIcon />}
          >
            Next
          </Button>
        </Stack>
      )}
    </Box>
  );
}

