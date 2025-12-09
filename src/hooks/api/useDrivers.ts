/**
 * Hooks de React Query para Choferes
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { driversApi } from "@/services/api/drivers.api";
import { queryKeys, QUERY_TIMES, invalidateQueries } from "@/lib/query-client";
import type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
} from "@/types/api.types";

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los choferes
 */
export function useDrivers() {
  return useQuery({
    queryKey: queryKeys.drivers.lists(),
    queryFn: () => driversApi.getAll(),
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener choferes por empresa
 */
export function useDriversByCompany(companyId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.drivers.byCompany(companyId!),
    queryFn: () => driversApi.getByCompany(companyId!),
    enabled: !!companyId,
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener chofer por ID
 */
export function useDriver(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.drivers.detail(id!),
    queryFn: () => driversApi.getById(id!),
    enabled: !!id,
    ...QUERY_TIMES.MODERATE,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear nuevo chofer
 */
export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDriverRequest) => driversApi.create(data),
    onSuccess: (_, variables) => {
      invalidateQueries.drivers();
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers.byCompany(variables.idCompany),
      });
      toast.success("Chofer creado correctamente");
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
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers.byCompany(variables.idCompany),
      });
      toast.success("Chofer actualizado correctamente");
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
      invalidateQueries.drivers();
      toast.success("Chofer desactivado correctamente");
    },
  });
}

export default {
  useDrivers,
  useDriversByCompany,
  useDriver,
  useCreateDriver,
  useUpdateDriver,
  useDeactivateDriver,
};


