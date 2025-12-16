/**
 * Hooks de TanStack Query para MovementTypes
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { movementTypesApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useIdBusinessUnit, useIdCompany } from "@/stores/auth.store";
import { useUnidadActivaId } from "@/stores/unidad.store";
import type {
  CreateMovementTypeRequest,
  UpdateMovementTypeRequest,
} from "@/types/api.types";

// Query Keys
export const movementTypesKeys = {
  all: ["movementTypes"] as const,
  lists: () => [...movementTypesKeys.all, "list"] as const,
  byCompany: (idCompany: number) =>
    [...movementTypesKeys.all, "byCompany", idCompany] as const,
  detail: (id: number) => [...movementTypesKeys.all, "detail", id] as const,
};

/**
 * Obtener todos los tipos de movimiento (ACTIVOS E INACTIVOS)
 */
export function useMovementTypes() {
  const storeCompanyId = useIdCompany();
  const companyId = storeCompanyId ?? 0;

  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = useIdBusinessUnit();
  const businessUnitId = activeBusinessUnitId ?? userBusinessUnitId ?? null;
  const useBusinessUnitScope = !!businessUnitId && businessUnitId > 0;

  return useQuery({
    queryKey: [...movementTypesKeys.byCompany(companyId), { businessUnitId }] as const,
    queryFn: async () => {
      const data = await movementTypesApi.getByCompany(companyId);
      const list = Array.isArray(data) ? data : [];

      if (!useBusinessUnitScope) return list;

      return list.filter((t) => {
        const bu = t.idBusinessUnit ?? null;
        return bu === null || bu === 0 || bu === businessUnitId;
      });
    },
    enabled: !!companyId,
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
    mutationFn: (data: CreateMovementTypeRequest) =>
      movementTypesApi.create(data),
    onSuccess: () => {
      toast.success("Tipo de movimiento creado correctamente");
      queryClient.invalidateQueries({ queryKey: movementTypesKeys.all });
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
    mutationFn: (data: UpdateMovementTypeRequest) =>
      movementTypesApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Tipo de movimiento actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: movementTypesKeys.all });
      queryClient.invalidateQueries({
        queryKey: movementTypesKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar/Activar tipo de movimiento (TOGGLE)
 */
export function useDeactivateMovementType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => movementTypesApi.deactivate(id),
    onSuccess: () => {
      toast.success("Estado actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: movementTypesKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
