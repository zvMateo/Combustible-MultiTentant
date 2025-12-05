// src/hooks/queries/useEmpresas.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { empresasService } from "@/services";
import type { EmpresaFormData, PaginationParams } from "@/types";
import { toast } from "sonner";

// Query Keys
export const empresasKeys = {
  all: ["empresas"] as const,
  lists: () => [...empresasKeys.all, "list"] as const,
  list: (params?: PaginationParams & { search?: string; activo?: boolean }) =>
    [...empresasKeys.lists(), params] as const,
  details: () => [...empresasKeys.all, "detail"] as const,
  detail: (id: number) => [...empresasKeys.details(), id] as const,
  stats: (id: number) => [...empresasKeys.all, "stats", id] as const,
  resumen: () => [...empresasKeys.all, "resumen"] as const,
};

/**
 * Hook para listar empresas
 */
export function useEmpresas(params?: PaginationParams & { search?: string; activo?: boolean }) {
  return useQuery({
    queryKey: empresasKeys.list(params),
    queryFn: () => empresasService.list(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener empresa por ID
 */
export function useEmpresa(id: number) {
  return useQuery({
    queryKey: empresasKeys.detail(id),
    queryFn: () => empresasService.getById(id),
    enabled: id > 0,
  });
}

/**
 * Hook para obtener estadísticas de empresa
 */
export function useEmpresaStats(id: number) {
  return useQuery({
    queryKey: empresasKeys.stats(id),
    queryFn: () => empresasService.getStats(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener resumen de empresas
 */
export function useEmpresasResumen() {
  return useQuery({
    queryKey: empresasKeys.resumen(),
    queryFn: () => empresasService.getResumen(),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para crear empresa
 */
export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmpresaFormData) => empresasService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: empresasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: empresasKeys.resumen() });
      toast.success(response.message || "Empresa creada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear empresa");
    },
  });
}

/**
 * Hook para actualizar empresa
 */
export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmpresaFormData> }) =>
      empresasService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: empresasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: empresasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: empresasKeys.resumen() });
      toast.success(response.message || "Empresa actualizada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar empresa");
    },
  });
}

/**
 * Hook para eliminar empresa
 */
export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => empresasService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: empresasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: empresasKeys.resumen() });
      toast.success(response.message || "Empresa eliminada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar empresa");
    },
  });
}

/**
 * Hook para activar/desactivar empresa
 */
export function useToggleEmpresaActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      empresasService.toggleActive(id, activo),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: empresasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: empresasKeys.detail(id) });
      toast.success(response.data.activo ? "Empresa activada" : "Empresa desactivada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al cambiar estado");
    },
  });
}

/**
 * Hook para verificar subdomain disponible
 */
export function useCheckSubdomain(subdomain: string, enabled = true) {
  return useQuery({
    queryKey: ["empresas", "check-subdomain", subdomain],
    queryFn: () => empresasService.checkSubdomain(subdomain),
    enabled: enabled && subdomain.length >= 3,
    staleTime: 1000 * 30, // 30 segundos
  });
}

