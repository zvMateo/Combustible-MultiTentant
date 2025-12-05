// src/hooks/queries/useCentrosCosto.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosCostoService } from "@/services";
import type { CentroCostoFormData, PaginationParams } from "@/types";
import { toast } from "sonner";

export const centrosCostoKeys = {
  all: ["centrosCosto"] as const,
  lists: () => [...centrosCostoKeys.all, "list"] as const,
  list: (empresaId: number, params?: PaginationParams & { search?: string }) =>
    [...centrosCostoKeys.lists(), empresaId, params] as const,
  details: () => [...centrosCostoKeys.all, "detail"] as const,
  detail: (id: number) => [...centrosCostoKeys.details(), id] as const,
  stats: (id: number) => [...centrosCostoKeys.all, "stats", id] as const,
};

export function useCentrosCosto(
  empresaId: number,
  params?: PaginationParams & { search?: string; tipo?: string }
) {
  return useQuery({
    queryKey: centrosCostoKeys.list(empresaId, params),
    queryFn: () => centrosCostoService.list(empresaId, params),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCentroCosto(id: number) {
  return useQuery({
    queryKey: centrosCostoKeys.detail(id),
    queryFn: () => centrosCostoService.getById(id),
    enabled: id > 0,
  });
}

export function useCentroCostoStats(id: number) {
  return useQuery({
    queryKey: centrosCostoKeys.stats(id),
    queryFn: () => centrosCostoService.getStats(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateCentroCosto(empresaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CentroCostoFormData) =>
      centrosCostoService.create(empresaId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: centrosCostoKeys.lists() });
      toast.success(response.message || "Centro de costo creado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear centro de costo");
    },
  });
}

export function useUpdateCentroCosto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CentroCostoFormData>;
    }) => centrosCostoService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: centrosCostoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: centrosCostoKeys.detail(id) });
      toast.success(response.message || "Centro de costo actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar centro de costo");
    },
  });
}

export function useDeleteCentroCosto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => centrosCostoService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: centrosCostoKeys.lists() });
      toast.success(response.message || "Centro de costo eliminado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar centro de costo");
    },
  });
}
