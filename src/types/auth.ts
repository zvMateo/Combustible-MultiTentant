// src/types/auth.ts

/**
 * Roles del sistema
 * - superadmin: Administrador de GoodApps (acceso a /a)
 * - admin: Administrador de empresa/tenant
 * - supervisor: Puede validar eventos
 * - operador: Solo puede registrar cargas
 * - auditor: Solo lectura para auditorías
 */
export type UserRole = 
  | "superadmin" 
  | "admin" 
  | "supervisor" 
  | "operador" 
  | "auditor";

/**
 * Permisos granulares del sistema
 */
export type Permission =
  | "eventos:crear"
  | "eventos:editar"
  | "eventos:eliminar"
  | "eventos:validar"
  | "eventos:ver"
  | "vehiculos:gestionar"
  | "choferes:gestionar"
  | "surtidores:gestionar"
  | "tanques:gestionar"
  | "centros-costo:gestionar"
  | "usuarios:gestionar"
  | "unidades:ver"
  | "unidades:gestionar"
  | "reportes:ver"
  | "reportes:exportar"
  | "configuracion:editar"
  | "empresas:gestionar";

/**
 * Mapeo de roles a permisos
 * - admin: Ve TODO de la empresa, gestiona unidades y usuarios
 * - supervisor: Ve solo su(s) unidad(es) asignada(s), valida eventos
 * - operador: Solo WhatsApp (no usa el sistema web)
 * - auditor: Solo lectura de su unidad asignada
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    "empresas:gestionar",
    "eventos:ver",
    "reportes:ver",
    "reportes:exportar",
  ],
  admin: [
    // Gestión completa de la empresa
    "unidades:ver",
    "unidades:gestionar",
    "usuarios:gestionar",
    "configuracion:editar",
    // Gestión de recursos
    "vehiculos:gestionar",
    "choferes:gestionar",
    "surtidores:gestionar",
    "tanques:gestionar",
    "centros-costo:gestionar",
    // Eventos
    "eventos:crear",
    "eventos:editar",
    "eventos:eliminar",
    "eventos:validar",
    "eventos:ver",
    // Reportes
    "reportes:ver",
    "reportes:exportar",
  ],
  supervisor: [
    // Solo ve su(s) unidad(es), no gestiona
    "unidades:ver",
    // Puede crear usuarios solo para su unidad (operadores y auditores)
    "usuarios:gestionar",
    // Gestión limitada de recursos de su unidad
    "vehiculos:gestionar",
    "choferes:gestionar",
    "centros-costo:gestionar",
    // Eventos de su unidad
    "eventos:crear",
    "eventos:editar",
    "eventos:validar",
    "eventos:ver",
    // Reportes de su unidad
    "reportes:ver",
    "reportes:exportar",
  ],
  operador: [
    // Solo WhatsApp, acceso mínimo web
    "eventos:crear",
    "eventos:ver",
  ],
  auditor: [
    // Solo lectura
    "unidades:ver",
    "eventos:ver",
    "reportes:ver",
    "reportes:exportar",
  ],
};

/**
 * Usuario autenticado
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  empresaId: number | null;
  empresaSubdomain?: string | null;
  
  /**
   * IDs de unidades de negocio asignadas al usuario
   * - admin: array vacío (ve todas las unidades)
   * - supervisor/auditor: IDs de unidades específicas asignadas
   * - operador: ID de su unidad (solo una)
   */
  unidadesAsignadas: number[];
  
  avatar?: string;
  telefono?: string;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

/**
 * Datos para crear/editar un usuario
 */
export interface UserFormData {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  unidadesAsignadas: number[];
  telefono?: string;
  avatar?: string;
}

/**
 * Verifica si el usuario puede ver todas las unidades
 */
export function canViewAllUnits(user: User | null): boolean {
  if (!user) return false;
  // Admin ve todas, supervisor/auditor solo las asignadas
  return user.role === "admin" || user.role === "superadmin";
}

/**
 * Verifica si el usuario tiene acceso a una unidad específica
 */
export function canAccessUnit(user: User | null, unidadId: number): boolean {
  if (!user) return false;
  // Admin y superadmin acceden a todo
  if (user.role === "admin" || user.role === "superadmin") return true;
  // Otros roles solo si está en sus unidades asignadas
  return user.unidadesAsignadas.includes(unidadId);
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta del login
 */
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Helper para verificar permisos
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  // Superadmin tiene acceso a todo
  if (user.role === "superadmin") return true;
  
  // Si el usuario tiene permisos personalizados, usarlos
  if (user.permissions) {
    return user.permissions.includes(permission);
  }
  
  // De lo contrario, usar los permisos del rol
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

/**
 * Helper para verificar si tiene alguno de los roles
 */
export function hasRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
