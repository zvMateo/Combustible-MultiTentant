/**
 * CrudTable - Tabla con funcionalidad CRUD integrada
 *
 * Combina DataTable con búsqueda y estados vacíos
 * Principio: Composition over Inheritance
 */
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
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchInput } from "./SearchInput";
import type { CrudTableProps, DataTableColumn, BadgeColor } from "./types";

/**
 * Mapeo de colores de badge a clases CSS
 */
const BADGE_COLOR_CLASSES: Record<BadgeColor, string> = {
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-sky-100 text-sky-700",
  primary: "bg-blue-100 text-blue-700",
  secondary: "bg-slate-100 text-slate-700",
  default: "bg-slate-100 text-slate-700",
};

/**
 * Obtiene el valor de un campo anidado usando dot notation
 */
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Formatea un valor según su tipo
 */
function formatValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return "-";

  switch (type) {
    case "date":
      return new Date(value as string).toLocaleDateString();
    case "number":
      return Number(value).toLocaleString();
    case "currency":
      return `$${Number(value).toLocaleString()}`;
    default:
      return String(value);
  }
}

/**
 * Renderiza el contenido de una celda
 */
function renderCellContent<T>(row: T, column: DataTableColumn<T>) {
  const value = getNestedValue(row, column.field as string);

  // Render personalizado tiene prioridad
  if (column.render) {
    return column.render(row);
  }

  // Badge
  if (column.type === "badge") {
    const color = column.getColor?.(value) ?? "default";
    return (
      <Badge
        className={cn(
          "h-6 rounded-md px-2 text-[11px] font-semibold",
          BADGE_COLOR_CLASSES[color]
        )}
      >
        {formatValue(value, "text")}
      </Badge>
    );
  }

  // Boolean
  if (column.type === "boolean") {
    const boolValue = Boolean(value);
    return (
      <Badge
        className={cn(
          "h-6 rounded-md px-2 text-[11px] font-semibold",
          BADGE_COLOR_CLASSES[boolValue ? "success" : "default"]
        )}
      >
        {boolValue ? "Sí" : "No"}
      </Badge>
    );
  }

  return formatValue(value, column.type);
}

/**
 * Skeleton para filas de la tabla mientras carga
 */
function TableSkeleton({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function CrudTable<T extends { id: number | string }>({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
  isReadOnly = false,
  showEditButton = true,
  showDeleteButton = true,
  showSearch = true,
  searchTerm = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  emptyIcon,
  emptyTitle = "No hay datos",
  emptyDescription = "No se encontraron registros para mostrar",
  emptyMessage,
  renderActions,
  className,
}: CrudTableProps<T>) {
  const hasActions =
    !isReadOnly && (onEdit || onDelete || onView || renderActions);
  const totalColumns = columns.length + (hasActions ? 1 : 0);

  // Estado vacío
  if (!isLoading && data.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {showSearch && onSearchChange && (
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="max-w-sm"
          />
        )}
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyMessage || emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showSearch && onSearchChange && (
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="max-w-sm"
        />
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead
                  key={String(column.field)}
                  className={cn(
                    "font-semibold",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.headerName}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="w-[120px] text-right font-semibold">
                  Acciones
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={totalColumns} />
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.field)}
                      className={cn(
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.className
                      )}
                    >
                      {renderCellContent(row, column)}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {renderActions ? (
                          renderActions(row)
                        ) : (
                          <>
                            {onView && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-sky-600 hover:text-sky-700"
                                onClick={() => onView(row)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver</span>
                              </Button>
                            )}
                            {showEditButton && onEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                onClick={() => onEdit(row)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            )}
                            {showDeleteButton && onDelete && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => onDelete(row)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            )}
                          </>
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
    </div>
  );
}
