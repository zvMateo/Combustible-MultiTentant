import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

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
  } = props;

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getBadgeVariant = (color: string) => {
    if (color === "success") return "default";
    if (color === "error") return "destructive";
    return "secondary";
  };

  const renderCellContent = (row: T, column: DataTableColumn<T>) => {
    const value = row[column.field as keyof T];
    if (column.render) return column.render(row);
    if (column.type === "badge") {
      const color = column.getColor ? column.getColor(value) : "default";
      return <Badge variant={getBadgeVariant(color)}>{String(value)}</Badge>;
    }
    if (column.type === "boolean") {
      const boolValue = Boolean(value);
      return (
        <Badge variant={boolValue ? "default" : "secondary"}>
          {boolValue ? "Sí" : "No"}
        </Badge>
      );
    }
    return String(value ?? "");
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead key={String(column.field)} className="font-semibold">
                  {column.headerName}
                </TableHead>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableHead className="font-semibold w-[100px]">
                  Acciones
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.field)}
                      className="truncate max-w-[200px]"
                    >
                      {renderCellContent(row, column)}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(row)}
                            className="h-8 w-8"
                          >
                            <Eye className="size-4 text-blue-500" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row)}
                            className="h-8 w-8"
                          >
                            <Pencil className="size-4 text-primary" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filas por página:</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(v) => {
              setRowsPerPage(Number(v));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {page * rowsPerPage + 1}-
            {Math.min((page + 1) * rowsPerPage, data.length)} de {data.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
