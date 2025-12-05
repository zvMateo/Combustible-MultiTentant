import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

export interface DataTableColumn<T> {
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
// Eliminado: no es necesario

export interface DataTableProps<T extends { id: number | string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  emptyMessage?: string;
  rowHeight?: number;
  height?: number;
}

export default function VirtualizedTable<T extends { id: number | string }>(
  props: DataTableProps<T>
) {
  const {
    columns,
    data,
    onEdit,
    onDelete,
    onView,
    emptyMessage = "No hay datos para mostrar",
    // rowHeight = 48,
    // height = 400,
  } = props;

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);

  const columnWidths = [140, 140, 120, 80, 80, 100, 100, 180, 120];
  const hasEmpresa = columns.some((col) => col.field === "empresaNombre");
  const widths = hasEmpresa ? [...columnWidths, 140] : columnWidths;

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderCellContent = (row: T, column: DataTableColumn<T>) => {
    const value = row[column.field as keyof T];
    if (column.render) return column.render(row);
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
    <Paper elevation={2} sx={{ borderRadius: 2, overflowX: "auto", mb: 2 }}>
      <TableContainer>
        <Table
          sx={{
            tableLayout: "fixed",
            minWidth: widths.reduce((a, b) => a + b, 0),
          }}
        >
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              {columns.map((column, idx) => (
                <TableCell
                  key={String(column.field)}
                  sx={{
                    fontWeight: "bold",
                    width: widths[idx],
                    maxWidth: widths[idx],
                    minWidth: widths[idx],
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.headerName}
                </TableCell>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    width: 100,
                    maxWidth: 100,
                    minWidth: 100,
                  }}
                >
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow key={row.id} hover>
                  {columns.map((column, idx) => (
                    <TableCell
                      key={String(column.field)}
                      sx={{
                        width: widths[idx],
                        maxWidth: widths[idx],
                        minWidth: widths[idx],
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        p: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          px: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {renderCellContent(row, column)}
                      </Box>
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableCell
                      sx={{ width: 100, maxWidth: 100, minWidth: 100 }}
                    >
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
      <TablePagination
        component="div"
        count={data.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage="Filas por página"
      />
    </Paper>
  );
  // Fin del componente
}

