// src/types/alerta.ts

/**
 * Tipo de alerta
 */
export type TipoAlerta =
  | "exceso_litros"
  | "ubicacion_invalida"
  | "duplicado"
  | "horario_inusual"
  | "falta_evidencia"
  | "tanque_bajo"
  | "licencia_vencida"
  | "mantenimiento_vencido"
  | "consumo_anormal"
  | "sistema";

/**
 * Severidad de la alerta
 */
export type SeveridadAlerta = "baja" | "media" | "alta" | "critica";

/**
 * Estado de la alerta
 */
export type EstadoAlerta = "abierta" | "vista" | "resuelta" | "ignorada";

/**
 * Alerta del sistema
 */
export interface Alerta {
  id: number;
  empresaId: number;
  tipo: TipoAlerta;
  severidad: SeveridadAlerta;
  estado: EstadoAlerta;
  titulo: string;
  descripcion: string;
  eventoId?: number;
  vehiculoId?: number;
  choferId?: number;
  tanqueId?: number;
  metadata?: Record<string, unknown>;
  resueltaPor?: number;
  resueltaAt?: string;
  resolucion?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para resolver alerta
 */
export interface ResolverAlertaData {
  alertaId: number;
  accion: "resolver" | "ignorar";
  resolucion?: string;
}

/**
 * Filtros para listar alertas
 */
export interface AlertaFilters {
  empresaId?: number;
  tipo?: TipoAlerta;
  severidad?: SeveridadAlerta;
  estado?: EstadoAlerta;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

/**
 * Resumen de alertas para dashboard
 */
export interface AlertasResumen {
  total: number;
  abiertas: number;
  criticas: number;
  altas: number;
  medias: number;
  bajas: number;
}

/**
 * Colores por severidad
 */
export const SEVERIDAD_COLORS: Record<
  SeveridadAlerta,
  { bg: string; color: string }
> = {
  baja: { bg: "#3b82f615", color: "#3b82f6" },
  media: { bg: "#f59e0b15", color: "#f59e0b" },
  alta: { bg: "#ef444415", color: "#ef4444" },
  critica: { bg: "#dc262615", color: "#dc2626" },
};

/**
 * Opciones de tipo para selects
 */
export const TIPOS_ALERTA: { value: TipoAlerta; label: string }[] = [
  { value: "exceso_litros", label: "Exceso de litros" },
  { value: "ubicacion_invalida", label: "Ubicación inválida" },
  { value: "duplicado", label: "Evento duplicado" },
  { value: "horario_inusual", label: "Horario inusual" },
  { value: "falta_evidencia", label: "Falta evidencia" },
  { value: "tanque_bajo", label: "Tanque bajo" },
  { value: "licencia_vencida", label: "Licencia vencida" },
  { value: "mantenimiento_vencido", label: "Mantenimiento vencido" },
  { value: "consumo_anormal", label: "Consumo anormal" },
  { value: "sistema", label: "Sistema" },
];

/**
 * Opciones de severidad para selects
 */
export const SEVERIDADES_ALERTA: { value: SeveridadAlerta; label: string }[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

/**
 * Opciones de estado para selects
 */
export const ESTADOS_ALERTA: { value: EstadoAlerta; label: string }[] = [
  { value: "abierta", label: "Abierta" },
  { value: "vista", label: "Vista" },
  { value: "resuelta", label: "Resuelta" },
  { value: "ignorada", label: "Ignorada" },
];
