// src/types/reportes.ts

/**
 * Tipos de reportes disponibles
 */
export type TipoReporte = 
  | "consumo_vehiculos"
  | "litros_surtidor"
  | "litros_operador"
  | "costo_centro"
  | "desvios"
  | "ranking_eficiencia"
  | "trazabilidad"
  | "auditoria";

/**
 * Período de tiempo para reportes
 */
export type PeriodoReporte = 
  | "hoy"
  | "ayer"
  | "semana"
  | "mes"
  | "trimestre"
  | "anio"
  | "personalizado";

/**
 * Formato de exportación
 */
export type FormatoExportacion = "excel" | "pdf" | "csv";

/**
 * Filtros base para reportes
 */
export interface ReporteFiltersBase {
  empresaId?: number;
  periodo: PeriodoReporte;
  fechaDesde?: string;
  fechaHasta?: string;
}

/**
 * Consumo por vehículo
 */
export interface ConsumoVehiculoData {
  vehiculoId: number;
  vehiculoPatente: string;
  vehiculoTipo: string;
  litrosTotales: number;
  costoTotal: number;
  numeroEventos: number;
  eficienciaKmPorLitro?: number;
  eficienciaLitrosPorHora?: number;
  consumoPromedioPorEvento: number;
}

/**
 * Litros por surtidor
 */
export interface LitrosSurtidorData {
  surtidorId: number;
  surtidorNombre: string;
  surtidorUbicacion: string;
  litrosTotales: number;
  costoTotal: number;
  numeroEventos: number;
  porcentajeTotal: number;
}

/**
 * Litros por operador
 */
export interface LitrosOperadorData {
  choferId: number;
  choferNombre: string;
  choferApellido: string;
  litrosTotales: number;
  costoTotal: number;
  numeroEventos: number;
  vehiculosMasUsados: string[];
  eficienciaPromedio?: number;
}

/**
 * Costo por centro de costo
 */
export interface CostoCentroCostoData {
  centroCostoId: number;
  centroCostoCodigo: string;
  centroCostoNombre: string;
  centroCostoTipo: string;
  litrosTotales: number;
  costoTotal: number;
  numeroEventos: number;
  vehiculosAsignados: number;
  porcentajePresupuesto?: number;
}

/**
 * Análisis de desvíos
 */
export interface DesvioData {
  eventoId: number;
  fecha: string;
  vehiculoPatente: string;
  choferNombre: string;
  litros: number;
  tipoDesvio: string;
  severidad: "baja" | "media" | "alta";
  descripcion: string;
  resuelto: boolean;
}

/**
 * Ranking de eficiencia
 */
export interface RankingEficienciaData {
  posicion: number;
  vehiculoId: number;
  vehiculoPatente: string;
  vehiculoTipo: string;
  eficiencia: number;
  litrosTotales: number;
  tendencia: "mejorando" | "estable" | "empeorando";
  variacion: number;
}

/**
 * Datos de trazabilidad de evento
 */
export interface TrazabilidadData {
  eventoId: number;
  accion: string;
  usuario: string;
  fecha: string;
  detalles: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Registro de auditoría
 */
export interface AuditoriaData {
  id: number;
  entidad: string;
  entidadId: number;
  accion: "crear" | "editar" | "eliminar" | "validar" | "rechazar";
  usuario: string;
  fecha: string;
  cambios: Record<string, { anterior: unknown; nuevo: unknown }>;
  ip?: string;
}

/**
 * KPIs para dashboard de reportes
 */
export interface ReportesKPIs {
  litrosTotales: number;
  costoTotal: number;
  totalEventos: number;
  eventosValidados: number;
  eventosPendientes: number;
  eventosRechazados: number;
  vehiculosActivos: number;
  alertasAbiertas: number;
  eficienciaPromedio: number;
  consumoPromedioDiario: number;
  tendenciaConsumo: number;
  tendenciaCosto: number;
}

/**
 * Opciones de período para selects
 */
export const PERIODOS_REPORTE: { value: PeriodoReporte; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "ayer", label: "Ayer" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "trimestre", label: "Este trimestre" },
  { value: "anio", label: "Este año" },
  { value: "personalizado", label: "Personalizado" },
];

/**
 * Opciones de formato de exportación
 */
export const FORMATOS_EXPORTACION: { value: FormatoExportacion; label: string; icon: string }[] = [
  { value: "excel", label: "Excel (.xlsx)", icon: "TableChart" },
  { value: "pdf", label: "PDF", icon: "PictureAsPdf" },
  { value: "csv", label: "CSV", icon: "Description" },
];

