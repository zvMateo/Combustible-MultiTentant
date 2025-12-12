// src/types/auth.ts

/**
 * Roles del sistema
 * - admin: Administrador de empresa/tenant
 * - supervisor: Puede validar eventos
 * - operador: Solo puede registrar cargas
 * - auditor: Solo lectura para auditorías
 */
export type UserRole = "admin" | "supervisor" | "operador" | "auditor";

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
  | "recursos:gestionar"
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
    "recursos:gestionar",
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
    "recursos:gestionar", // Puede gestionar recursos (tanques, surtidores)
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
  id: string; // ✅ String, no number
  email: string;
  name: string;
  role: UserRole;
  idCompany?: number; // ✅ Agregar
  idBusinessUnit?: number; // ✅ Agregar
  empresaId: number | null;
  empresaNombre?: string;
  empresaSubdomain?: string;
  unidadesAsignadas?: number[];
  telefono?: string;
  /** Permisos personalizados del usuario (opcional, si viene de la API) */
  permissions?: Permission[];
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
  return user.role === "admin";
}

/**
 * Verifica si el usuario tiene acceso a una unidad específica
 */
export function canAccessUnit(user: User | null, unidadId: number): boolean {
  if (!user) return false;
  // Admin accede a todo
  if (user.role === "admin") return true;
  // Otros roles solo si está en sus unidades asignadas
  return (user.unidadesAsignadas ?? []).includes(unidadId);
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
 * @param user - Usuario a verificar
 * @param permission - Permiso requerido
 * @returns true si el usuario tiene el permiso
 */
export function hasPermission(
  user: User | null,
  permission: Permission
): boolean {
  if (!user) return false;

  // Si el usuario tiene permisos personalizados, usarlos (tienen prioridad)
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }

  // De lo contrario, usar los permisos del rol
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

/**
 * Helper para verificar múltiples permisos (requiere TODOS)
 * @param user - Usuario a verificar
 * @param permissions - Lista de permisos requeridos
 * @returns true si el usuario tiene TODOS los permisos
 */
export function hasAllPermissions(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.every((perm) => hasPermission(user, perm));
}

/**
 * Helper para verificar múltiples permisos (requiere AL MENOS UNO)
 * @param user - Usuario a verificar
 * @param permissions - Lista de permisos requeridos
 * @returns true si el usuario tiene AL MENOS UNO de los permisos
 */
export function hasAnyPermission(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.some((perm) => hasPermission(user, perm));
}

/**
 * Helper para verificar si tiene alguno de los roles
 */
export function hasRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
