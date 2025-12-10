/**
 * Hooks de TanStack Query para Trips
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type { Trip, CreateTripRequest, UpdateTripRequest } from "@/types/api.types";

// Query Keys
export const tripsKeys = {
  all: ["trips"] as const,
  lists: () => [...tripsKeys.all, "list"] as const,
  detail: (id: number) => [...tripsKeys.all, "detail", id] as const,
  byDriver: (idDriver: number) => [...tripsKeys.all, "byDriver", idDriver] as const,
};

/**
 * Obtener todos los viajes
 */
export function useTrips() {
  return useQuery({
    queryKey: tripsKeys.lists(),
    queryFn: () => tripsApi.getAll(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Obtener viaje por ID
 */
export function useTrip(id: number) {
  return useQuery({
    queryKey: tripsKeys.detail(id),
    queryFn: () => tripsApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Obtener viajes por chofer
 */
export function useTripsByDriver(idDriver: number) {
  return useQuery({
    queryKey: tripsKeys.byDriver(idDriver),
    queryFn: () => tripsApi.getByDriver(idDriver),
    enabled: !!idDriver,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Crear nuevo viaje
 */
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTripRequest) => tripsApi.create(data),
    onSuccess: (newTrip) => {
      toast.success("Viaje creado correctamente");
      queryClient.invalidateQueries({ queryKey: tripsKeys.lists() });
      
      // Invalidar también los viajes del conductor si existe
      if (newTrip.idDriver) {
        queryClient.invalidateQueries({ 
          queryKey: tripsKeys.byDriver(newTrip.idDriver) 
        });
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
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
      toast.success("Viaje actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: tripsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripsKeys.detail(variables.id) });
      
      // Invalidar los viajes del conductor si cambió
      if (variables.idDriver) {
        queryClient.invalidateQueries({ 
          queryKey: tripsKeys.byDriver(variables.idDriver) 
        });
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
