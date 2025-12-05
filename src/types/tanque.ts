// src/types/tanque.ts

/**
 * Tipo de tanque
 */
export type TipoTanque = "principal" | "auxiliar" | "reserva" | "movil";

/**
 * Estado del tanque
 */
export type EstadoTanque = "operativo" | "mantenimiento" | "fuera_servicio";

/**
 * Nivel de alerta del tanque
 */
export type NivelAlerta = "normal" | "bajo" | "critico" | "vacio";

/**
 * Tanque de combustible
 */
export interface Tanque {
  id: number;
  empresaId: number;
  unidadId?: number; // Unidad de negocio
  unidadNombre?: string;
  nombre: string;
  codigo?: string;
  tipo: TipoTanque;
  capacidad: number;
  stockActual: number;
  stockMinimo: number;
  ubicacion: string;
  latitud?: number;
  longitud?: number;
  estado: EstadoTanque;
  ultimaRecarga?: string;
  proveedor?: string;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/editar tanque
 */
export interface TanqueFormData {
  nombre: string;
  codigo?: string;
  tipo: TipoTanque;
  capacidad: number;
  stockActual: number;
  stockMinimo: number;
  ubicacion: string;
  latitud?: number;
  longitud?: number;
  estado: EstadoTanque;
  proveedor?: string;
  observaciones?: string;
  unidadId?: number;
  activo: boolean;
}

/**
 * Filtros para tanques
 */
export interface TanqueFilters {
  search?: string;
  tipo?: TipoTanque;
  estado?: EstadoTanque;
  unidadId?: number;
  activo?: boolean;
}

/**
 * Movimiento de stock del tanque
 */
export interface TanqueMovimiento {
  id: number;
  tanqueId: number;
  tipo: "ingreso" | "egreso" | "ajuste";
  litros: number;
  stockAnterior: number;
  stockPosterior: number;
  eventoId?: number;
  proveedorId?: number;
  observaciones?: string;
  userId: number;
  createdAt: string;
}

/**
 * Calcula el porcentaje de stock
 */
export function calcularPorcentajeStock(tanque: Tanque): number {
  if (tanque.capacidad === 0) return 0;
  return Math.round((tanque.stockActual / tanque.capacidad) * 100);
}

/**
 * Determina el nivel de alerta
 */
export function getNivelAlerta(tanque: Tanque): NivelAlerta {
  const porcentaje = calcularPorcentajeStock(tanque);

  if (porcentaje <= 5) return "vacio";
  if (porcentaje <= 15) return "critico";
  if (tanque.stockActual <= tanque.stockMinimo) return "bajo";
  return "normal";
}

/**
 * Color del nivel de alerta
 */
export function getColorNivelAlerta(nivel: NivelAlerta): string {
  const colores: Record<NivelAlerta, string> = {
    normal: "#10b981",
    bajo: "#f59e0b",
    critico: "#ef4444",
    vacio: "#dc2626",
  };
  return colores[nivel];
}

/**
 * Opciones de tipo para selects
 */
export const TIPOS_TANQUE: { value: TipoTanque; label: string }[] = [
  { value: "principal", label: "Principal" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "reserva", label: "Reserva" },
  { value: "movil", label: "Móvil" },
];

/**
 * Opciones de estado para selects
 */
export const ESTADOS_TANQUE: { value: EstadoTanque; label: string }[] = [
  { value: "operativo", label: "Operativo" },
  { value: "mantenimiento", label: "En mantenimiento" },
  { value: "fuera_servicio", label: "Fuera de servicio" },
];
