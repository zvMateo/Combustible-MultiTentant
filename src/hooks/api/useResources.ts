/**
 * Hooks de React Query para Recursos (Vehículos, Tanques, Surtidores)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { resourcesApi, resourceTypesApi } from "@/services/api/resources.api";
import { queryKeys, QUERY_TIMES, invalidateQueries } from "@/lib/query-client";
import { RESOURCE_TYPES } from "@/types/api.types";
import type {
  Resource,
  ResourceType,
  CreateResourceRequest,
  UpdateResourceRequest,
} from "@/types/api.types";

// ============================================
// QUERIES - RECURSOS
// ============================================

/**
 * Obtener todos los recursos
 */
export function useResources() {
  return useQuery({
    queryKey: queryKeys.resources.lists(),
    queryFn: () => resourcesApi.getAll(),
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener recurso por ID
 */
export function useResource(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.resources.detail(id!),
    queryFn: () => resourcesApi.getById(id!),
    enabled: !!id,
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener recursos por tipo
 */
export function useResourcesByType(typeId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.resources.byType(typeId!),
    queryFn: () => resourcesApi.getByType(typeId!),
    enabled: !!typeId,
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener recursos por empresa
 */
export function useResourcesByCompany(companyId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.resources.byCompany(companyId!),
    queryFn: () => resourcesApi.getByCompany(companyId!),
    enabled: !!companyId,
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener recursos por unidad de negocio
 */
export function useResourcesByBusinessUnit(businessUnitId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.resources.byBusinessUnit(businessUnitId!),
    queryFn: () => resourcesApi.getByBusinessUnit(businessUnitId!),
    enabled: !!businessUnitId,
    ...QUERY_TIMES.MODERATE,
  });
}

// ============================================
// QUERIES - TIPOS ESPECÍFICOS DE RECURSOS
// ============================================

/**
 * Obtener todos los vehículos
 */
export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.resources.vehicles(),
    queryFn: () => resourcesApi.getVehicles(),
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener todos los tanques
 */
export function useTanks() {
  return useQuery({
    queryKey: queryKeys.resources.tanks(),
    queryFn: () => resourcesApi.getTanks(),
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener todos los surtidores
 */
export function useDispensers() {
  return useQuery({
    queryKey: queryKeys.resources.dispensers(),
    queryFn: () => resourcesApi.getDispensers(),
    ...QUERY_TIMES.MODERATE,
  });
}

// ============================================
// QUERIES - TIPOS DE RECURSOS
// ============================================

/**
 * Obtener todos los tipos de recursos
 */
export function useResourceTypes() {
  return useQuery({
    queryKey: queryKeys.resourceTypes.list(),
    queryFn: () => resourceTypesApi.getAll(),
    ...QUERY_TIMES.IMMUTABLE,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear nuevo recurso
 */
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResourceRequest) => resourcesApi.create(data),
    onSuccess: (_, variables) => {
      invalidateQueries.resources();
      // Invalidar queries específicas
      if (variables.idCompany) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.resources.byCompany(variables.idCompany),
        });
      }
      if (variables.idBusinessUnit) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.resources.byBusinessUnit(variables.idBusinessUnit),
        });
      }
      
      // Mensaje según tipo
      const typeMessages: Record<number, string> = {
        [RESOURCE_TYPES.VEHICLE]: "Vehículo creado correctamente",
        [RESOURCE_TYPES.TANK]: "Tanque creado correctamente",
        [RESOURCE_TYPES.DISPENSER]: "Surtidor creado correctamente",
      };
      toast.success(typeMessages[variables.idType] || "Recurso creado correctamente");
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
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.detail(variables.id) });
      
      // Mensaje según tipo
      const typeMessages: Record<number, string> = {
        [RESOURCE_TYPES.VEHICLE]: "Vehículo actualizado correctamente",
        [RESOURCE_TYPES.TANK]: "Tanque actualizado correctamente",
        [RESOURCE_TYPES.DISPENSER]: "Surtidor actualizado correctamente",
      };
      toast.success(typeMessages[variables.idType] || "Recurso actualizado correctamente");
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
      invalidateQueries.resources();
      toast.success("Recurso desactivado correctamente");
    },
  });
}

// ============================================
// HOOKS ESPECÍFICOS PARA CREAR CADA TIPO
// ============================================

/**
 * Crear vehículo
 */
export function useCreateVehicle() {
  const createResource = useCreateResource();

  return {
    ...createResource,
    mutate: (data: Omit<CreateResourceRequest, "idType">) =>
      createResource.mutate({ ...data, idType: RESOURCE_TYPES.VEHICLE }),
    mutateAsync: (data: Omit<CreateResourceRequest, "idType">) =>
      createResource.mutateAsync({ ...data, idType: RESOURCE_TYPES.VEHICLE }),
  };
}

/**
 * Crear tanque
 */
export function useCreateTank() {
  const createResource = useCreateResource();

  return {
    ...createResource,
    mutate: (data: Omit<CreateResourceRequest, "idType">) =>
      createResource.mutate({ ...data, idType: RESOURCE_TYPES.TANK }),
    mutateAsync: (data: Omit<CreateResourceRequest, "idType">) =>
      createResource.mutateAsync({ ...data, idType: RESOURCE_TYPES.TANK }),
  };
}

/**
 * Crear surtidor
 */
export function useCreateDispenser() {
  const createResource = useCreateResource();

  return {
    ...createResource,
    mutate: (data: Omit<CreateResourceRequest, "idType">) =>
      createResource.mutate({ ...data, idType: RESOURCE_TYPES.DISPENSER }),
    mutateAsync: (data: Omit<CreateResourceRequest, "idType">) =>
      createResource.mutateAsync({ ...data, idType: RESOURCE_TYPES.DISPENSER }),
  };
}

export default {
  // Recursos generales
  useResources,
  useResource,
  useResourcesByType,
  useResourcesByCompany,
  useResourcesByBusinessUnit,
  // Tipos específicos
  useVehicles,
  useTanks,
  useDispensers,
  // Tipos de recursos
  useResourceTypes,
  // Mutations generales
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
  // Mutations específicas
  useCreateVehicle,
  useCreateTank,
  useCreateDispenser,
};


