/**
 * Hooks de TanStack Query para LoadLiters (Cargas de Combustible)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadLitersApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore, useIdBusinessUnit, useIdCompany } from "@/stores/auth.store";
import { useUnidadActivaId } from "@/stores/unidad.store";
import type {
  CreateLoadLitersRequest,
  UpdateLoadLitersRequest,
  CreateLoadTripRequest,
} from "@/types/api.types";

// Query Keys
export const loadLitersKeys = {
  all: ["loadLiters"] as const,
  lists: () => [...loadLitersKeys.all, "list"] as const,
  byCompany: (idCompany: number) =>
    [...loadLitersKeys.all, "byCompany", idCompany] as const,
  byBusinessUnit: (idBusinessUnit: number) =>
    [...loadLitersKeys.all, "byBusinessUnit", idBusinessUnit] as const,
  detail: (id: number) => [...loadLitersKeys.all, "detail", id] as const,
  loadTrips: () => [...loadLitersKeys.all, "loadTrips"] as const,
  loadTripDetail: (id: number) =>
    [...loadLitersKeys.all, "loadTrip", id] as const,
  byTrip: (idTrip: number) =>
    [...loadLitersKeys.all, "byTrip", idTrip] as const,
};

/**
 * Obtener todas las cargas de combustible
 */
export function useLoadLiters(idCompany?: number) {
  const storeCompanyId = useIdCompany();
  const companyId = idCompany ?? storeCompanyId ?? 0;

  return useQuery({
    queryKey: loadLitersKeys.byCompany(companyId),
    queryFn: () => loadLitersApi.getByCompany(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Obtener cargas de combustible respetando el scope:
 * - Si hay unidad (seleccionada/asignada) => GetByIdBusinessUnit
 * - Si no => GetByIdCompany
 */
export function useLoadLitersScoped() {
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

  // Regla:
  // - Si hay unidad activa => usar esa
  // - Si admin asignado => forzar su unidad
  // - Si NO es admin/superadmin => usar su unidad asignada
  // - Si es admin/superadmin y está en "Todas" => NO filtrar por unidad
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
      ? loadLitersKeys.byBusinessUnit(businessUnitId as number)
      : loadLitersKeys.byCompany(companyId),
    queryFn: () =>
      useBusinessUnitScope
        ? loadLitersApi.getByBusinessUnit(businessUnitId as number)
        : loadLitersApi.getByCompany(companyId),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Obtener carga de combustible por ID
 */
export function useLoadLitersById(id: number) {
  return useQuery({
    queryKey: loadLitersKeys.detail(id),
    queryFn: () => loadLitersApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Obtener todas las asociaciones carga-viaje
 */
export function useLoadTrips() {
  return useQuery({
    queryKey: loadLitersKeys.loadTrips(),
    queryFn: () => loadLitersApi.getAllLoadTrips(),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Obtener asociación carga-viaje por ID
 */
export function useLoadTripById(id: number) {
  return useQuery({
    queryKey: loadLitersKeys.loadTripDetail(id),
    queryFn: () => loadLitersApi.getByIdLoadTrips(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Obtener asociaciones carga-viaje por ID de viaje
 */
export function useLoadTripsByTrip(idTrip: number) {
  return useQuery({
    queryKey: loadLitersKeys.byTrip(idTrip),
    queryFn: () => loadLitersApi.getByIdTrip(idTrip),
    enabled: !!idTrip,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Crear nueva carga de combustible
 */
export function useCreateLoadLiters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLoadLitersRequest) => loadLitersApi.create(data),
    onSuccess: () => {
      toast.success("Carga de combustible registrada correctamente");
      queryClient.invalidateQueries({ queryKey: loadLitersKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar carga de combustible
 */
export function useUpdateLoadLiters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLoadLitersRequest }) =>
      loadLitersApi.update(id, data),
    onSuccess: (_, variables) => {
      toast.success("Carga de combustible actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: loadLitersKeys.all });
      queryClient.invalidateQueries({
        queryKey: loadLitersKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Asociar carga con viaje
 */
export function useAssociateLoadTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLoadTripRequest) =>
      loadLitersApi.associateLoadTrip(data),
    onSuccess: () => {
      toast.success("Carga asociada con viaje correctamente");
      queryClient.invalidateQueries({ queryKey: loadLitersKeys.loadTrips() });
      queryClient.invalidateQueries({ queryKey: loadLitersKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
