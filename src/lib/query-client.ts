/**
 * Configuración de TanStack Query (React Query)
 * 
 * Configuración óptima con:
 * - Stale time / Cache time
 * - Retry logic
 * - Error handling global
 * - Invalidación automática
 */
import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "./axios";

// ============================================
// CONFIGURACIÓN DE TIEMPOS (en ms)
// ============================================
export const QUERY_TIMES = {
  // Datos que cambian frecuentemente (eventos, cargas)
  REALTIME: {
    staleTime: 1000 * 30,      // 30 segundos
    gcTime: 1000 * 60 * 5,     // 5 minutos
  },
  // Datos que cambian moderadamente (vehículos, choferes)
  MODERATE: {
    staleTime: 1000 * 60 * 2,  // 2 minutos
    gcTime: 1000 * 60 * 10,    // 10 minutos
  },
  // Datos que cambian poco (empresas, unidades, configuración)
  STATIC: {
    staleTime: 1000 * 60 * 5,  // 5 minutos
    gcTime: 1000 * 60 * 30,    // 30 minutos
  },
  // Datos casi nunca cambian (tipos de combustible, roles)
  IMMUTABLE: {
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60,    // 1 hora
  },
} as const;

// ============================================
// QUERY KEYS
// ============================================
export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
  },
  
  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    roles: (id: string) => [...queryKeys.users.all, "roles", id] as const,
  },
  
  // Roles
  roles: {
    all: ["roles"] as const,
    list: () => [...queryKeys.roles.all, "list"] as const,
  },
  
  // Companies
  companies: {
    all: ["companies"] as const,
    lists: () => [...queryKeys.companies.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.companies.details(), id] as const,
  },
  
  // Business Units
  businessUnits: {
    all: ["businessUnits"] as const,
    lists: () => [...queryKeys.businessUnits.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.businessUnits.lists(), filters] as const,
    byCompany: (companyId: number) => [...queryKeys.businessUnits.all, "byCompany", companyId] as const,
    details: () => [...queryKeys.businessUnits.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.businessUnits.details(), id] as const,
  },
  
  // Drivers
  drivers: {
    all: ["drivers"] as const,
    lists: () => [...queryKeys.drivers.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.drivers.lists(), filters] as const,
    byCompany: (companyId: number) => [...queryKeys.drivers.all, "byCompany", companyId] as const,
    details: () => [...queryKeys.drivers.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.drivers.details(), id] as const,
  },
  
  // Resources (Vehicles, Tanks, Dispensers)
  resources: {
    all: ["resources"] as const,
    lists: () => [...queryKeys.resources.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.resources.lists(), filters] as const,
    byType: (typeId: number) => [...queryKeys.resources.all, "byType", typeId] as const,
    byCompany: (companyId: number) => [...queryKeys.resources.all, "byCompany", companyId] as const,
    byBusinessUnit: (unitId: number) => [...queryKeys.resources.all, "byBusinessUnit", unitId] as const,
    details: () => [...queryKeys.resources.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.resources.details(), id] as const,
    // Shortcuts
    vehicles: () => [...queryKeys.resources.all, "vehicles"] as const,
    tanks: () => [...queryKeys.resources.all, "tanks"] as const,
    dispensers: () => [...queryKeys.resources.all, "dispensers"] as const,
  },
  
  // Resource Types
  resourceTypes: {
    all: ["resourceTypes"] as const,
    list: () => [...queryKeys.resourceTypes.all, "list"] as const,
    detail: (id: number) => [...queryKeys.resourceTypes.all, "detail", id] as const,
  },
  
  // Fuel Types
  fuelTypes: {
    all: ["fuelTypes"] as const,
    list: () => [...queryKeys.fuelTypes.all, "list"] as const,
    detail: (id: number) => [...queryKeys.fuelTypes.all, "detail", id] as const,
  },
  
  // Movement Types
  movementTypes: {
    all: ["movementTypes"] as const,
    list: () => [...queryKeys.movementTypes.all, "list"] as const,
    detail: (id: number) => [...queryKeys.movementTypes.all, "detail", id] as const,
  },
  
  // Fuel Stock Movements
  fuelStock: {
    all: ["fuelStock"] as const,
    lists: () => [...queryKeys.fuelStock.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.fuelStock.lists(), filters] as const,
    details: () => [...queryKeys.fuelStock.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.fuelStock.details(), id] as const,
  },
  
  // Load Liters
  loadLiters: {
    all: ["loadLiters"] as const,
    lists: () => [...queryKeys.loadLiters.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.loadLiters.lists(), filters] as const,
    details: () => [...queryKeys.loadLiters.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.loadLiters.details(), id] as const,
    trips: () => [...queryKeys.loadLiters.all, "trips"] as const,
    tripsByTrip: (tripId: number) => [...queryKeys.loadLiters.trips(), "byTrip", tripId] as const,
  },
  
  // Trips
  trips: {
    all: ["trips"] as const,
    lists: () => [...queryKeys.trips.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.trips.lists(), filters] as const,
    byDriver: (driverId: number) => [...queryKeys.trips.all, "byDriver", driverId] as const,
    details: () => [...queryKeys.trips.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.trips.details(), id] as const,
  },
} as const;

// ============================================
// CONFIGURACIÓN DEL QUERY CLIENT
// ============================================
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos"
      staleTime: QUERY_TIMES.MODERATE.staleTime,
      // Tiempo que los datos permanecen en cache después de no usarse
      gcTime: QUERY_TIMES.MODERATE.gcTime,
      // Reintentos en caso de error
      retry: (failureCount, error) => {
        // No reintentar en errores 4xx (excepto 429 rate limit)
        if (error && typeof error === "object" && "response" in error) {
          const status = (error as { response?: { status?: number } }).response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            return false;
          }
        }
        // Máximo 3 reintentos
        return failureCount < 3;
      },
      // Delay exponencial entre reintentos
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // No refetch automático en focus por defecto
      refetchOnWindowFocus: false,
      // Refetch cuando reconecta
      refetchOnReconnect: true,
      // Mantener datos previos mientras carga nuevos
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      // Reintentos para mutaciones
      retry: 1,
      // Callback global de error
      onError: (error) => {
        const message = getErrorMessage(error);
        toast.error(message);
      },
    },
  },
};

// ============================================
// CREAR QUERY CLIENT
// ============================================
export const queryClient = new QueryClient(queryClientConfig);

// ============================================
// HELPERS DE INVALIDACIÓN
// ============================================
export const invalidateQueries = {
  // Invalidar todo lo relacionado con usuarios
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  
  // Invalidar todo lo relacionado con empresas
  companies: () => queryClient.invalidateQueries({ queryKey: queryKeys.companies.all }),
  
  // Invalidar todo lo relacionado con unidades de negocio
  businessUnits: () => queryClient.invalidateQueries({ queryKey: queryKeys.businessUnits.all }),
  
  // Invalidar todo lo relacionado con choferes
  drivers: () => queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all }),
  
  // Invalidar todo lo relacionado con recursos
  resources: () => queryClient.invalidateQueries({ queryKey: queryKeys.resources.all }),
  
  // Invalidar todo lo relacionado con combustible
  fuel: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.fuelTypes.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.fuelStock.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.loadLiters.all });
  },
  
  // Invalidar todo lo relacionado con viajes
  trips: () => queryClient.invalidateQueries({ queryKey: queryKeys.trips.all }),
  
  // Invalidar todo
  all: () => queryClient.invalidateQueries(),
};

export default queryClient;


