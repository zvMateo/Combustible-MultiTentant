// src/types/chofer.ts

/**
 * Estado del chofer
 */
export type EstadoChofer = "activo" | "licencia" | "inactivo" | "baja";

/**
 * Tipo de licencia
 */
export type TipoLicencia = "A" | "B" | "C" | "D" | "E";

/**
 * Chofer/Operador
 */
export interface Chofer {
  id: number;
  empresaId: number;
  unidadId?: number; // Unidad de negocio a la que pertenece
  unidadNombre?: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
  whatsappNumber?: string;
  licenciaTipo?: TipoLicencia;
  licenciaVencimiento?: string;
  estado: EstadoChofer;
  vehiculoAsignadoId?: number;
  userId?: number;
  foto?: string;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/editar chofer
 */
export interface ChoferFormData {
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
  whatsappNumber?: string;
  licenciaTipo?: TipoLicencia;
  licenciaVencimiento?: string;
  estado: EstadoChofer;
  vehiculoAsignadoId?: number;
  unidadId?: number;
  foto?: string;
  observaciones?: string;
  activo: boolean;
}

/**
 * Filtros para choferes
 */
export interface ChoferFilters {
  search?: string;
  estado?: EstadoChofer;
  unidadId?: number;
  activo?: boolean;
}

/**
 * Estadísticas del chofer
 */
export interface ChoferStats {
  totalEventos: number;
  totalLitros: number;
  totalCosto: number;
  eventosValidados: number;
  eventosRechazados: number;
  eventosPendientes: number;
  vehiculosMasUsados: string[];
  ultimaCarga?: string;
}

/**
 * Chofer con estadísticas
 */
export interface ChoferConStats extends Chofer {
  stats: ChoferStats;
  vehiculoAsignadoPatente?: string;
}

/**
 * Nombre completo del chofer
 */
export function getChoferNombreCompleto(chofer: Chofer): string {
  return `${chofer.nombre} ${chofer.apellido}`;
}

/**
 * Opciones de estado para selects
 */
export const ESTADOS_CHOFER: { value: EstadoChofer; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "licencia", label: "En licencia" },
  { value: "inactivo", label: "Inactivo" },
  { value: "baja", label: "Dado de baja" },
];

/**
 * Opciones de tipo de licencia para selects
 */
export const TIPOS_LICENCIA: { value: TipoLicencia; label: string }[] = [
  { value: "A", label: "Clase A - Motos" },
  { value: "B", label: "Clase B - Automóviles" },
  { value: "C", label: "Clase C - Camiones" },
  { value: "D", label: "Clase D - Transporte de pasajeros" },
  { value: "E", label: "Clase E - Maquinaria especial" },
];
