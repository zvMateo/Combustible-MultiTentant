import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

interface DataTableColumn<T> {
  field: keyof T | string;
  headerName: string;
  type?: "badge" | "boolean" | "text";
  render?: (row: T) => React.ReactNode;
  getColor?: (
    value: unknown
  ) =>
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning";
}

interface DataTableProps<T extends { id: number | string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  emptyMessage = "No hay datos para mostrar",
}: DataTableProps<T>) {
  const renderCellContent = (row: T, column: DataTableColumn<T>) => {
    const value = row[column.field as keyof T];

    if (column.render) {
      return column.render(row);
    }

    if (column.type === "badge") {
      const color = column.getColor ? column.getColor(value) : "default";
      return <Chip label={String(value)} color={color} size="small" />;
    }

    if (column.type === "boolean") {
      const boolValue = Boolean(value);
      return (
        <Chip
          label={boolValue ? "Sí" : "No"}
          color={boolValue ? "success" : "default"}
          size="small"
        />
      );
    }

    return String(value ?? "");
  };

  return (
    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: "#f5f5f5" }}>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={String(column.field)} sx={{ fontWeight: "bold" }}>
                {column.headerName}
              </TableCell>
            ))}
            {(onEdit || onDelete || onView) && (
              <TableCell sx={{ fontWeight: "bold" }}>Acciones</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} align="center">
                <Box sx={{ py: 4 }}>
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id} hover>
                {columns.map((column) => (
                  <TableCell key={String(column.field)}>
                    {renderCellContent(row, column)}
                  </TableCell>
                ))}
                {(onEdit || onDelete || onView) && (
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {onView && (
                        <IconButton
                          size="small"
                          onClick={() => onView(row)}
                          color="info"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      )}
                      {onEdit && (
                        <IconButton
                          size="small"
                          onClick={() => onEdit(row)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {onDelete && (
                        <IconButton
                          size="small"
                          onClick={() => onDelete(row)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

