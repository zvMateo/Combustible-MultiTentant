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
import { useAuthStore, useIdCompany, useIdBusinessUnit } from "@/stores/auth.store";
import { useUnidadActivaId } from "@/stores/unidad.store";

// Query Keys
export const fuelStockMovementKeys = {
  all: ["fuelStockMovement"] as const,
  lists: () => [...fuelStockMovementKeys.all, "list"] as const,
  byCompany: (id: number) => [...fuelStockMovementKeys.all, "company", id] as const,
  byBusinessUnit: (id: number) => [...fuelStockMovementKeys.all, "businessUnit", id] as const,
  detail: (id: number) => [...fuelStockMovementKeys.all, "detail", id] as const,
};

/**
 * Obtener movimientos de stock con scoping por Company o BusinessUnit
 */
export function useFuelStockMovements() {
  const storeCompanyId = useIdCompany();
  const companyId = storeCompanyId ?? 0;

  const user = useAuthStore((s) => s.user);
  const hasUser = !!user;
  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = useIdBusinessUnit();
  const fallbackAssignedId = user?.unidadesAsignadas?.[0] ?? null;

  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isCompanyAdmin = isAdmin || isSuperAdmin;
  const isAdminAssigned =
    isAdmin && (!!userBusinessUnitId || !!fallbackAssignedId);

  const businessUnitId =
    activeBusinessUnitId ??
    (isAdminAssigned ? (userBusinessUnitId ?? fallbackAssignedId) : null) ??
    (!isCompanyAdmin ? (userBusinessUnitId ?? fallbackAssignedId) : null);

  const useBusinessUnitScope = !!businessUnitId;
  const shouldHaveBusinessUnit = !isCompanyAdmin || isAdminAssigned;
  const enabled =
    hasUser &&
    (useBusinessUnitScope ? true : shouldHaveBusinessUnit ? false : !!companyId);

  return useQuery({
    queryKey: useBusinessUnitScope
      ? fuelStockMovementKeys.byBusinessUnit(businessUnitId as number)
      : fuelStockMovementKeys.byCompany(companyId),
    queryFn: () =>
      useBusinessUnitScope
        ? fuelStockMovementApi.getByBusinessUnit(businessUnitId as number)
        : fuelStockMovementApi.getByCompany(companyId),
    enabled,
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
