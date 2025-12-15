/**
 * Hooks de TanStack Query para FuelStockMovement
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fuelStockMovementApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type {
  CreateFuelStockMovementRequest,
  UpdateFuelStockMovementRequest,
} from "@/types/api.types";

// Query Keys
export const fuelStockMovementKeys = {
  all: ["fuelStockMovement"] as const,
  lists: () => [...fuelStockMovementKeys.all, "list"] as const,
  detail: (id: number) => [...fuelStockMovementKeys.all, "detail", id] as const,
};

/**
 * Obtener todos los movimientos de stock
 */
export function useFuelStockMovements() {
  return useQuery({
    queryKey: fuelStockMovementKeys.lists(),
    queryFn: () => fuelStockMovementApi.getAll(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Obtener movimiento de stock por ID
 */
export function useFuelStockMovement(id: number) {
  return useQuery({
    queryKey: fuelStockMovementKeys.detail(id),
    queryFn: () => fuelStockMovementApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Crear nuevo movimiento de stock
 */
export function useCreateFuelStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFuelStockMovementRequest) =>
      fuelStockMovementApi.create(data),
    onSuccess: () => {
      toast.success("Movimiento de stock registrado correctamente");
      queryClient.invalidateQueries({
        queryKey: fuelStockMovementKeys.lists(),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar movimiento de stock
 */
export function useUpdateFuelStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFuelStockMovementRequest) =>
      fuelStockMovementApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Movimiento de stock actualizado correctamente");
      queryClient.invalidateQueries({
        queryKey: fuelStockMovementKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: fuelStockMovementKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
