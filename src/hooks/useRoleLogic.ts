// src/hooks/useRoleLogic.ts
/**
 * Hook centralizado para lógica específica de roles
 *
 * Proporciona funciones helper para determinar qué puede hacer cada rol:
 * - Administrador: Acceso completo a su empresa
 * - Supervisor: Solo su(s) unidad(es), puede validar eventos
 * - Operador: Acceso mínimo, solo crear eventos y gestionar recursos
 * - Auditor: Solo lectura de su unidad
 */

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadFilterLogic } from "./useUnidadFilterLogic";
import type { UserRole } from "@/types";

interface RoleLogicReturn {
  // Información del rol
  role: UserRole | null;
  isAdmin: boolean;
  isSupervisor: boolean;
  isOperador: boolean;
  isAuditor: boolean;

  // Permisos de visualización
  canViewAllUnits: boolean;
  canViewAllData: boolean;

  // Permisos de gestión
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canValidate: boolean;
  canExport: boolean;

  // Permisos específicos por módulo
  canManageUsers: boolean;
  canManageBusinessUnits: boolean;
  canManageVehicles: boolean;
  canManageDrivers: boolean;
  canManageResources: boolean;
  canManageCostCenters: boolean;
  canManageSettings: boolean;

  // Filtrado de datos
  unidadIdFilter: number | undefined;
  unidadIdsFilter: number[] | undefined;
  companyIdFilter: number | undefined;
  hasUnidadFilter: boolean;

  // Helpers para UI
  showEditButtons: boolean;
  showDeleteButtons: boolean;
  showCreateButtons: boolean;
  showExportButtons: boolean;
  isReadOnly: boolean;
}

export function useRoleLogic(): RoleLogicReturn {
  const { user } = useAuthStore();
  const {
    unidadIdFilter,
    unidadIdsFilter,
    hasFilter: hasUnidadFilter,
  } = useUnidadFilterLogic();

  return useMemo(() => {
    const role = user?.role || null;
    const isSuperAdmin = role === "superadmin";
    const isAdmin = role === "admin";
    const isSupervisor = role === "supervisor";
    const isOperador = role === "operador";
    const isAuditor = role === "auditor";

    const isAdminAssigned =
      isAdmin &&
      (!!user?.idBusinessUnit || (user?.unidadesAsignadas?.length ?? 0) > 0);

    // ============================================
    // PERMISOS DE VISUALIZACIÓN
    // ============================================
    const canViewAllUnits = isSuperAdmin || (isAdmin && !isAdminAssigned);
    const canViewAllData = isSuperAdmin || (isAdmin && !isAdminAssigned);

    // ============================================
    // PERMISOS DE GESTIÓN GENERALES
    // ============================================
    // Crear: Admin, Supervisor, Operador
    const canCreate = isSuperAdmin || isAdmin || isSupervisor || isOperador;

    // Editar: Admin, Supervisor
    const canEdit = isSuperAdmin || isAdmin || isSupervisor;

    // Eliminar: Solo Admin
    const canDelete = isSuperAdmin || isAdmin;

    // Validar eventos: Admin, Supervisor
    const canValidate = isSuperAdmin || isAdmin || isSupervisor;

    // Exportar: Admin, Supervisor, Auditor
    const canExport = isSuperAdmin || isAdmin || isSupervisor || isAuditor;

    // ============================================
    // PERMISOS ESPECÍFICOS POR MÓDULO
    // ============================================
    // Usuarios: Admin, Supervisor (solo para su unidad)
    const canManageUsers = isSuperAdmin || isAdmin || isSupervisor;

    // Unidades de Negocio: Solo Admin
    const canManageBusinessUnits = isSuperAdmin || (isAdmin && !isAdminAssigned);

    // Vehículos: Admin, Supervisor
    const canManageVehicles = isSuperAdmin || isAdmin || isSupervisor;

    // Choferes: Admin, Supervisor
    const canManageDrivers = isSuperAdmin || isAdmin || isSupervisor;

    // Recursos (tanques, surtidores): Admin, Supervisor, Operador
    const canManageResources = isSuperAdmin || isAdmin || isSupervisor || isOperador;

    // Centros de Costo: Admin, Supervisor
    const canManageCostCenters = isSuperAdmin || isAdmin || isSupervisor;

    // Configuración: Solo Admin
    const canManageSettings = isSuperAdmin || (isAdmin && !isAdminAssigned);

    // ============================================
    // FILTRADO DE DATOS
    // ============================================
    const companyIdFilter = user?.idCompany;

    // ============================================
    // HELPERS PARA UI
    // ============================================
    const showEditButtons = canEdit;
    const showDeleteButtons = canDelete;
    const showCreateButtons = canCreate;
    const showExportButtons = canExport;
    const isReadOnly = isAuditor; // Auditor es solo lectura

    return {
      role,
      isAdmin,
      isSupervisor,
      isOperador,
      isAuditor,
      canViewAllUnits,
      canViewAllData,
      canCreate,
      canEdit,
      canDelete,
      canValidate,
      canExport,
      canManageUsers,
      canManageBusinessUnits,
      canManageVehicles,
      canManageDrivers,
      canManageResources,
      canManageCostCenters,
      canManageSettings,
      unidadIdFilter,
      unidadIdsFilter,
      companyIdFilter,
      hasUnidadFilter,
      showEditButtons,
      showDeleteButtons,
      showCreateButtons,
      showExportButtons,
      isReadOnly,
    };
  }, [user, unidadIdFilter, unidadIdsFilter, hasUnidadFilter]);
}
