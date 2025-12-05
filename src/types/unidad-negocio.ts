// src/types/unidad-negocio.ts

/**
 * Estado de una Unidad de Negocio
 */
export type UnidadNegocioStatus = "activa" | "inactiva" | "suspendida";

/**
 * Tipo de Unidad de Negocio
 */
export type TipoUnidadNegocio = 
  | "campo" 
  | "sucursal" 
  | "planta" 
  | "deposito" 
  | "oficina" 
  | "otro";

/**
 * Unidad de Negocio
 * Representa una división/sucursal/campo dentro de una Empresa (tenant)
 */
export interface UnidadNegocio {
  id: number;
  empresaId: number;
  nombre: string;
  codigo: string; // Código único dentro de la empresa (ej: "CN", "CS")
  tipo: TipoUnidadNegocio;
  descripcion?: string;
  
  // Ubicación
  direccion?: string;
  localidad?: string;
  provincia?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  
  // Estado
  status: UnidadNegocioStatus;
  
  // Contacto
  responsable?: string;
  telefono?: string;
  email?: string;
  
  // Métricas (calculadas)
  totalVehiculos?: number;
  totalChoferes?: number;
  totalEventosMes?: number;
  consumoMesLitros?: number;
  
  // Auditoría
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/editar una Unidad de Negocio
 */
export interface UnidadNegocioFormData {
  nombre: string;
  codigo: string;
  tipo: TipoUnidadNegocio;
  descripcion?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  responsable?: string;
  telefono?: string;
  email?: string;
  status?: UnidadNegocioStatus;
}

/**
 * Resumen de Unidad de Negocio para selectores
 */
export interface UnidadNegocioResumen {
  id: number;
  nombre: string;
  codigo: string;
  tipo: TipoUnidadNegocio;
  status: UnidadNegocioStatus;
}

/**
 * Estadísticas de una Unidad de Negocio
 */
export interface UnidadNegocioStats {
  unidadId: number;
  totalVehiculos: number;
  totalChoferes: number;
  totalSurtidores: number;
  totalTanques: number;
  eventosHoy: number;
  eventosSemana: number;
  eventosMes: number;
  consumoHoyLitros: number;
  consumoSemanaLitros: number;
  consumoMesLitros: number;
  costoMes: number;
  eventosPendientesValidacion: number;
}

/**
 * Filtros para búsqueda de Unidades de Negocio
 */
export interface UnidadNegocioFilters {
  search?: string;
  tipo?: TipoUnidadNegocio;
  status?: UnidadNegocioStatus;
  provincia?: string;
}

/**
 * Labels para tipos de unidad
 */
export const TIPO_UNIDAD_LABELS: Record<TipoUnidadNegocio, string> = {
  campo: "Campo",
  sucursal: "Sucursal",
  planta: "Planta",
  deposito: "Depósito",
  oficina: "Oficina",
  otro: "Otro",
};

/**
 * Labels para estados de unidad
 */
export const STATUS_UNIDAD_LABELS: Record<UnidadNegocioStatus, string> = {
  activa: "Activa",
  inactiva: "Inactiva",
  suspendida: "Suspendida",
};

/**
 * Colores para estados
 */
export const STATUS_UNIDAD_COLORS: Record<UnidadNegocioStatus, string> = {
  activa: "#10b981",
  inactiva: "#6b7280",
  suspendida: "#ef4444",
};

