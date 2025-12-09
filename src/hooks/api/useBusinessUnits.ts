/**
 * Hooks de React Query para Unidades de Negocio
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { businessUnitsApi } from "@/services/api/business-units.api";
import { queryKeys, QUERY_TIMES, invalidateQueries } from "@/lib/query-client";
import type {
  BusinessUnit,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
} from "@/types/api.types";

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todas las unidades de negocio
 */
export function useBusinessUnits() {
  return useQuery({
    queryKey: queryKeys.businessUnits.lists(),
    queryFn: () => businessUnitsApi.getAll(),
    ...QUERY_TIMES.STATIC,
  });
}

/**
 * Obtener unidades de negocio por empresa
 */
export function useBusinessUnitsByCompany(companyId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.businessUnits.byCompany(companyId!),
    queryFn: () => businessUnitsApi.getByCompany(companyId!),
    enabled: !!companyId,
    ...QUERY_TIMES.STATIC,
  });
}

/**
 * Obtener unidad de negocio por ID
 */
export function useBusinessUnit(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.businessUnits.detail(id!),
    queryFn: () => businessUnitsApi.getById(id!),
    enabled: !!id,
    ...QUERY_TIMES.STATIC,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear nueva unidad de negocio
 */
export function useCreateBusinessUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBusinessUnitRequest) => businessUnitsApi.create(data),
    onSuccess: (_, variables) => {
      invalidateQueries.businessUnits();
      // También invalidar las de la empresa específica
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessUnits.byCompany(variables.idCompany),
      });
      toast.success("Unidad de negocio creada correctamente");
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
      queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.businessUnits.byCompany(variables.idCompany),
      });
      toast.success("Unidad de negocio actualizada correctamente");
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
      invalidateQueries.businessUnits();
      toast.success("Unidad de negocio desactivada correctamente");
    },
  });
}

export default {
  useBusinessUnits,
  useBusinessUnitsByCompany,
  useBusinessUnit,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeactivateBusinessUnit,
};


