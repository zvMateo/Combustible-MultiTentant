import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";

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
  const badgeClassByColor = (color:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning") => {
    switch (color) {
      case "success":
        return "bg-emerald-100 text-emerald-700";
      case "error":
        return "bg-red-100 text-red-700";
      case "warning":
        return "bg-amber-100 text-amber-700";
      case "info":
        return "bg-sky-100 text-sky-700";
      case "primary":
        return "bg-blue-100 text-blue-700";
      case "secondary":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const renderCellContent = (row: T, column: DataTableColumn<T>) => {
    const value = row[column.field as keyof T];

    if (column.render) {
      return column.render(row);
    }

    if (column.type === "badge") {
      const color = column.getColor ? column.getColor(value) : "default";
      return (
        <Badge
          className={
            "h-6 rounded-md px-2 text-[11px] font-semibold " +
            badgeClassByColor(color)
          }
        >
          {String(value)}
        </Badge>
      );
    }

    if (column.type === "boolean") {
      const boolValue = Boolean(value);
      return (
        <Badge
          className={
            "h-6 rounded-md px-2 text-[11px] font-semibold " +
            (boolValue
              ? badgeClassByColor("success")
              : badgeClassByColor("default"))
          }
        >
          {boolValue ? "Sí" : "No"}
        </Badge>
      );
    }

    return String(value ?? "");
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md">
      <Table>
        <TableHeader className="bg-[#f5f5f5]">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={String(column.field)}
                className="font-bold text-slate-900"
              >
                {column.headerName}
              </TableHead>
            ))}
            {(onEdit || onDelete || onView) && (
              <TableHead className="font-bold text-slate-900">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center">
                <div className="py-10 text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <TableCell key={String(column.field)}>
                    {renderCellContent(row, column)}
                  </TableCell>
                ))}
                {(onEdit || onDelete || onView) && (
                  <TableCell>
                    <div className="flex gap-1">
                      {onView && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-sky-700"
                          onClick={() => onView(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-700"
                          onClick={() => onEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-700"
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 className="h-4 w-4" />
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
  );
}

