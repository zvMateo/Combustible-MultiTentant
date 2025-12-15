/**
 * Hooks de TanStack Query para Resources (Vehículos, Tanques, Surtidores)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourcesApi, resourceTypesApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore, useIdBusinessUnit, useIdCompany } from "@/stores/auth.store";
import { useUnidadActivaId } from "@/stores/unidad.store";
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  CreateResourceTypeRequest,
  UpdateResourceTypeRequest,
} from "@/types/api.types";

// Query Keys
export const resourcesKeys = {
  all: ["resources"] as const,
  lists: () => [...resourcesKeys.all, "list"] as const,
  list: (filters?: {
    idType?: number;
    idCompany?: number;
    idBusinessUnit?: number;
  }) => [...resourcesKeys.lists(), filters] as const,
  detail: (id: number) => [...resourcesKeys.all, "detail", id] as const,
  byType: (idType: number) => [...resourcesKeys.all, "byType", idType] as const,
  byCompany: (idCompany: number) =>
    [...resourcesKeys.all, "byCompany", idCompany] as const,
  byBusinessUnit: (idBusinessUnit: number) =>
    [...resourcesKeys.all, "byBusinessUnit", idBusinessUnit] as const,
  vehicles: (idCompany: number) =>
    [...resourcesKeys.all, "vehicles", idCompany] as const,
  tanks: (idCompany: number) =>
    [...resourcesKeys.all, "tanks", idCompany] as const,
  dispensers: (idCompany: number) =>
    [...resourcesKeys.all, "dispensers", idCompany] as const,
};

export const resourceTypesKeys = {
  all: ["resourceTypes"] as const,
  lists: () => [...resourceTypesKeys.all, "list"] as const,
  byCompany: (idCompany: number) =>
    [...resourceTypesKeys.all, "byCompany", idCompany] as const,
  detail: (id: number) => [...resourceTypesKeys.all, "detail", id] as const,
};

function normalizeResource(raw: unknown): Resource {
  const r = raw as Record<string, unknown>;

  const id =
    (r.id as number | undefined) ??
    (r.Id as number | undefined) ??
    (r.ID as number | undefined) ??
    0;

  const idType =
    (r.idType as number | undefined) ??
    (r.IdType as number | undefined) ??
    (r.idtype as number | undefined) ??
    0;

  const idCompany =
    (r.idCompany as number | undefined) ??
    (r.IdCompany as number | undefined) ??
    (r.idcompany as number | undefined) ??
    0;

  const idBusinessUnit =
    (r.idBusinessUnit as number | undefined) ??
    (r.IdBusinessUnit as number | undefined) ??
    (r.idbusinessunit as number | undefined);

  const name =
    (r.name as string | undefined) ??
    (r.Name as string | undefined) ??
    "";

  const identifier =
    (r.identifier as string | undefined) ??
    (r.Identifier as string | undefined) ??
    "";

  const nativeLiters =
    (r.nativeLiters as number | undefined) ??
    (r.NativeLiters as number | undefined);
  const actualLiters =
    (r.actualLiters as number | undefined) ??
    (r.ActualLiters as number | undefined);

  const active =
    (r.active as boolean | undefined) ??
    (r.Active as boolean | undefined) ??
    (r.isActive as boolean | undefined) ??
    (r.IsActive as boolean | undefined);
  const isActive =
    (r.isActive as boolean | undefined) ??
    (r.IsActive as boolean | undefined) ??
    (r.active as boolean | undefined) ??
    (r.Active as boolean | undefined);

  return {
    ...(r as unknown as Resource),
    id,
    idType,
    idCompany,
    ...(typeof idBusinessUnit === "number" ? { idBusinessUnit } : null),
    name,
    identifier,
    ...(typeof nativeLiters === "number" ? { nativeLiters } : null),
    ...(typeof actualLiters === "number" ? { actualLiters } : null),
    ...(typeof active === "boolean" ? { active } : null),
    ...(typeof isActive === "boolean" ? { isActive } : null),
  };
}

/**
 * Obtener todos los recursos
 */
