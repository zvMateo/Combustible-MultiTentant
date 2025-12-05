// src/hooks/queries/useVehiculos.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiculosService } from "@/services";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadIdFilter } from "@/hooks/useUnidadFilterLogic";
import type {
  VehiculoFormData,
  VehiculoFilters,
  PaginationParams,
} from "@/types";
import { toast } from "sonner";

// Query Keys
export const vehiculosKeys = {
  all: ["vehiculos"] as const,
  lists: () => [...vehiculosKeys.all, "list"] as const,
  list: (empresaId: number, params?: PaginationParams & VehiculoFilters) =>
    [...vehiculosKeys.lists(), empresaId, params] as const,
  details: () => [...vehiculosKeys.all, "detail"] as const,
  detail: (id: number) => [...vehiculosKeys.details(), id] as const,
  stats: (id: number) => [...vehiculosKeys.all, "stats", id] as const,
};

/**
 * Hook para listar vehículos con filtro automático por unidad
 */
export function useVehiculos(params?: PaginationParams & VehiculoFilters) {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;
  const unidadIdFilter = useUnidadIdFilter();

  // Combinar filtros pasados con el filtro de unidad
  const fullParams = {
    ...params,
    unidadId: params?.unidadId ?? unidadIdFilter,
  };

  return useQuery({
    queryKey: vehiculosKeys.list(empresaId, fullParams),
    queryFn: () => vehiculosService.list(empresaId, fullParams),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener vehículo por ID
 */
export function useVehiculo(id: number) {
  return useQuery({
    queryKey: vehiculosKeys.detail(id),
    queryFn: () => vehiculosService.getById(id),
    enabled: id > 0,
  });
}

/**
 * Hook para obtener estadísticas del vehículo
 */
export function useVehiculoStats(id: number) {
  return useQuery({
    queryKey: vehiculosKeys.stats(id),
    queryFn: () => vehiculosService.getStats(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para crear vehículo
 */
export function useCreateVehiculo() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: (data: VehiculoFormData) =>
      vehiculosService.create(empresaId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: vehiculosKeys.lists() });
      toast.success(response.message || "Vehículo creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear vehículo");
    },
  });
}

/**
 * Hook para actualizar vehículo
 */
export function useUpdateVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<VehiculoFormData>;
    }) => vehiculosService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: vehiculosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehiculosKeys.detail(id) });
      toast.success(response.message || "Vehículo actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar vehículo");
    },
  });
}

/**
 * Hook para eliminar vehículo
 */
export function useDeleteVehiculo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => vehiculosService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: vehiculosKeys.lists() });
      toast.success(response.message || "Vehículo eliminado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar vehículo");
    },
  });
}

/**
 * Hook para asignar chofer a vehículo
 */
export function useAsignarChofer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vehiculoId,
      choferId,
    }: {
      vehiculoId: number;
      choferId: number | null;
    }) => vehiculosService.asignarChofer(vehiculoId, choferId),
    onSuccess: (response, { vehiculoId }) => {
      queryClient.invalidateQueries({ queryKey: vehiculosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vehiculosKeys.detail(vehiculoId),
      });
      toast.success(response.message || "Chofer asignado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al asignar chofer");
    },
  });
}
