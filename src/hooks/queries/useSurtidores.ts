// src/hooks/queries/useSurtidores.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { surtidoresService } from "@/services";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadIdFilter } from "@/hooks/useUnidadFilterLogic";
import type { SurtidorFormData, SurtidorFilters, PaginationParams } from "@/types";
import { toast } from "sonner";

export const surtidoresKeys = {
  all: ["surtidores"] as const,
  lists: () => [...surtidoresKeys.all, "list"] as const,
  list: (empresaId: number, params?: PaginationParams & SurtidorFilters) =>
    [...surtidoresKeys.lists(), empresaId, params] as const,
  details: () => [...surtidoresKeys.all, "detail"] as const,
  detail: (id: number) => [...surtidoresKeys.details(), id] as const,
  stats: (id: number) => [...surtidoresKeys.all, "stats", id] as const,
};

/**
 * Hook para listar surtidores con filtro automático por unidad
 */
export function useSurtidores(params?: PaginationParams & SurtidorFilters) {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;
  const unidadIdFilter = useUnidadIdFilter();

  // Combinar filtros pasados con el filtro de unidad
  const fullParams = {
    ...params,
    unidadId: params?.unidadId ?? unidadIdFilter,
  };

  return useQuery({
    queryKey: surtidoresKeys.list(empresaId, fullParams),
    queryFn: () => surtidoresService.list(empresaId, fullParams),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSurtidor(id: number) {
  return useQuery({
    queryKey: surtidoresKeys.detail(id),
    queryFn: () => surtidoresService.getById(id),
    enabled: id > 0,
  });
}

export function useSurtidorStats(id: number) {
  return useQuery({
    queryKey: surtidoresKeys.stats(id),
    queryFn: () => surtidoresService.getStats(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSurtidor() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: (data: SurtidorFormData) => surtidoresService.create(empresaId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: surtidoresKeys.lists() });
      toast.success(response.message || "Surtidor creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear surtidor");
    },
  });
}

export function useUpdateSurtidor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SurtidorFormData> }) =>
      surtidoresService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: surtidoresKeys.lists() });
      queryClient.invalidateQueries({ queryKey: surtidoresKeys.detail(id) });
      toast.success(response.message || "Surtidor actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar surtidor");
    },
  });
}

export function useDeleteSurtidor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => surtidoresService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: surtidoresKeys.lists() });
      toast.success(response.message || "Surtidor eliminado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar surtidor");
    },
  });
}