export function useResources(idCompany?: number) {
  const storeCompanyId = useIdCompany();
  const companyId = idCompany ?? storeCompanyId ?? 0;

  const user = useAuthStore((s) => s.user);
  const hasUser = !!user;
  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = useIdBusinessUnit();
  const fallbackAssignedId = user?.unidadesAsignadas?.[0] ?? null;

  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isCompanyAdmin = isAdmin || isSuperAdmin;
  const isAdminAssigned =
    isAdmin && (!!userBusinessUnitId || !!fallbackAssignedId);

  const businessUnitId =
    activeBusinessUnitId ??
    (isAdminAssigned ? (userBusinessUnitId ?? fallbackAssignedId) : null) ??
    (!isCompanyAdmin ? (userBusinessUnitId ?? fallbackAssignedId) : null);

  const useBusinessUnitScope = !!businessUnitId;
  const shouldHaveBusinessUnit = !isCompanyAdmin || isAdminAssigned;
  const enabled =
    hasUser &&
    (useBusinessUnitScope ? true : shouldHaveBusinessUnit ? false : !!companyId);

  return useQuery({
    queryKey: useBusinessUnitScope
      ? resourcesKeys.byBusinessUnit(businessUnitId as number)
      : resourcesKeys.byCompany(companyId),
    queryFn: async () => {
      const data = useBusinessUnitScope
        ? await resourcesApi.getByBusinessUnit(businessUnitId as number)
        : await resourcesApi.getByCompany(companyId);
      return Array.isArray(data) ? data.map(normalizeResource) : [];
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener recurso por ID
 */
export function useResource(id: number) {
  return useQuery({
    queryKey: resourcesKeys.detail(id),
    queryFn: () => resourcesApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener recursos por tipo
 */
export function useResourcesByType(idType: number) {
  return useQuery({
    queryKey: resourcesKeys.byType(idType),
    queryFn: () => resourcesApi.getByType(idType),
    enabled: !!idType,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener recursos por empresa
 */
export function useResourcesByCompany(idCompany: number) {
  return useQuery({
    queryKey: resourcesKeys.byCompany(idCompany),
    queryFn: () => resourcesApi.getByCompany(idCompany),
    enabled: !!idCompany,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener recursos por unidad de negocio
 */
export function useResourcesByBusinessUnit(idBusinessUnit: number) {
  return useQuery({
    queryKey: resourcesKeys.byBusinessUnit(idBusinessUnit),
    queryFn: () => resourcesApi.getByBusinessUnit(idBusinessUnit),
    enabled: !!idBusinessUnit,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener todos los vehículos
 * Usa GetAll y filtra en el frontend para evitar problemas con tipos inconsistentes
 * Incluye recursos con idType 1 (legacy) o idType 5 (nuevo tipo "Vehiculo")
 */
export function useVehicles() {
  const storeCompanyId = useIdCompany();
  const companyId = storeCompanyId ?? 0;

  const user = useAuthStore((s) => s.user);
  const hasUser = !!user;
  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = useIdBusinessUnit();
  const fallbackAssignedId = user?.unidadesAsignadas?.[0] ?? null;

  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isCompanyAdmin = isAdmin || isSuperAdmin;
  const isAdminAssigned =
    isAdmin && (!!userBusinessUnitId || !!fallbackAssignedId);

  const businessUnitId =
    activeBusinessUnitId ??
    (isAdminAssigned ? (userBusinessUnitId ?? fallbackAssignedId) : null) ??
    (!isCompanyAdmin ? (userBusinessUnitId ?? fallbackAssignedId) : null);

  const useBusinessUnitScope = !!businessUnitId;
  const shouldHaveBusinessUnit = !isCompanyAdmin || isAdminAssigned;
  const enabled =
    hasUser &&
    (useBusinessUnitScope ? true : shouldHaveBusinessUnit ? false : !!companyId);

  return useQuery({
    queryKey: useBusinessUnitScope
      ? resourcesKeys.list({ idType: 1, idBusinessUnit: businessUnitId as number })
      : resourcesKeys.vehicles(companyId),
    queryFn: async () => {
      const raw = useBusinessUnitScope
        ? await resourcesApi.getByBusinessUnit(businessUnitId as number)
        : await resourcesApi.getByCompany(companyId);

      const all = Array.isArray(raw) ? raw.map(normalizeResource) : [];
      // Filtrar vehículos: idType 1 (legacy), idType 5 (nuevo tipo "Vehiculo"), o que tenga "vehiculo" en el type array
      // También filtrar recursos inactivos (active: false)
      return all.filter((r) => {
        // Excluir recursos inactivos
        if (r.active === false || r.isActive === false) {
          return false;
        }

        const typeArray = (r as { type?: unknown[] }).type ?? [];
        if (typeArray.length > 0) {
          // Si tiene type array, verificar si es vehículo o no es tanque/surtidor
          const isVehicle = typeArray.some((t: unknown) =>
            typeof t === "string"
              ? t.toLowerCase().includes("vehiculo") ||
                t.toLowerCase().includes("vehicle")
              : false
          );
          const isNotTankOrDispenser = !typeArray.some((t: unknown) =>
            typeof t === "string"
              ? t.toLowerCase().includes("tanque") ||
                t.toLowerCase().includes("surtidor") ||
                t.toLowerCase().includes("dispenser")
              : false
          );
          return isVehicle || isNotTankOrDispenser;
        }
        // Si no tiene type array, usar idType: 1 (legacy) o 5 (nuevo tipo "Vehiculo")
        return r.idType === 1 || r.idType === 5;
      });
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener todos los tanques
 * Usa GetAll y filtra en el frontend para evitar problemas con tipos inconsistentes
 */
export function useTanks() {
  const storeCompanyId = useIdCompany();
  const companyId = storeCompanyId ?? 0;

  const user = useAuthStore((s) => s.user);
  const hasUser = !!user;
  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = useIdBusinessUnit();
  const fallbackAssignedId = user?.unidadesAsignadas?.[0] ?? null;

  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isCompanyAdmin = isAdmin || isSuperAdmin;
  const isAdminAssigned =
    isAdmin && (!!userBusinessUnitId || !!fallbackAssignedId);

  const businessUnitId =
    activeBusinessUnitId ??
    (isAdminAssigned ? (userBusinessUnitId ?? fallbackAssignedId) : null) ??
    (!isCompanyAdmin ? (userBusinessUnitId ?? fallbackAssignedId) : null);

  const useBusinessUnitScope = !!businessUnitId;
  const shouldHaveBusinessUnit = !isCompanyAdmin || isAdminAssigned;
  const enabled =
    hasUser &&
    (useBusinessUnitScope ? true : shouldHaveBusinessUnit ? false : !!companyId);

  return useQuery({
    queryKey: useBusinessUnitScope
      ? resourcesKeys.list({ idType: 2, idBusinessUnit: businessUnitId as number })
      : resourcesKeys.tanks(companyId),
    queryFn: async () => {
      const raw = useBusinessUnitScope
        ? await resourcesApi.getByBusinessUnit(businessUnitId as number)
        : await resourcesApi.getByCompany(companyId);

      const all = Array.isArray(raw) ? raw.map(normalizeResource) : [];
      // Filtrar tanques: buscar por type array o idType 2
      // También filtrar recursos inactivos (active: false)
      return all.filter((r) => {
        // Excluir recursos inactivos
        if (r.active === false || r.isActive === false) {
          return false;
        }

        const typeArray = (r as { type?: unknown[] }).type ?? [];
        if (typeArray.length > 0) {
          return typeArray.some((t: unknown) =>
            typeof t === "string" ? t.toLowerCase().includes("tanque") : false
          );
        }
        return r.idType === 2;
      });
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener todos los surtidores
 * Usa GetAll y filtra en el frontend para evitar problemas con tipos inconsistentes
 */
export function useDispensers() {
  const storeCompanyId = useIdCompany();
  const companyId = storeCompanyId ?? 0;

  const user = useAuthStore((s) => s.user);
  const hasUser = !!user;
  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = useIdBusinessUnit();
  const fallbackAssignedId = user?.unidadesAsignadas?.[0] ?? null;

  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isCompanyAdmin = isAdmin || isSuperAdmin;
  const isAdminAssigned =
    isAdmin && (!!userBusinessUnitId || !!fallbackAssignedId);

  const businessUnitId =
    activeBusinessUnitId ??
    (isAdminAssigned ? (userBusinessUnitId ?? fallbackAssignedId) : null) ??
    (!isCompanyAdmin ? (userBusinessUnitId ?? fallbackAssignedId) : null);

  const useBusinessUnitScope = !!businessUnitId;
  const shouldHaveBusinessUnit = !isCompanyAdmin || isAdminAssigned;
  const enabled =
    hasUser &&
    (useBusinessUnitScope ? true : shouldHaveBusinessUnit ? false : !!companyId);

  return useQuery({
    queryKey: useBusinessUnitScope
      ? resourcesKeys.list({ idType: 3, idBusinessUnit: businessUnitId as number })
      : resourcesKeys.dispensers(companyId),
    queryFn: async () => {
      const raw = useBusinessUnitScope
        ? await resourcesApi.getByBusinessUnit(businessUnitId as number)
        : await resourcesApi.getByCompany(companyId);

      const all = Array.isArray(raw) ? raw.map(normalizeResource) : [];
      // Filtrar surtidores: buscar por type array o idType 3
      // También filtrar recursos inactivos (active: false)
      return all.filter((r) => {
        // Excluir recursos inactivos
        if (r.active === false || r.isActive === false) {
          return false;
        }

        const typeArray = (r as { type?: unknown[] }).type ?? [];
        if (typeArray.length > 0) {
          return typeArray.some((t: unknown) =>
            typeof t === "string"
              ? t.toLowerCase().includes("surtidor") ||
                t.toLowerCase().includes("dispenser")
              : false
          );
        }
        return r.idType === 3;
      });
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Crear nuevo recurso
 */
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResourceRequest) => resourcesApi.create(data),
    onSuccess: () => {
      toast.success("Recurso creado correctamente");
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar recurso
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateResourceRequest) => resourcesApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Recurso actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
      queryClient.invalidateQueries({
        queryKey: resourcesKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar recurso
 */
export function useDeactivateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => resourcesApi.deactivate(id),
    onSuccess: () => {
      toast.success("Recurso desactivado");
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// ============================================
// Resource Types Hooks
// ============================================

/**
 * Obtener todos los tipos de recursos
 */
export function useResourceTypes() {
  const storeCompanyId = useIdCompany();
  const companyId = storeCompanyId ?? 0;

  return useQuery({
    queryKey: resourceTypesKeys.byCompany(companyId),
    queryFn: () => resourceTypesApi.getByCompany(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Obtener tipo de recurso por ID
 */
export function useResourceType(id: number) {
  return useQuery({
    queryKey: resourceTypesKeys.detail(id),
    queryFn: () => resourceTypesApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Crear nuevo tipo de recurso
 */
export function useCreateResourceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResourceTypeRequest) =>
      resourceTypesApi.create(data),
    onSuccess: () => {
      toast.success("Tipo de recurso creado correctamente");
      queryClient.invalidateQueries({ queryKey: resourceTypesKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar tipo de recurso
 */
export function useUpdateResourceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateResourceTypeRequest) =>
      resourceTypesApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Tipo de recurso actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: resourceTypesKeys.all });
      queryClient.invalidateQueries({
        queryKey: resourceTypesKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar tipo de recurso
 */
export function useDeactivateResourceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => resourceTypesApi.deactivate(id),
    onSuccess: () => {
      toast.success("Tipo de recurso desactivado");
      queryClient.invalidateQueries({ queryKey: resourceTypesKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
