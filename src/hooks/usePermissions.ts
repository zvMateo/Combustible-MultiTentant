// src/hooks/usePermissions.ts
/**
 * Hook centralizado para validar permisos y roles
 *
 * Este hook proporciona una API consistente para validar permisos
 * en toda la aplicación, usando el store de autenticación.
 *
 * @example
 * const { can, canAll, canAny, hasRole, isAdmin } = usePermissions();
 *
 * if (can("eventos:crear")) {
 *   // Mostrar botón de crear evento
 * }
 *
 * if (canAll(["eventos:editar", "eventos:eliminar"])) {
 *   // Mostrar panel de administración
 * }
 *
 * if (canAny(["reportes:ver", "dashboard:ver"])) {
 *   // Mostrar sección de analytics
 * }
 */

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { Permission, UserRole } from "@/types";

interface UsePermissionsReturn {
  /**
   * Verifica si el usuario tiene un permiso específico
   */
  can: (permission: Permission) => boolean;

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados
   */
  canAll: (permissions: Permission[]) => boolean;

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
   */
  canAny: (permissions: Permission[]) => boolean;

  /**
   * Verifica si el usuario tiene uno de los roles especificados
   */
  hasRole: (roles: UserRole[]) => boolean;

  /**
   * Verifica si el usuario es administrador de empresa
   */
  isAdmin: () => boolean;

  /**
   * Verifica si el usuario es supervisor
   */
  isSupervisor: () => boolean;

  /**
   * Verifica si el usuario es auditor
   */
  isAuditor: () => boolean;

  /**
   * Verifica si el usuario es operador
   */
  isOperador: () => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const {
    user,
    hasPermission: storeHasPermission,
    hasRole: storeHasRole,
    isAdmin: storeIsAdmin,
  } = useAuthStore();

  return useMemo(() => {
    const can = (permission: Permission): boolean => {
      return storeHasPermission(permission);
    };

    const canAll = (permissions: Permission[]): boolean => {
      if (!user || permissions.length === 0) return false;
      return permissions.every((perm) => storeHasPermission(perm));
    };

    const canAny = (permissions: Permission[]): boolean => {
      if (!user || permissions.length === 0) return false;
      return permissions.some((perm) => storeHasPermission(perm));
    };

    const hasRole = (roles: UserRole[]): boolean => {
      return storeHasRole(roles);
    };

    const isAdmin = (): boolean => {
      return storeIsAdmin();
    };

    const isSupervisor = (): boolean => {
      return user?.role === "supervisor";
    };

    const isAuditor = (): boolean => {
      return user?.role === "auditor";
    };

    const isOperador = (): boolean => {
      return user?.role === "operador";
    };

    return {
      can,
      canAll,
      canAny,
      hasRole,
      isAdmin,
      isSupervisor,
      isAuditor,
      isOperador,
    };
  }, [user, storeHasPermission, storeHasRole, storeIsAdmin]);
}
