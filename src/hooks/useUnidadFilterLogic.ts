// src/hooks/useUnidadFilterLogic.ts
/**
 * Hook que encapsula la lógica de filtrado por unidad de negocio
 *
 * Reglas:
 * - Admin con "Todas" seleccionado: no filtra (undefined)
 * - Admin con unidad específica: filtra por esa unidad
 * - Supervisor/Auditor: siempre filtra por sus unidades asignadas
 */

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadStore } from "@/stores/unidad.store";

interface UnidadFilterResult {
  /** ID de unidad para filtrar, o undefined si no hay filtro */
  unidadIdFilter: number | undefined;
  /** Array de IDs de unidades (para usuarios con múltiples unidades asignadas) */
  unidadIdsFilter: number[] | undefined;
  /** Si el usuario puede ver todas las unidades */
  canViewAll: boolean;
  /** Si hay un filtro activo */
  hasFilter: boolean;
  /** Nombre de la unidad activa para mostrar */
  unidadNombre: string;
  /** Si el usuario es admin */
  isAdmin: boolean;
}

export function useUnidadFilterLogic(): UnidadFilterResult {
  const { user } = useAuthStore();
  const { unidadActiva, unidades } = useUnidadStore();

  return useMemo(() => {
    const isAdmin = user?.role === "admin";
    const isSupervisor = user?.role === "supervisor";
    const isAuditor = user?.role === "auditor";
    const unidadesAsignadas = user?.unidadesAsignadas ?? [];

    // Admin puede ver todas si no tiene unidad seleccionada
    if (isAdmin) {
      // Si hay unidad activa seleccionada, filtrar por ella
      if (unidadActiva) {
        return {
          unidadIdFilter: unidadActiva.id,
          unidadIdsFilter: [unidadActiva.id],
          canViewAll: true,
          hasFilter: true,
          unidadNombre: unidadActiva.nombre,
          isAdmin: true,
        };
      }
      // Si no hay unidad activa, no filtrar (ver todas)
      return {
        unidadIdFilter: undefined,
        unidadIdsFilter: undefined,
        canViewAll: true,
        hasFilter: false,
        unidadNombre: "Todas las unidades",
        isAdmin: true,
      };
    }

    // Supervisor y Auditor siempre filtran por sus unidades asignadas
    if (isSupervisor || isAuditor) {
      // Si tiene una sola unidad asignada
      if (unidadesAsignadas.length === 1) {
        const unidadNombre =
          unidades.find((u) => u.id === unidadesAsignadas[0])?.nombre ??
          "Mi Unidad";
        return {
          unidadIdFilter: unidadesAsignadas[0],
          unidadIdsFilter: unidadesAsignadas,
          canViewAll: false,
          hasFilter: true,
          unidadNombre,
          isAdmin: false,
        };
      }

      // Si tiene múltiples unidades asignadas
      if (unidadesAsignadas.length > 1) {
        // Si hay unidad activa, filtrar por ella
        if (unidadActiva && unidadesAsignadas.includes(unidadActiva.id)) {
          return {
            unidadIdFilter: unidadActiva.id,
            unidadIdsFilter: unidadesAsignadas,
            canViewAll: false,
            hasFilter: true,
            unidadNombre: unidadActiva.nombre,
            isAdmin: false,
          };
        }
        // Si no, usar la primera unidad asignada
        const unidadNombre =
          unidades.find((u) => u.id === unidadesAsignadas[0])?.nombre ??
          "Mi Unidad";
        return {
          unidadIdFilter: unidadesAsignadas[0],
          unidadIdsFilter: unidadesAsignadas,
          canViewAll: false,
          hasFilter: true,
          unidadNombre,
          isAdmin: false,
        };
      }
    }

    // Por defecto, no filtrar
    return {
      unidadIdFilter: undefined,
      unidadIdsFilter: undefined,
      canViewAll: false,
      hasFilter: false,
      unidadNombre: "",
      isAdmin: false,
    };
  }, [user, unidadActiva, unidades]);
}

/**
 * Hook simplificado que solo retorna el ID de unidad para filtrar
 * Útil para pasarlo directamente a los hooks de queries
 */
export function useUnidadIdFilter(): number | undefined {
  const { unidadIdFilter } = useUnidadFilterLogic();
  return unidadIdFilter;
}
