// src/hooks/queries/useUnidades.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unidadesService } from "@/services";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadStore } from "@/stores/unidad.store";
import { toast } from "sonner";
import type {
  UnidadNegocio,
  UnidadNegocioFormData,
  UnidadNegocioFilters,
  PaginationParams,
} from "@/types";

// ============================================
// Query Keys
// ============================================

export const unidadesKeys = {
  all: ["unidades"] as const,
  lists: () => [...unidadesKeys.all, "list"] as const,
  list: (empresaId: number, filters?: UnidadNegocioFilters & PaginationParams) =>
    [...unidadesKeys.lists(), empresaId, filters] as const,
  resumen: (empresaId: number) => [...unidadesKeys.all, "resumen", empresaId] as const,
  byUsuario: (empresaId: number, unidadIds: number[]) =>
    [...unidadesKeys.all, "by-usuario", empresaId, unidadIds] as const,
  detail: (id: number) => [...unidadesKeys.all, "detail", id] as const,
  stats: (id: number) => [...unidadesKeys.all, "stats", id] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Hook para listar unidades de negocio con filtros y paginación
 */
export function useUnidades(filters?: UnidadNegocioFilters & PaginationParams) {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useQuery({
    queryKey: unidadesKeys.list(empresaId, filters),
    queryFn: () => unidadesService.list(empresaId, filters),
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener el resumen de unidades (para selectores)
 */
export function useUnidadesResumen() {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useQuery({
    queryKey: unidadesKeys.resumen(empresaId),
    queryFn: () => unidadesService.getResumen(empresaId),
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para obtener las unidades del usuario actual
 * - Admin: todas las unidades
 * - Supervisor/Auditor: solo las asignadas
 */
export function useUnidadesUsuario() {
  const { user } = useAuthStore();
  const setUnidades = useUnidadStore((state) => state.setUnidades);
  const empresaId = user?.empresaId ?? 0;
  const unidadIds = user?.unidadesAsignadas ?? [];

  return useQuery({
    queryKey: unidadesKeys.byUsuario(empresaId, unidadIds),
    queryFn: async () => {
      const unidades = await unidadesService.getByUsuario(empresaId, unidadIds);
      // Actualizar el store con las unidades disponibles
      setUnidades(unidades);
      return unidades;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para obtener una unidad por ID
 */
export function useUnidad(id: number) {
  return useQuery({
    queryKey: unidadesKeys.detail(id),
    queryFn: () => unidadesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener estadísticas de una unidad
 */
export function useUnidadStats(id: number) {
  return useQuery({
    queryKey: unidadesKeys.stats(id),
    queryFn: () => unidadesService.getStats(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Hook para crear una nueva unidad de negocio
 */
export function useCreateUnidad() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: (data: UnidadNegocioFormData) =>
      unidadesService.create(empresaId, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Unidad de negocio creada correctamente");
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: unidadesKeys.lists() });
        queryClient.invalidateQueries({ queryKey: unidadesKeys.resumen(empresaId) });
      } else {
        toast.error(response.error ?? "Error al crear la unidad");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear la unidad");
    },
  });
}

/**
 * Hook para actualizar una unidad de negocio
 */
export function useUpdateUnidad() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UnidadNegocioFormData> }) =>
      unidadesService.update(id, data),
    onSuccess: (response, { id }) => {
      if (response.success) {
        toast.success("Unidad de negocio actualizada correctamente");
        queryClient.invalidateQueries({ queryKey: unidadesKeys.lists() });
        queryClient.invalidateQueries({ queryKey: unidadesKeys.resumen(empresaId) });
        queryClient.invalidateQueries({ queryKey: unidadesKeys.detail(id) });
      } else {
        toast.error(response.error ?? "Error al actualizar la unidad");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    },
  });
}

/**
 * Hook para eliminar una unidad de negocio
 */
export function useDeleteUnidad() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: (id: number) => unidadesService.delete(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Unidad de negocio eliminada");
        queryClient.invalidateQueries({ queryKey: unidadesKeys.lists() });
        queryClient.invalidateQueries({ queryKey: unidadesKeys.resumen(empresaId) });
      } else {
        toast.error(response.error ?? "Error al eliminar la unidad");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    },
  });
}

/**
 * Hook para cambiar el estado de una unidad
 */
export function useToggleUnidadStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: (id: number) => unidadesService.toggleStatus(id),
    onSuccess: (response, id) => {
      if (response.success) {
        const newStatus = response.data?.status;
        toast.success(`Unidad ${newStatus === "activa" ? "activada" : "desactivada"}`);
        queryClient.invalidateQueries({ queryKey: unidadesKeys.lists() });
        queryClient.invalidateQueries({ queryKey: unidadesKeys.resumen(empresaId) });
        queryClient.invalidateQueries({ queryKey: unidadesKeys.detail(id) });
      } else {
        toast.error(response.error ?? "Error al cambiar estado");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    },
  });
}

