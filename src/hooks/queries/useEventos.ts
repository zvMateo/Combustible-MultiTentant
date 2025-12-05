// src/hooks/queries/useEventos.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventosService } from "@/services";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadIdFilter } from "@/hooks/useUnidadFilterLogic";
import type { EventoFormData, EventoFilters, ValidarEventoData } from "@/types";
import { toast } from "sonner";

// Query Keys
export const eventosKeys = {
  all: ["eventos"] as const,
  lists: () => [...eventosKeys.all, "list"] as const,
  list: (filters?: EventoFilters) => [...eventosKeys.lists(), filters] as const,
  pendientes: (filters?: { empresaId?: number; unidadId?: number }) =>
    [...eventosKeys.all, "pendientes", filters] as const,
  details: () => [...eventosKeys.all, "detail"] as const,
  detail: (id: number) => [...eventosKeys.details(), id] as const,
  resumen: (filters?: { empresaId?: number; unidadId?: number }) =>
    [...eventosKeys.all, "resumen", filters] as const,
};

/**
 * Hook para listar eventos con filtro automático por unidad
 */
export function useEventos(filters?: EventoFilters) {
  const unidadIdFilter = useUnidadIdFilter();

  // Combinar filtros pasados con el filtro de unidad
  const fullFilters: EventoFilters = {
    ...filters,
    unidadId: filters?.unidadId ?? unidadIdFilter,
  };

  return useQuery({
    queryKey: eventosKeys.list(fullFilters),
    queryFn: () => eventosService.list(fullFilters),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para listar eventos pendientes con filtro por unidad
 */
export function useEventosPendientes() {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId;
  const unidadIdFilter = useUnidadIdFilter();

  return useQuery({
    queryKey: eventosKeys.pendientes({ empresaId, unidadId: unidadIdFilter }),
    queryFn: () => eventosService.listPendientes(empresaId, unidadIdFilter),
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 60 * 2, // Refetch cada 2 minutos
  });
}

/**
 * Hook para obtener evento por ID
 */
export function useEvento(id: number) {
  return useQuery({
    queryKey: eventosKeys.detail(id),
    queryFn: () => eventosService.getById(id),
    enabled: id > 0,
  });
}

/**
 * Hook para obtener resumen de eventos con filtro por unidad
 */
export function useEventosResumen() {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId;
  const unidadIdFilter = useUnidadIdFilter();

  return useQuery({
    queryKey: eventosKeys.resumen({ empresaId, unidadId: unidadIdFilter }),
    queryFn: () => eventosService.getResumen(empresaId, unidadIdFilter),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para crear evento
 */
export function useCreateEvento() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const empresaId = user?.empresaId ?? 0;

  return useMutation({
    mutationFn: (data: EventoFormData) => eventosService.create(data, empresaId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: eventosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventosKeys.pendientes() });
      queryClient.invalidateQueries({ queryKey: eventosKeys.resumen() });
      toast.success(response.message || "Evento creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear evento");
    },
  });
}

/**
 * Hook para actualizar evento
 */
export function useUpdateEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EventoFormData> }) =>
      eventosService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: eventosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventosKeys.resumen() });
      toast.success(response.message || "Evento actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar evento");
    },
  });
}

/**
 * Hook para eliminar evento
 */
export function useDeleteEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eventosService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: eventosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventosKeys.pendientes() });
      queryClient.invalidateQueries({ queryKey: eventosKeys.resumen() });
      toast.success(response.message || "Evento eliminado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar evento");
    },
  });
}

/**
 * Hook para validar/rechazar evento
 */
export function useValidarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ValidarEventoData) => eventosService.validar(data),
    onSuccess: (response, { accion }) => {
      queryClient.invalidateQueries({ queryKey: eventosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventosKeys.pendientes() });
      queryClient.invalidateQueries({ queryKey: eventosKeys.resumen() });
      toast.success(
        accion === "validar" ? "Evento validado exitosamente" : "Evento rechazado"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al procesar evento");
    },
  });
}

