/**
 * Hooks de TanStack Query para Business Units
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessUnitsApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type {
  BusinessUnit,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
} from "@/types/api.types";

// Query Keys
export const businessUnitsKeys = {
  all: ["businessUnits"] as const,
  lists: () => [...businessUnitsKeys.all, "list"] as const,
  list: (idCompany?: number) => [...businessUnitsKeys.lists(), idCompany] as const,
  detail: (id: number) => [...businessUnitsKeys.all, "detail", id] as const,
  byCompany: (idCompany: number) => [...businessUnitsKeys.all, "byCompany", idCompany] as const,
};

/**
 * Obtener todas las unidades de negocio
 */
export function useBusinessUnits() {
  return useQuery({
    queryKey: businessUnitsKeys.lists(),
    queryFn: () => businessUnitsApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Obtener unidad de negocio por ID
 */
export function useBusinessUnit(id: number) {
  return useQuery({
    queryKey: businessUnitsKeys.detail(id),
    queryFn: () => businessUnitsApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener unidades de negocio por empresa
 */
export function useBusinessUnitsByCompany(idCompany: number) {
  return useQuery({
    queryKey: businessUnitsKeys.byCompany(idCompany),
    queryFn: () => businessUnitsApi.getByCompany(idCompany),
    enabled: !!idCompany,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Crear nueva unidad de negocio
 */
export function useCreateBusinessUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBusinessUnitRequest) => businessUnitsApi.create(data),
    onSuccess: (_, variables) => {
      toast.success("Unidad de negocio creada correctamente");
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.all });
      // Invalidar también la query por empresa si existe
      if (variables.idCompany) {
        queryClient.invalidateQueries({ queryKey: businessUnitsKeys.byCompany(variables.idCompany) });
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar unidad de negocio
 */
export function useUpdateBusinessUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBusinessUnitRequest) => businessUnitsApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Unidad de negocio actualizada correctamente");
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.all });
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.detail(variables.id) });
      // Invalidar también la query por empresa si existe
      if (variables.idCompany) {
        queryClient.invalidateQueries({ queryKey: businessUnitsKeys.byCompany(variables.idCompany) });
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar unidad de negocio
 */
export function useDeactivateBusinessUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => businessUnitsApi.deactivate(id),
    onSuccess: () => {
      toast.success("Unidad de negocio desactivada");
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

