// src/hooks/queries/useChoferes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { choferesService } from "@/services";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadIdFilter } from "@/hooks/useUnidadFilterLogic";
import type { ChoferFormData, ChoferFilters, PaginationParams } from "@/types";
import { toast } from "sonner";

export const choferesKeys = {
  all: ["choferes"] as const,
  lists: () => [...choferesKeys.all, "list"] as const,
  list: (empresaId: number, params?: PaginationParams & ChoferFilters) =>
    [...choferesKeys.lists(), empresaId, params] as const,
  details: () => [...choferesKeys.all, "detail"] as const,
  detail: (id: number) => [...choferesKeys.details(), id] as const,
  stats: (id: number) => [...choferesKeys.all, "stats", id] as const,
};

/**
 * Hook para listar choferes con filtro automático por unidad
 */
export function useChoferes(params?: PaginationParams & ChoferFilters) {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;
  const unidadIdFilter = useUnidadIdFilter();

  // Combinar filtros pasados con el filtro de unidad
  const fullParams = {
    ...params,
    unidadId: params?.unidadId ?? unidadIdFilter,
  };

  return useQuery({
    queryKey: choferesKeys.list(empresaId, fullParams),
    queryFn: () => choferesService.list(empresaId, fullParams),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useChofer(id: number) {
  return useQuery({
    queryKey: choferesKeys.detail(id),
    queryFn: () => choferesService.getById(id),
    enabled: id > 0,
  });
}

export function useChoferStats(id: number) {
  return useQuery({
    queryKey: choferesKeys.stats(id),
    queryFn: () => choferesService.getStats(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateChofer() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: (data: ChoferFormData) => choferesService.create(empresaId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: choferesKeys.lists() });
      toast.success(response.message || "Chofer creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear chofer");
    },
  });
}

export function useUpdateChofer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChoferFormData> }) =>
      choferesService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: choferesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: choferesKeys.detail(id) });
      toast.success(response.message || "Chofer actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar chofer");
    },
  });
}

export function useDeleteChofer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => choferesService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: choferesKeys.lists() });
      toast.success(response.message || "Chofer eliminado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar chofer");
    },
  });
}

