// src/types/vehiculo.ts

/**
 * Tipo de vehículo
 */
export type TipoVehiculo =
  | "camion"
  | "pickup"
  | "tractor"
  | "cosechadora"
  | "sembradora"
  | "pulverizadora"
  | "automovil"
  | "utilitario"
  | "maquinaria"
  | "otro";

/**
 * Tipo de combustible
 */
export type TipoCombustible = "diesel" | "nafta" | "gnc" | "biodiesel";

/**
 * Estado del vehículo
 */
export type EstadoVehiculo = "activo" | "mantenimiento" | "inactivo" | "baja";

/**
 * Vehículo
 */
export interface Vehiculo {
  id: number;
  empresaId: number;
  unidadId?: number; // Unidad de negocio a la que pertenece
  unidadNombre?: string;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  tipo: TipoVehiculo;
  tipoCombustible: TipoCombustible;
  capacidadTanque: number;
  kmActual?: number;
  horasActual?: number;
  consumoPromedio?: number;
  estado: EstadoVehiculo;
  choferAsignadoId?: number;
  centroCostoId?: number;
  foto?: string;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/editar vehículo
 */
export interface VehiculoFormData {
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  tipo: TipoVehiculo;
  tipoCombustible: TipoCombustible;
  capacidadTanque: number;
  kmActual?: number;
  horasActual?: number;
  estado: EstadoVehiculo;
  choferAsignadoId?: number;
  centroCostoId?: number;
  unidadId?: number;
  foto?: string;
  observaciones?: string;
  activo: boolean;
}

/**
 * Filtros para vehículos
 */
export interface VehiculoFilters {
  search?: string;
  tipo?: TipoVehiculo;
  estado?: EstadoVehiculo;
  tipoCombustible?: TipoCombustible;
  unidadId?: number;
  activo?: boolean;
}

/**
 * Estadísticas del vehículo
 */
export interface VehiculoStats {
  totalLitros: number;
  totalCosto: number;
  totalEventos: number;
  ultimaCarga?: string;
  consumoPromedio: number;
  eficienciaKmPorLitro?: number;
  eficienciaLitrosPorHora?: number;
}

/**
 * Vehículo con estadísticas
 */
export interface VehiculoConStats extends Vehiculo {
  stats: VehiculoStats;
  choferNombre?: string;
  centroCostoNombre?: string;
}

/**
 * Opciones de tipo de vehículo para selects
 */
export const TIPOS_VEHICULO: { value: TipoVehiculo; label: string }[] = [
  { value: "camion", label: "Camión" },
  { value: "pickup", label: "Pickup" },
  { value: "tractor", label: "Tractor" },
  { value: "cosechadora", label: "Cosechadora" },
  { value: "sembradora", label: "Sembradora" },
  { value: "pulverizadora", label: "Pulverizadora" },
  { value: "automovil", label: "Automóvil" },
  { value: "utilitario", label: "Utilitario" },
  { value: "maquinaria", label: "Maquinaria" },
  { value: "otro", label: "Otro" },
];

/**
 * Opciones de tipo de combustible para selects
 */
export const TIPOS_COMBUSTIBLE: { value: TipoCombustible; label: string }[] = [
  { value: "diesel", label: "Diesel" },
  { value: "nafta", label: "Nafta" },
  { value: "gnc", label: "GNC" },
  { value: "biodiesel", label: "Biodiesel" },
];

/**
 * Opciones de estado para selects
 */
export const ESTADOS_VEHICULO: { value: EstadoVehiculo; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "mantenimiento", label: "En mantenimiento" },
  { value: "inactivo", label: "Inactivo" },
  { value: "baja", label: "Dado de baja" },
];
