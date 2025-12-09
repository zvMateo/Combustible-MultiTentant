/**
 * Servicios de API - Índice de exportaciones
 * 
 * Todos los servicios para comunicarse con la API de Combustibles
 * https://apicombustibles.ubiko.com.ar/swagger/index.html
 */

// Auth
export { authApi } from "./auth.api";

// Users & Roles
export { usersApi } from "./users.api";
export { rolesApi, userRolesApi } from "./roles.api";

// Companies & Business Units
export { companiesApi } from "./companies.api";
export { businessUnitsApi } from "./business-units.api";

// Drivers
export { driversApi } from "./drivers.api";

// Resources (Vehicles, Tanks, Dispensers)
export { resourcesApi, resourceTypesApi } from "./resources.api";

// Fuel
export { fuelTypesApi } from "./fuel-types.api";
export { movementTypesApi } from "./movement-types.api";
export { fuelStockMovementApi } from "./fuel-stock-movement.api";
export { loadLitersApi } from "./load-liters.api";

// Trips
export { tripsApi } from "./trips.api";

// Re-export types
export type * from "@/types/api.types";


