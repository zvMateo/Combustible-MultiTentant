/**
 * Hooks de TanStack Query para Drivers
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { driversApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
} from "@/types/api.types";

// Query Keys
export const driversKeys = {
  all: ["drivers"] as const,
  lists: () => [...driversKeys.all, "list"] as const,
  list: (idCompany?: number) => [...driversKeys.lists(), idCompany] as const,
  detail: (id: number) => [...driversKeys.all, "detail", id] as const,
  byCompany: (idCompany: number) =>
    [...driversKeys.all, "byCompany", idCompany] as const,
};

/**
 * Obtener todos los choferes
 */
export function useDrivers(idCompany?: number) {
  return useQuery({
    queryKey: driversKeys.list(idCompany),
    queryFn: () =>
      idCompany && idCompany > 0
        ? driversApi.getByCompany(idCompany)
        : driversApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Obtener chofer por ID
 */
export function useDriver(id: number) {
  return useQuery({
    queryKey: driversKeys.detail(id),
    queryFn: () => driversApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener choferes por empresa
 */
export function useDriversByCompany(idCompany: number) {
  return useQuery({
    queryKey: driversKeys.byCompany(idCompany),
    queryFn: () => driversApi.getByCompany(idCompany),
    enabled: !!idCompany,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Crear nuevo chofer
 */
export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDriverRequest) => driversApi.create(data),
    onSuccess: () => {
      toast.success("Chofer creado correctamente");
      queryClient.invalidateQueries({ queryKey: driversKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar chofer
 */
export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDriverRequest) => driversApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Chofer actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: driversKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: driversKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar chofer
 */
export function useDeactivateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => driversApi.deactivate(id),
    onSuccess: () => {
      toast.success("Chofer desactivado");
      queryClient.invalidateQueries({ queryKey: driversKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
