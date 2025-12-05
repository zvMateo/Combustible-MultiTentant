// src/types/evento.ts

import type { Evidencia } from "./evidencia";

/**
 * Estado del evento
 */
export type EstadoEvento = "pendiente" | "validado" | "rechazado";

/**
 * Origen del evento (cómo se creó)
 */
export type OrigenEvento = "whatsapp" | "web" | "app" | "importacion";

/**
 * Evento de carga de combustible
 */
export interface Evento {
  id: number;
  empresaId: number;
  unidadId?: number; // Unidad de negocio donde ocurrió el evento
  unidadNombre?: string;
  vehiculoId: number;
  choferId: number;
  surtidorId?: number;
  tanqueId?: number;
  centroCostoId?: number;
  litros: number;
  precio: number;
  total: number;
  fecha: string;
  hora?: string;
  kmInicial?: number;
  kmFinal?: number;
  horasInicial?: number;
  horasFinal?: number;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  estado: EstadoEvento;
  origen: OrigenEvento;
  validadoPor?: number;
  validadoAt?: string;
  motivoRechazo?: string;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Evento con datos relacionados expandidos
 */
export interface EventoExpandido extends Evento {
  vehiculoPatente: string;
  vehiculoTipo?: string;
  choferNombre: string;
  surtidorNombre?: string;
  tanqueNombre?: string;
  centroCostoNombre?: string;
  empresaNombre?: string;
  validadoPorNombre?: string;
  evidencias?: Evidencia[];
}

/**
 * Datos para crear/editar evento
 */
export interface EventoFormData {
  vehiculoId: number;
  choferId: number;
  surtidorId?: number;
  tanqueId?: number;
  centroCostoId?: number;
  litros: number;
  precio: number;
  fecha: string;
  hora?: string;
  kmInicial?: number;
  kmFinal?: number;
  horasInicial?: number;
  horasFinal?: number;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
}

/**
 * Filtros para listar eventos
 */
export interface EventoFilters {
  empresaId?: number;
  unidadId?: number; // Filtrar por unidad de negocio
  vehiculoId?: number;
  choferId?: number;
  surtidorId?: number;
  centroCostoId?: number;
  estado?: EstadoEvento;
  origen?: OrigenEvento;
  fechaDesde?: string;
  fechaHasta?: string;
  litrosMin?: number;
  litrosMax?: number;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

/**
 * Resultado de validación de evento
 */
export interface ValidacionResult {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

/**
 * Datos para validar evento
 */
export interface ValidarEventoData {
  eventoId: number;
  accion: "validar" | "rechazar";
  motivo?: string;
  observaciones?: string;
}

/**
 * Resumen de eventos para dashboard
 */
export interface EventosResumen {
  total: number;
  pendientes: number;
  validados: number;
  rechazados: number;
  litrosTotales: number;
  costoTotal: number;
  tendencia: number;
}

/**
 * Valida un evento según las políticas
 */
export function validarEvento(
  evento: Evento,
  policies: { maxLitros: number; minLitros: number; requiredPhotos: boolean },
  evidenciasCount: number
): ValidacionResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validar litros
  if (evento.litros <= 0) {
    errores.push("Los litros deben ser mayor a 0");
  }
  if (evento.litros > policies.maxLitros) {
    advertencias.push(`Carga excesiva detectada (>${policies.maxLitros}L)`);
  }
  if (evento.litros < policies.minLitros) {
    advertencias.push(`Carga muy pequeña (<${policies.minLitros}L)`);
  }

  // Validar evidencias
  if (policies.requiredPhotos && evidenciasCount === 0) {
    errores.push("Faltan evidencias fotográficas obligatorias");
  }

  // Validar fecha
  const fechaEvento = new Date(evento.fecha);
  const hoy = new Date();
  if (fechaEvento > hoy) {
    errores.push("La fecha no puede ser futura");
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Opciones de estado para selects
 */
export const ESTADOS_EVENTO: {
  value: EstadoEvento;
  label: string;
  color: string;
}[] = [
  { value: "pendiente", label: "Pendiente", color: "#f59e0b" },
  { value: "validado", label: "Validado", color: "#10b981" },
  { value: "rechazado", label: "Rechazado", color: "#ef4444" },
];

/**
 * Obtiene el color del estado
 */
export function getEstadoColor(estado: EstadoEvento): string {
  return ESTADOS_EVENTO.find((e) => e.value === estado)?.color || "#999";
}
