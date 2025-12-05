// src/types/empresa.ts

/**
 * Plan de suscripción de la empresa
 */
export type SubscriptionPlan = "basic" | "professional" | "enterprise";

/**
 * Configuración de tema de la empresa
 */
export interface EmpresaTheme {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  favicon?: string;
}

/**
 * Políticas de evidencias configurables
 */
export interface EmpresaPolicies {
  requiredPhotos: boolean;
  requiredLocation: boolean;
  requiredAudio: boolean;
  maxLitrosThreshold: number;
  minLitrosThreshold: number;
  fuelPrice: number;
  allowOfflineMode: boolean;
  autoValidateEvents: boolean;
  requireOdometerPhoto: boolean;
  requireFuelPumpPhoto: boolean;
}

/**
 * Estadísticas de la empresa
 */
export interface EmpresaStats {
  totalUsers: number;
  totalVehicles: number;
  totalDrivers: number;
  totalEvents: number;
  dailyEvents: number;
  monthlyEvents: number;
  totalLitros: number;
  totalCostos: number;
  validatedEvents: number;
  pendingEvents: number;
  rejectedEvents: number;
}

/**
 * Empresa/Tenant
 */
export interface Empresa {
  id: number;
  nombre: string;
  razonSocial?: string;
  cuit?: string;
  subdomain: string;
  adminEmail: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  theme: EmpresaTheme;
  policies: EmpresaPolicies;
  stats?: EmpresaStats;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear/editar empresa
 */
export interface EmpresaFormData {
  nombre: string;
  razonSocial?: string;
  cuit?: string;
  subdomain: string;
  adminEmail: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  theme: EmpresaTheme;
  policies: EmpresaPolicies;
  subscriptionPlan: SubscriptionPlan;
}

/**
 * Resumen de empresa para listados
 */
export interface EmpresaResumen {
  id: number;
  nombre: string;
  subdomain: string;
  primaryColor: string;
  activa: boolean;
  eventosHoy: number;
  litrosHoy: number;
  usuarios: number;
  vehiculos: number;
}

/**
 * Configuración del tenant (para el contexto)
 */
export interface TenantConfig {
  id: number;
  name: string;
  subdomain: string;
  theme: EmpresaTheme;
  policies: EmpresaPolicies;
}

/**
 * Valores por defecto para políticas
 */
export const DEFAULT_POLICIES: EmpresaPolicies = {
  requiredPhotos: true,
  requiredLocation: true,
  requiredAudio: false,
  maxLitrosThreshold: 200,
  minLitrosThreshold: 5,
  fuelPrice: 850,
  allowOfflineMode: false,
  autoValidateEvents: false,
  requireOdometerPhoto: true,
  requireFuelPumpPhoto: true,
};

/**
 * Valores por defecto para tema
 */
export const DEFAULT_THEME: EmpresaTheme = {
  primaryColor: "#284057",
  secondaryColor: "#66FF99",
};

