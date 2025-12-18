/**
 * Hooks de TanStack Query para Business Units
 * Con Optimistic Updates para mejor UX
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessUnitsApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useIdCompany } from "@/stores/auth.store";
import {
  optimisticCreate,
  optimisticUpdate,
  optimisticDelete,
  rollbackOptimistic,
  type OptimisticContext,
} from "@/lib/query-helpers";
import type {
  BusinessUnit,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
} from "@/types/api.types";

// Query Keys
export const businessUnitsKeys = {
  all: ["businessUnits"] as const,
  lists: () => [...businessUnitsKeys.all, "list"] as const,
  list: (idCompany?: number) =>
    [...businessUnitsKeys.lists(), idCompany] as const,
  detail: (id: number) => [...businessUnitsKeys.all, "detail", id] as const,
  byCompany: (idCompany: number) =>
    [...businessUnitsKeys.all, "byCompany", idCompany] as const,
};

/**
 * Obtener todas las unidades de negocio
 */
export function useBusinessUnits(idCompany?: number) {
  const storeCompanyId = useIdCompany();
  const companyId = idCompany ?? storeCompanyId ?? 0;

  return useQuery({
    queryKey: businessUnitsKeys.byCompany(companyId),
    queryFn: () => businessUnitsApi.getByCompany(companyId),
    enabled: !!companyId,
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
 * Crear nueva unidad de negocio (con Optimistic Update)
 */
export function useCreateBusinessUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBusinessUnitRequest) =>
      businessUnitsApi.create(data),
    onMutate: async (newUnit) => {
      const queryKey = businessUnitsKeys.byCompany(newUnit.idCompany);
      return optimisticCreate<BusinessUnit>(queryClient, queryKey, newUnit);
    },
    onError: (error, _, context) => {
      if (context) {
        rollbackOptimistic(
          queryClient,
          context as OptimisticContext<BusinessUnit>
        );
      }
      toast.error(getErrorMessage(error));
    },
    onSuccess: (_, variables) => {
      toast.success("Unidad de negocio creada correctamente");
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.all });
      if (variables.idCompany) {
        queryClient.invalidateQueries({
          queryKey: businessUnitsKeys.byCompany(variables.idCompany),
        });
      }
    },
  });
}

/**
 * Actualizar unidad de negocio (con Optimistic Update)
 */
export function useUpdateBusinessUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBusinessUnitRequest) =>
      businessUnitsApi.update(data),
    onMutate: async (updatedUnit) => {
      const queryKey = businessUnitsKeys.byCompany(updatedUnit.idCompany);
      return optimisticUpdate<BusinessUnit>(
        queryClient,
        queryKey,
        updatedUnit as BusinessUnit
      );
    },
    onError: (error, _, context) => {
      if (context) {
        rollbackOptimistic(
          queryClient,
          context as OptimisticContext<BusinessUnit>
        );
      }
      toast.error(getErrorMessage(error));
    },
    onSuccess: (_, variables) => {
      toast.success("Unidad de negocio actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.all });
      queryClient.invalidateQueries({
        queryKey: businessUnitsKeys.detail(variables.id),
      });
      if (variables.idCompany) {
        queryClient.invalidateQueries({
          queryKey: businessUnitsKeys.byCompany(variables.idCompany),
        });
      }
    },
  });
}

/**
 * Desactivar unidad de negocio (con Optimistic Update)
 */
export function useDeactivateBusinessUnit() {
  const queryClient = useQueryClient();
  const companyId = useIdCompany();

  return useMutation({
    mutationFn: (id: number) => businessUnitsApi.deactivate(id),
    onMutate: async (id) => {
      if (!companyId) return;
      const queryKey = businessUnitsKeys.byCompany(companyId);
      return optimisticDelete<BusinessUnit>(queryClient, queryKey, id);
    },
    onError: (error, _, context) => {
      if (context) {
        rollbackOptimistic(
          queryClient,
          context as OptimisticContext<BusinessUnit>
        );
      }
      toast.error(getErrorMessage(error));
    },
    onSuccess: () => {
      toast.success("Unidad de negocio desactivada");
      queryClient.invalidateQueries({ queryKey: businessUnitsKeys.all });
    },
  });
}
