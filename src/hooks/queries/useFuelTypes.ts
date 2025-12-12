/**
 * Hooks de TanStack Query para FuelTypes
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fuelTypesApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useIdCompany } from "@/stores/auth.store";
import type {
  CreateFuelTypeRequest,
  UpdateFuelTypeRequest,
} from "@/types/api.types";

// Query Keys
export const fuelTypesKeys = {
  all: ["fuelTypes"] as const,
  lists: () => [...fuelTypesKeys.all, "list"] as const,
  byCompany: (idCompany: number) =>
    [...fuelTypesKeys.all, "byCompany", idCompany] as const,
  detail: (id: number) => [...fuelTypesKeys.all, "detail", id] as const,
};

/**
 * Obtener todos los tipos de combustible
 */
export function useFuelTypes(idCompany?: number) {
  const storeCompanyId = useIdCompany();
  const companyId = idCompany ?? storeCompanyId ?? 0;

  return useQuery({
    queryKey: fuelTypesKeys.byCompany(companyId),
    queryFn: () => fuelTypesApi.getByCompany(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Obtener tipo de combustible por ID
 */
export function useFuelType(id: number) {
  return useQuery({
    queryKey: fuelTypesKeys.detail(id),
    queryFn: () => fuelTypesApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Crear nuevo tipo de combustible
 */
export function useCreateFuelType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFuelTypeRequest) => fuelTypesApi.create(data),
    onSuccess: () => {
      toast.success("Tipo de combustible creado correctamente");
      queryClient.invalidateQueries({ queryKey: fuelTypesKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar tipo de combustible
 */
export function useUpdateFuelType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFuelTypeRequest) => fuelTypesApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Tipo de combustible actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: fuelTypesKeys.all });
      queryClient.invalidateQueries({
        queryKey: fuelTypesKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar tipo de combustible
 */
export function useDeactivateFuelType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => fuelTypesApi.deactivate(id),
    onSuccess: () => {
      toast.success("Tipo de combustible desactivado");
      queryClient.invalidateQueries({ queryKey: fuelTypesKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
