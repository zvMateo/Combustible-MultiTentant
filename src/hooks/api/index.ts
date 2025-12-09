/**
 * Hooks de API - Índice de exportaciones
 *
 * Todos los hooks de React Query para comunicarse con la API
 */

// Auth
export { useLogin, useLogout } from "./useAuth";

// Users
export {
  useUsers,
  useUser,
  useUserRoles,
  useCreateUser,
  useUpdateUser,
  useChangePassword,
  useAddUserRole,
} from "./useUsers";

// Companies
export {
  useCompanies,
  useCompany,
  useCreateCompany,
  useUpdateCompany,
} from "./useCompanies";

// Business Units
export {
  useBusinessUnits,
  useBusinessUnitsByCompany,
  useBusinessUnit,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeactivateBusinessUnit,
} from "./useBusinessUnits";

// Drivers
export {
  useDrivers,
  useDriversByCompany,
  useDriver,
  useCreateDriver,
  useUpdateDriver,
  useDeactivateDriver,
} from "./useDrivers";

// Resources
export {
  // Generales
  useResources,
  useResource,
  useResourcesByType,
  useResourcesByCompany,
  useResourcesByBusinessUnit,
  // Tipos específicos
  useVehicles,
  useTanks,
  useDispensers,
  // Tipos de recursos
  useResourceTypes,
  // Mutations
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
  useCreateVehicle,
  useCreateTank,
  useCreateDispenser,
} from "./useResources";

// Fuel
export {
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
} from "./useFuel";

// Trips
export {
  useTrips,
  useTrip,
  useTripsByDriver,
  useCreateTrip,
  useUpdateTrip,
} from "./useTrips";


