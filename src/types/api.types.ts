/**
 * Tipos de la API de Combustibles
 * Basado en: https://apicombustibles.ubiko.com.ar/swagger/index.html
 */

// ============================================
// AUTH
// ============================================
export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  user?: ApiUser;
  message?: string;
  success?: boolean;
}

// ============================================
// USERS
// ============================================
export interface ApiUser {
  id: string;
  userName: string;
  normalizedUserName?: string;
  email: string;
  normalizedEmail?: string;
  emailConfirmed?: boolean;
  passwordHash?: string;
  securityStamp?: string;
  concurrencyStamp?: string;
  phoneNumber?: string;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: string;
  lockoutEnabled?: boolean;
  accessFailedCount?: number;
  firstName?: string;
  lastName?: string;
  idCompany?: number;
  idBusinessUnit?: number;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
  idCompany: number;
  idBusinessUnit?: number;
  phoneNumber?: string;
}

export interface UpdateUserRequest {
  id: string;
  userName: string;
  normalizedUserName?: string;
  email: string;
  normalizedEmail?: string;
  emailConfirmed?: boolean;
  passwordHash?: string;
  securityStamp?: string;
  concurrencyStamp?: string;
  phoneNumber?: string;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: string;
  lockoutEnabled?: boolean;
  accessFailedCount?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// ROLES
// ============================================
export interface ApiRole {
  id: string;
  name: string;
}

export interface AddUserRoleRequest {
  roleId: string;
}

// ============================================
// COMPANIES
// ============================================
export interface Company {
  id: number;
  name: string;
  detail?: string;
  cuit?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyRequest {
  name: string;
  detail?: string;
  cuit?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCompanyRequest extends CreateCompanyRequest {
  id: number;
}

// ============================================
// BUSINESS UNITS (Unidades de Negocio)
// ============================================
export interface BusinessUnit {
  id: number;
  idCompany: number;
  company?: Company; // Objeto company anidado (viene en la respuesta)
  name: string;
  detail?: string;
  active?: boolean; // La API usa "active" en lugar de "isActive"
  isActive?: boolean; // Mantener para compatibilidad
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessUnitRequest {
  idCompany: number;
  name: string;
  detail?: string;
}

export interface UpdateBusinessUnitRequest extends CreateBusinessUnitRequest {
  id: number;
}

// ============================================
// DRIVERS (Choferes)
// ============================================
export interface Driver {
  id: number;
  idCompany: number;
  name: string;
  dni: string;
  phoneNumber?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDriverRequest {
  idCompany: number;
  name: string;
  dni: string;
  phoneNumber?: string;
}

export interface UpdateDriverRequest extends CreateDriverRequest {
  id: number;
}

// ============================================
// RESOURCE TYPES (Tipos de Recursos)
// ============================================
export interface ResourceType {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface CreateResourceTypeRequest {
  name: string;
}

export interface UpdateResourceTypeRequest extends CreateResourceTypeRequest {
  id: number;
}

// ============================================
// RESOURCES (Vehículos, Tanques, Surtidores)
// ============================================
export interface Resource {
  id: number;
  idType: number;
  type?: string[]; // Array de tipos desde la API (ej: ["Tanque"])
  idCompany: number;
  company?: string[]; // Array de nombres de empresa desde la API
  idBusinessUnit?: number;
  businessUnit?: string[]; // Array de nombres de unidad desde la API
  nativeLiters?: number;
  name: string;
  identifier: string;
  active?: boolean; // La API usa "active" en lugar de "isActive"
  isActive?: boolean; // Mantener para compatibilidad
  createdAt?: string;
  updatedAt?: string;
  resourceType?: ResourceType;
}

export interface CreateResourceRequest {
  idType: number;
  idCompany: number;
  idBusinessUnit?: number;
  nativeLiters?: number;
  name: string;
  identifier: string;
}

export interface UpdateResourceRequest extends CreateResourceRequest {
  id: number;
}

// ============================================
// FUEL TYPES (Tipos de Combustible)
// ============================================
export interface FuelType {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface CreateFuelTypeRequest {
  name: string;
}

export interface UpdateFuelTypeRequest extends CreateFuelTypeRequest {
  id: number;
}

// ============================================
// MOVEMENT TYPES (Tipos de Movimiento)
// ============================================
export interface MovementType {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface CreateMovementTypeRequest {
  name: string;
}

export interface UpdateMovementTypeRequest extends CreateMovementTypeRequest {
  id: number;
}

// ============================================
// FUEL STOCK MOVEMENT (Movimientos de Stock)
// ============================================
export interface FuelStockMovement {
  id: number;
  idFuelType: number;
  idResource: number;
  date: string;
  idMovementType: number;
  idCompany: number;
  idBusinessUnit?: number;
  liters: number;
  fuelType?: FuelType;
  resource?: Resource;
  movementType?: MovementType;
}

export interface CreateFuelStockMovementRequest {
  idFuelType: number;
  idResource: number;
  date: string;
  idMovementType: number;
  idCompany: number;
  idBusinessUnit?: number;
  liters: number;
}

export interface UpdateFuelStockMovementRequest
  extends CreateFuelStockMovementRequest {
  id: number;
}

// ============================================
// LOAD LITERS (Cargas de Combustible)
// ============================================
export interface LoadLiters {
  id: number;
  idResource: number;
  nameResource?: string | null; // Nombre del recurso desde la API
  loadDate: string;
  initialLiters: number;
  finalLiters: number;
  totalLiters: number;
  detail?: string;
  idFuelType: number;
  nameFuelType?: string | null; // Nombre del tipo de combustible desde la API
  resource?: Resource; // Objeto resource anidado (opcional, para compatibilidad)
  fuelType?: FuelType; // Objeto fuelType anidado (opcional, para compatibilidad)
}

export interface CreateLoadLitersRequest {
  idResource: number;
  loadDate: string;
  initialLiters: number;
  finalLiters: number;
  totalLiters: number;
  detail?: string;
  idFuelType: number;
}

export interface UpdateLoadLitersRequest extends CreateLoadLitersRequest {
  id: number;
}

// ============================================
// LOAD TRIPS (Asociación Carga-Viaje)
// ============================================
export interface LoadTrip {
  id: number;
  idTrip: number;
  idLoadLiters: number;
  totalLiters: number;
  detail?: string;
}

export interface CreateLoadTripRequest {
  id?: number;
  idTrip: number;
  idLoadLiters: number;
  totalLiters: number;
  detail?: string;
}

// ============================================
// TRIPS (Viajes)
// ============================================
export interface Trip {
  id: number;
  idDriver: number;
  nameDriver?: string; // Nombre del conductor desde la API
  idVehicle?: number; // ID del vehículo (puede venir de la API)
  initialLocation: string;
  finalLocation: string;
  totalKm: number;
  driver?: Driver; // Objeto conductor anidado (opcional)
  vehicle?: Resource; // Objeto vehículo anidado (opcional)
  createdAt?: string;
  updatedAt?: string;
  // Campos adicionales que pueden venir del formulario
  origin?: string; // Alias de initialLocation
  destination?: string; // Alias de finalLocation
  distance?: number; // Alias de totalKm
  startDate?: string; // Fecha de inicio
  notes?: string; // Notas adicionales
}

export interface CreateTripRequest {
  idDriver: number;
  idVehicle?: number; // ID del vehículo (opcional según la API)
  initialLocation: string;
  finalLocation: string;
  totalKm: number;
  // Campos adicionales que pueden ser necesarios
  origin?: string; // Alias de initialLocation
  destination?: string; // Alias de finalLocation
  distance?: number; // Alias de totalKm
  startDate?: string; // Fecha de inicio
  notes?: string; // Notas adicionales
}

export interface UpdateTripRequest extends CreateTripRequest {
  id: number;
}

// ============================================
// API RESPONSE WRAPPER
// ============================================
export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// RESOURCE TYPE CONSTANTS
// ============================================
export const RESOURCE_TYPES = {
  VEHICLE: 1, // Vehículo
  TANK: 2, // Tanque
  DISPENSER: 3, // Surtidor
} as const;

export type ResourceTypeId =
  (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];
