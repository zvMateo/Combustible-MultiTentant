/**
 * Tipos para componentes DataTable
 *
 * Principio: Interface Segregation - Tipos específicos y enfocados
 */
import type { ReactNode } from "react";

/**
 * Configuración de una columna de la tabla
 */
export interface DataTableColumn<T> {
  /** Campo de la entidad a mostrar */
  field: keyof T | string;

  /** Título del encabezado */
  headerName: string;

  /** Tipo de renderizado */
  type?: "badge" | "boolean" | "text" | "date" | "number" | "currency";

  /** Render personalizado */
  render?: (row: T) => ReactNode;

  /** Función para obtener color del badge */
  getColor?: (value: unknown) => BadgeColor;

  /** Ancho de la columna */
  width?: string | number;

  /** Alineación del contenido */
  align?: "left" | "center" | "right";

  /** Si la columna es ordenable */
  sortable?: boolean;

  /** Clase CSS adicional */
  className?: string;
}

/**
 * Colores disponibles para badges
 */
export type BadgeColor =
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";

/**
 * Props del componente DataTable
 */
export interface DataTableProps<T extends { id: number | string }> {
  /** Configuración de columnas */
  columns: DataTableColumn<T>[];

  /** Datos a mostrar */
  data: T[];

  /** Handler para editar */
  onEdit?: (row: T) => void;

  /** Handler para eliminar */
  onDelete?: (row: T) => void;

  /** Handler para ver detalles */
  onView?: (row: T) => void;

  /** Mensaje cuando no hay datos */
  emptyMessage?: string;

  /** Si está cargando */
  isLoading?: boolean;

  /** Si es solo lectura (oculta acciones) */
  isReadOnly?: boolean;

  /** Si mostrar botón de editar */
  showEditButton?: boolean;

  /** Si mostrar botón de eliminar */
  showDeleteButton?: boolean;

  /** Render personalizado para acciones */
  renderActions?: (row: T) => ReactNode;

  /** Clase CSS adicional para el contenedor */
  className?: string;
}

/**
 * Props del componente SearchInput
 */
export interface SearchInputProps {
  /** Valor actual */
  value: string;

  /** Handler de cambio */
  onChange: (value: string) => void;

  /** Placeholder */
  placeholder?: string;

  /** Clase CSS adicional */
  className?: string;

  /** Si está deshabilitado */
  disabled?: boolean;
}

/**
 * Props del componente CrudTable
 */
export interface CrudTableProps<T extends { id: number | string }>
  extends Omit<DataTableProps<T>, "onEdit" | "onDelete"> {
  /** Handler para editar */
  onEdit?: (row: T) => void;

  /** Handler para eliminar */
  onDelete?: (row: T) => void;

  /** Término de búsqueda */
  searchTerm?: string;

  /** Handler de búsqueda */
  onSearchChange?: (term: string) => void;

  /** Placeholder de búsqueda */
  searchPlaceholder?: string;

  /** Si mostrar el input de búsqueda */
  showSearch?: boolean;

  /** Icono para estado vacío */
  emptyIcon?: ReactNode;

  /** Título para estado vacío */
  emptyTitle?: string;

  /** Descripción para estado vacío */
  emptyDescription?: string;
}
