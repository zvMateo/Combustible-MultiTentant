/**
 * Hooks de React Query para Viajes
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tripsApi } from "@/services/api/trips.api";
import { queryKeys, QUERY_TIMES, invalidateQueries } from "@/lib/query-client";
import type {
  Trip,
  CreateTripRequest,
  UpdateTripRequest,
} from "@/types/api.types";

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los viajes
 */
export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.lists(),
    queryFn: () => tripsApi.getAll(),
    ...QUERY_TIMES.REALTIME,
  });
}

/**
 * Obtener viaje por ID
 */
export function useTrip(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.trips.detail(id!),
    queryFn: () => tripsApi.getById(id!),
    enabled: !!id,
    ...QUERY_TIMES.REALTIME,
  });
}

/**
 * Obtener viajes por chofer
 */
export function useTripsByDriver(driverId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.trips.byDriver(driverId!),
    queryFn: () => tripsApi.getByDriver(driverId!),
    enabled: !!driverId,
    ...QUERY_TIMES.REALTIME,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear nuevo viaje
 */
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTripRequest) => tripsApi.create(data),
    onSuccess: (_, variables) => {
      invalidateQueries.trips();
      // También invalidar los viajes del chofer
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.byDriver(variables.idDriver),
      });
      toast.success("Viaje registrado correctamente");
    },
  });
}

/**
 * Actualizar viaje
 */
export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTripRequest) => tripsApi.update(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.byDriver(variables.idDriver),
      });
      toast.success("Viaje actualizado correctamente");
    },
  });
}

export default {
  useTrips,
  useTrip,
  useTripsByDriver,
  useCreateTrip,
  useUpdateTrip,
};
