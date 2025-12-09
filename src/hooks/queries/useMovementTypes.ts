/**
 * Hooks de TanStack Query para MovementTypes
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { movementTypesApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type {
  MovementType,
  CreateMovementTypeRequest,
  UpdateMovementTypeRequest,
} from "@/types/api.types";

// Query Keys
export const movementTypesKeys = {
  all: ["movementTypes"] as const,
  lists: () => [...movementTypesKeys.all, "list"] as const,
  detail: (id: number) => [...movementTypesKeys.all, "detail", id] as const,
};

/**
 * Obtener todos los tipos de movimiento
 */
export function useMovementTypes() {
  return useQuery({
    queryKey: movementTypesKeys.lists(),
    queryFn: () => movementTypesApi.getAll(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Obtener tipo de movimiento por ID
 */
export function useMovementType(id: number) {
  return useQuery({
    queryKey: movementTypesKeys.detail(id),
    queryFn: () => movementTypesApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Crear nuevo tipo de movimiento
 */
export function useCreateMovementType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMovementTypeRequest) => movementTypesApi.create(data),
    onSuccess: () => {
      toast.success("Tipo de movimiento creado correctamente");
      queryClient.invalidateQueries({ queryKey: movementTypesKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar tipo de movimiento
 */
export function useUpdateMovementType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMovementTypeRequest) => movementTypesApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Tipo de movimiento actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: movementTypesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: movementTypesKeys.detail(variables.id) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar tipo de movimiento
 */
export function useDeactivateMovementType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => movementTypesApi.deactivate(id),
    onSuccess: () => {
      toast.success("Tipo de movimiento desactivado");
      queryClient.invalidateQueries({ queryKey: movementTypesKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

