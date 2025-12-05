// src/types/centro-costo.ts

/**
 * Tipo de centro de costo
 */
export type TipoCentroCosto = 
  | "lote" 
  | "labor" 
  | "departamento" 
  | "proyecto" 
  | "cliente"
  | "sucursal"
  | "otro";

/**
 * Centro de costo
 */
export interface CentroCosto {
  id: number;
  empresaId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoCentroCosto;
  responsableId?: number;
  presupuestoMensual?: number;
  presupuestoAnual?: number;
  parentId?: number;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/editar centro de costo
 */
export interface CentroCostoFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoCentroCosto;
  responsableId?: number;
  presupuestoMensual?: number;
  presupuestoAnual?: number;
  parentId?: number;
  observaciones?: string;
  activo: boolean;
}

/**
 * Estadísticas del centro de costo
 */
export interface CentroCostoStats {
  totalLitros: number;
  totalCosto: number;
  totalEventos: number;
  vehiculosAsignados: number;
  consumoMensual: number;
  costoMensual: number;
  porcentajePresupuesto?: number;
}

/**
 * Centro de costo con estadísticas
 */
export interface CentroCostoConStats extends CentroCosto {
  stats: CentroCostoStats;
  responsableNombre?: string;
  parentNombre?: string;
}

/**
 * Centro de costo jerárquico (con hijos)
 */
export interface CentroCostoJerarquico extends CentroCosto {
  children: CentroCostoJerarquico[];
  level: number;
}

/**
 * Opciones de tipo para selects
 */
export const TIPOS_CENTRO_COSTO: { value: TipoCentroCosto; label: string }[] = [
  { value: "lote", label: "Lote" },
  { value: "labor", label: "Labor" },
  { value: "departamento", label: "Departamento" },
  { value: "proyecto", label: "Proyecto" },
  { value: "cliente", label: "Cliente" },
  { value: "sucursal", label: "Sucursal" },
  { value: "otro", label: "Otro" },
];

