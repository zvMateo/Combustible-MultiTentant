/**
 * Hooks de TanStack Query para Resources (Vehículos, Tanques, Surtidores)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourcesApi, resourceTypesApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useIdCompany } from "@/stores/auth.store";
import type {
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

/**
 * Obtener todos los recursos
 */
export function useResources(idCompany?: number) {
  const storeCompanyId = useIdCompany();
  const companyId = idCompany ?? storeCompanyId ?? 0;

  return useQuery({
    queryKey: resourcesKeys.byCompany(companyId),
    queryFn: () => resourcesApi.getByCompany(companyId),
    enabled: !!companyId,
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

  return useQuery({
    queryKey: resourcesKeys.vehicles(companyId),
    queryFn: async () => {
      const all = await resourcesApi.getByCompany(companyId);
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
    enabled: !!companyId,
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

  return useQuery({
    queryKey: resourcesKeys.tanks(companyId),
    queryFn: async () => {
      const all = await resourcesApi.getByCompany(companyId);
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
    enabled: !!companyId,
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

  return useQuery({
    queryKey: resourcesKeys.dispensers(companyId),
    queryFn: async () => {
      const all = await resourcesApi.getByCompany(companyId);
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
    enabled: !!companyId,
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
