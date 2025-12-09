/**
 * Hooks de React Query para Combustible
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fuelTypesApi,
  movementTypesApi,
  fuelStockApi,
  loadLitersApi,
} from "@/services/api/fuel.api";
import { queryKeys, QUERY_TIMES, invalidateQueries } from "@/lib/query-client";
import type {
  FuelType,
  CreateFuelTypeRequest,
  UpdateFuelTypeRequest,
  MovementType,
  CreateMovementTypeRequest,
  UpdateMovementTypeRequest,
  FuelStockMovement,
  CreateFuelStockMovementRequest,
  UpdateFuelStockMovementRequest,
  LoadLiters,
  CreateLoadLitersRequest,
  UpdateLoadLitersRequest,
  CreateLoadTripRequest,
} from "@/types/api.types";

// ============================================
// FUEL TYPES - QUERIES
// ============================================

/**
 * Obtener todos los tipos de combustible
 */
export function useFuelTypes() {
  return useQuery({
    queryKey: queryKeys.fuelTypes.list(),
    queryFn: () => fuelTypesApi.getAll(),
    ...QUERY_TIMES.IMMUTABLE,
  });
}

/**
 * Obtener tipo de combustible por ID
 */
export function useFuelType(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.fuelTypes.detail(id!),
    queryFn: () => fuelTypesApi.getById(id!),
    enabled: !!id,
    ...QUERY_TIMES.IMMUTABLE,
  });
}

// ============================================
// FUEL TYPES - MUTATIONS
// ============================================

export function useCreateFuelType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFuelTypeRequest) => fuelTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fuelTypes.all });
      toast.success("Tipo de combustible creado correctamente");
    },
  });
}

export function useUpdateFuelType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFuelTypeRequest) => fuelTypesApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fuelTypes.all });
      toast.success("Tipo de combustible actualizado correctamente");
    },
  });
}

export function useDeactivateFuelType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => fuelTypesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fuelTypes.all });
      toast.success("Tipo de combustible desactivado correctamente");
    },
  });
}

// ============================================
// MOVEMENT TYPES - QUERIES
// ============================================

/**
 * Obtener todos los tipos de movimiento
 */
export function useMovementTypes() {
  return useQuery({
    queryKey: queryKeys.movementTypes.list(),
    queryFn: () => movementTypesApi.getAll(),
    ...QUERY_TIMES.IMMUTABLE,
  });
}

// ============================================
// MOVEMENT TYPES - MUTATIONS
// ============================================

export function useCreateMovementType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMovementTypeRequest) => movementTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movementTypes.all });
      toast.success("Tipo de movimiento creado correctamente");
    },
  });
}

export function useUpdateMovementType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMovementTypeRequest) => movementTypesApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movementTypes.all });
      toast.success("Tipo de movimiento actualizado correctamente");
    },
  });
}

// ============================================
// FUEL STOCK - QUERIES
// ============================================

/**
 * Obtener todos los movimientos de stock
 */
export function useFuelStockMovements() {
  return useQuery({
    queryKey: queryKeys.fuelStock.lists(),
    queryFn: () => fuelStockApi.getAll(),
    ...QUERY_TIMES.REALTIME,
  });
}

/**
 * Obtener movimiento de stock por ID
 */
export function useFuelStockMovement(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.fuelStock.detail(id!),
    queryFn: () => fuelStockApi.getById(id!),
    enabled: !!id,
    ...QUERY_TIMES.REALTIME,
  });
}

// ============================================
// FUEL STOCK - MUTATIONS
// ============================================

export function useCreateFuelStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFuelStockMovementRequest) => fuelStockApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fuelStock.all });
      toast.success("Movimiento de stock registrado correctamente");
    },
  });
}

export function useUpdateFuelStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFuelStockMovementRequest) => fuelStockApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fuelStock.all });
      toast.success("Movimiento de stock actualizado correctamente");
    },
  });
}

// ============================================
// LOAD LITERS - QUERIES
// ============================================

/**
 * Obtener todas las cargas de combustible
 */
export function useLoadLiters() {
  return useQuery({
    queryKey: queryKeys.loadLiters.lists(),
    queryFn: () => loadLitersApi.getAll(),
    ...QUERY_TIMES.REALTIME,
  });
}

/**
 * Obtener carga por ID
 */
export function useLoadLiter(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.loadLiters.detail(id!),
    queryFn: () => loadLitersApi.getById(id!),
    enabled: !!id,
    ...QUERY_TIMES.REALTIME,
  });
}

/**
 * Obtener todas las asociaciones carga-viaje
 */
export function useLoadTrips() {
  return useQuery({
    queryKey: queryKeys.loadLiters.trips(),
    queryFn: () => loadLitersApi.getAllLoadTrips(),
    ...QUERY_TIMES.REALTIME,
  });
}

/**
 * Obtener cargas por viaje
 */
export function useLoadTripsByTrip(tripId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.loadLiters.tripsByTrip(tripId!),
    queryFn: () => loadLitersApi.getLoadTripsByTrip(tripId!),
    enabled: !!tripId,
    ...QUERY_TIMES.REALTIME,
  });
}

// ============================================
// LOAD LITERS - MUTATIONS
// ============================================

export function useCreateLoadLiters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLoadLitersRequest) => loadLitersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loadLiters.all });
      toast.success("Carga de combustible registrada correctamente");
    },
  });
}

export function useUpdateLoadLiters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLoadLitersRequest }) =>
      loadLitersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loadLiters.all });
      toast.success("Carga de combustible actualizada correctamente");
    },
  });
}

export function useAssociateLoadTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLoadTripRequest) => loadLitersApi.associateTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loadLiters.trips() });
      toast.success("Carga asociada al viaje correctamente");
    },
  });
}

export default {
  // Fuel Types
  useFuelTypes,
  useFuelType,
  useCreateFuelType,
  useUpdateFuelType,
  useDeactivateFuelType,
  // Movement Types
  useMovementTypes,
  useCreateMovementType,
  useUpdateMovementType,
  // Fuel Stock
  useFuelStockMovements,
  useFuelStockMovement,
  useCreateFuelStockMovement,
  useUpdateFuelStockMovement,
  // Load Liters
  useLoadLiters,
  useLoadLiter,
  useLoadTrips,
  useLoadTripsByTrip,
  useCreateLoadLiters,
  useUpdateLoadLiters,
  useAssociateLoadTrip,
};


