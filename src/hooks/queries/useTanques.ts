// src/hooks/queries/useTanques.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tanquesService } from "@/services";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadIdFilter } from "@/hooks/useUnidadFilterLogic";
import type { TanqueFormData, TanqueFilters, PaginationParams } from "@/types";
import { toast } from "sonner";

export const tanquesKeys = {
  all: ["tanques"] as const,
  lists: () => [...tanquesKeys.all, "list"] as const,
  list: (empresaId: number, params?: PaginationParams & TanqueFilters) =>
    [...tanquesKeys.lists(), empresaId, params] as const,
  details: () => [...tanquesKeys.all, "detail"] as const,
  detail: (id: number) => [...tanquesKeys.details(), id] as const,
  movimientos: (tanqueId: number) => [...tanquesKeys.all, "movimientos", tanqueId] as const,
};

/**
 * Hook para listar tanques con filtro automático por unidad
 */
export function useTanques(params?: PaginationParams & TanqueFilters) {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;
  const unidadIdFilter = useUnidadIdFilter();

  // Combinar filtros pasados con el filtro de unidad
  const fullParams = {
    ...params,
    unidadId: params?.unidadId ?? unidadIdFilter,
  };

  return useQuery({
    queryKey: tanquesKeys.list(empresaId, fullParams),
    queryFn: () => tanquesService.list(empresaId, fullParams),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTanque(id: number) {
  return useQuery({
    queryKey: tanquesKeys.detail(id),
    queryFn: () => tanquesService.getById(id),
    enabled: id > 0,
  });
}

export function useTanqueMovimientos(tanqueId: number, params?: PaginationParams) {
  return useQuery({
    queryKey: tanquesKeys.movimientos(tanqueId),
    queryFn: () => tanquesService.getMovimientos(tanqueId, params),
    enabled: tanqueId > 0,
    staleTime: 1000 * 60,
  });
}

export function useCreateTanque() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: (data: TanqueFormData) => tanquesService.create(empresaId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: tanquesKeys.lists() });
      toast.success(response.message || "Tanque creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear tanque");
    },
  });
}

export function useUpdateTanque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TanqueFormData> }) =>
      tanquesService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: tanquesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tanquesKeys.detail(id) });
      toast.success(response.message || "Tanque actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar tanque");
    },
  });
}

export function useDeleteTanque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tanquesService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: tanquesKeys.lists() });
      toast.success(response.message || "Tanque eliminado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar tanque");
    },
  });
}

export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tanqueId,
      tipo,
      litros,
      observaciones,
    }: {
      tanqueId: number;
      tipo: "ingreso" | "egreso" | "ajuste";
      litros: number;
      observaciones?: string;
    }) => tanquesService.registrarMovimiento(tanqueId, tipo, litros, observaciones),
    onSuccess: (response, { tanqueId }) => {
      queryClient.invalidateQueries({ queryKey: tanquesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tanquesKeys.detail(tanqueId) });
      queryClient.invalidateQueries({ queryKey: tanquesKeys.movimientos(tanqueId) });
      toast.success(response.message || "Movimiento registrado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al registrar movimiento");
    },
  });
}

