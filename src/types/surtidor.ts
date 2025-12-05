// src/types/surtidor.ts

/**
 * Tipo de surtidor
 */
export type TipoSurtidor = "fijo" | "movil" | "tanque_propio";

/**
 * Estado del surtidor
 */
export type EstadoSurtidor = "activo" | "mantenimiento" | "inactivo";

/**
 * Surtidor
 */
export interface Surtidor {
  id: number;
  empresaId: number;
  unidadId?: number; // Unidad de negocio
  unidadNombre?: string;
  nombre: string;
  codigo?: string;
  tipo: TipoSurtidor;
  ubicacion: string;
  latitud?: number;
  longitud?: number;
  capacidad?: number;
  stockActual?: number;
  estado: EstadoSurtidor;
  proveedor?: string;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/editar surtidor
 */
export interface SurtidorFormData {
  nombre: string;
  codigo?: string;
  tipo: TipoSurtidor;
  ubicacion: string;
  latitud?: number;
  longitud?: number;
  capacidad?: number;
  stockActual?: number;
  estado: EstadoSurtidor;
  proveedor?: string;
  observaciones?: string;
  unidadId?: number;
  activo: boolean;
}

/**
 * Filtros para surtidores
 */
export interface SurtidorFilters {
  search?: string;
  tipo?: TipoSurtidor;
  estado?: EstadoSurtidor;
  unidadId?: number;
  activo?: boolean;
}

/**
 * Estadísticas del surtidor
 */
export interface SurtidorStats {
  totalLitros: number;
  totalEventos: number;
  litrosHoy: number;
  litrosSemana: number;
  litrosMes: number;
  promedioLitrosPorEvento: number;
}

/**
 * Surtidor con estadísticas
 */
export interface SurtidorConStats extends Surtidor {
  stats: SurtidorStats;
}

/**
 * Opciones de tipo para selects
 */
export const TIPOS_SURTIDOR: { value: TipoSurtidor; label: string }[] = [
  { value: "fijo", label: "Surtidor Fijo" },
  { value: "movil", label: "Surtidor Móvil" },
  { value: "tanque_propio", label: "Tanque Propio" },
];

/**
 * Opciones de estado para selects
 */
export const ESTADOS_SURTIDOR: { value: EstadoSurtidor; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "mantenimiento", label: "En mantenimiento" },
  { value: "inactivo", label: "Inactivo" },
];
