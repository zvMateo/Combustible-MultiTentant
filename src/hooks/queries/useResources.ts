/**
 * Hooks de TanStack Query para Resources (Vehículos, Tanques, Surtidores)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resourcesApi, resourceTypesApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type {
  Resource,
  ResourceType,
  CreateResourceRequest,
  UpdateResourceRequest,
  CreateResourceTypeRequest,
  UpdateResourceTypeRequest,
} from "@/types/api.types";
import { RESOURCE_TYPES } from "@/types/api.types";

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
  vehicles: () => [...resourcesKeys.all, "vehicles"] as const,
  tanks: () => [...resourcesKeys.all, "tanks"] as const,
  dispensers: () => [...resourcesKeys.all, "dispensers"] as const,
};

export const resourceTypesKeys = {
  all: ["resourceTypes"] as const,
  lists: () => [...resourceTypesKeys.all, "list"] as const,
  detail: (id: number) => [...resourceTypesKeys.all, "detail", id] as const,
};

/**
 * Obtener todos los recursos
 */
export function useResources() {
  return useQuery({
    queryKey: resourcesKeys.lists(),
    queryFn: () => resourcesApi.getAll(),
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
  return useQuery({
    queryKey: resourcesKeys.vehicles(),
    queryFn: async () => {
      const all = await resourcesApi.getAll();
      // Filtrar vehículos: idType 1 (legacy), idType 5 (nuevo tipo "Vehiculo"), o que tenga "vehiculo" en el type array
      // También filtrar recursos inactivos (active: false)
      return all.filter((r) => {
        // Excluir recursos inactivos
        if (r.active === false || r.isActive === false) {
          return false;
        }

        const typeArray = (r as any).type || [];
        if (typeArray.length > 0) {
          // Si tiene type array, verificar si es vehículo o no es tanque/surtidor
          const isVehicle = typeArray.some(
            (t: string) =>
              t.toLowerCase().includes("vehiculo") ||
              t.toLowerCase().includes("vehicle")
          );
          const isNotTankOrDispenser = !typeArray.some(
            (t: string) =>
              t.toLowerCase().includes("tanque") ||
              t.toLowerCase().includes("surtidor") ||
              t.toLowerCase().includes("dispenser")
          );
          return isVehicle || isNotTankOrDispenser;
        }
        // Si no tiene type array, usar idType: 1 (legacy) o 5 (nuevo tipo "Vehiculo")
        return r.idType === 1 || r.idType === 5;
      });
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener todos los tanques
 * Usa GetAll y filtra en el frontend para evitar problemas con tipos inconsistentes
 */
export function useTanks() {
  return useQuery({
    queryKey: resourcesKeys.tanks(),
    queryFn: async () => {
      const all = await resourcesApi.getAll();
      // Filtrar tanques: buscar por type array o idType 2
      // También filtrar recursos inactivos (active: false)
      return all.filter((r) => {
        // Excluir recursos inactivos
        if (r.active === false || r.isActive === false) {
          return false;
        }

        const typeArray = (r as any).type || [];
        if (typeArray.length > 0) {
          return typeArray.some((t: string) =>
            t.toLowerCase().includes("tanque")
          );
        }
        return r.idType === 2;
      });
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener todos los surtidores
 * Usa GetAll y filtra en el frontend para evitar problemas con tipos inconsistentes
 */
export function useDispensers() {
  return useQuery({
    queryKey: resourcesKeys.dispensers(),
    queryFn: async () => {
      const all = await resourcesApi.getAll();
      // Filtrar surtidores: buscar por type array o idType 3
      // También filtrar recursos inactivos (active: false)
      return all.filter((r) => {
        // Excluir recursos inactivos
        if (r.active === false || r.isActive === false) {
          return false;
        }

        const typeArray = (r as any).type || [];
        if (typeArray.length > 0) {
          return typeArray.some(
            (t: string) =>
              t.toLowerCase().includes("surtidor") ||
              t.toLowerCase().includes("dispenser")
          );
        }
        return r.idType === 3;
      });
    },
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
      queryClient.invalidateQueries({ queryKey: resourcesKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: resourcesKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: resourcesKeys.lists() });
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
  return useQuery({
    queryKey: resourceTypesKeys.lists(),
    queryFn: () => resourceTypesApi.getAll(),
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
      queryClient.invalidateQueries({ queryKey: resourceTypesKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: resourceTypesKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: resourceTypesKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
