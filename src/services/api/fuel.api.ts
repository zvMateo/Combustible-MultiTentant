/**
 * Servicio de Combustible (Tipos, Stock, Cargas) - API Real con Axios
 */
import axiosInstance from "@/lib/axios";
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
  LoadTrip,
  CreateLoadTripRequest,
} from "@/types/api.types";

// ============================================
// FUEL TYPES (Tipos de Combustible)
// ============================================
const FUEL_TYPES_ENDPOINTS = {
  getAll: "/FuelTypes/GetAll",
  getById: "/FuelTypes/GetById",
  create: "/FuelTypes/Create",
  update: "/FuelTypes/Update",
  deactivate: "/FuelTypes/Deactivate",
} as const;

export const fuelTypesApi = {
  async getAll(): Promise<FuelType[]> {
    const { data } = await axiosInstance.get<FuelType[]>(FUEL_TYPES_ENDPOINTS.getAll);
    return data;
  },

  async getById(id: number): Promise<FuelType> {
    const { data } = await axiosInstance.get<FuelType>(FUEL_TYPES_ENDPOINTS.getById, {
      params: { id },
    });
    return data;
  },

  async create(fuelTypeData: CreateFuelTypeRequest): Promise<FuelType> {
    const { data } = await axiosInstance.post<FuelType>(
      FUEL_TYPES_ENDPOINTS.create,
      fuelTypeData
    );
    return data;
  },

  async update(fuelTypeData: UpdateFuelTypeRequest): Promise<FuelType> {
    const { data } = await axiosInstance.put<FuelType>(
      FUEL_TYPES_ENDPOINTS.update,
      fuelTypeData
    );
    return data;
  },

  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(FUEL_TYPES_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },
};

// ============================================
// MOVEMENT TYPES (Tipos de Movimiento)
// ============================================
const MOVEMENT_TYPES_ENDPOINTS = {
  getAll: "/MovementTypes/GetAll",
  getById: "/MovementTypes/GetById",
  create: "/MovementTypes/Create",
  update: "/MovementTypes/Update",
  deactivate: "/MovementTypes/Deactivate",
} as const;

export const movementTypesApi = {
  async getAll(): Promise<MovementType[]> {
    const { data } = await axiosInstance.get<MovementType[]>(
      MOVEMENT_TYPES_ENDPOINTS.getAll
    );
    return data;
  },

  async getById(id: number): Promise<MovementType> {
    const { data } = await axiosInstance.get<MovementType>(
      MOVEMENT_TYPES_ENDPOINTS.getById,
      { params: { id } }
    );
    return data;
  },

  async create(movementTypeData: CreateMovementTypeRequest): Promise<MovementType> {
    const { data } = await axiosInstance.post<MovementType>(
      MOVEMENT_TYPES_ENDPOINTS.create,
      movementTypeData
    );
    return data;
  },

  async update(movementTypeData: UpdateMovementTypeRequest): Promise<MovementType> {
    const { data } = await axiosInstance.put<MovementType>(
      MOVEMENT_TYPES_ENDPOINTS.update,
      movementTypeData
    );
    return data;
  },

  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(MOVEMENT_TYPES_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },
};

// ============================================
// FUEL STOCK MOVEMENT (Movimientos de Stock)
// ============================================
const FUEL_STOCK_ENDPOINTS = {
  getAll: "/FuelStockMovement/GetAll",
  getById: "/FuelStockMovement/GetById",
  create: "/FuelStockMovement/Create",
  update: "/FuelStockMovement/Update",
} as const;

export const fuelStockApi = {
  async getAll(): Promise<FuelStockMovement[]> {
    const { data } = await axiosInstance.get<FuelStockMovement[]>(
      FUEL_STOCK_ENDPOINTS.getAll
    );
    return data;
  },

  async getById(id: number): Promise<FuelStockMovement> {
    const { data } = await axiosInstance.get<FuelStockMovement>(
      FUEL_STOCK_ENDPOINTS.getById,
      { params: { id } }
    );
    return data;
  },

  async create(movementData: CreateFuelStockMovementRequest): Promise<FuelStockMovement> {
    const { data } = await axiosInstance.post<FuelStockMovement>(
      FUEL_STOCK_ENDPOINTS.create,
      movementData
    );
    return data;
  },

  async update(movementData: UpdateFuelStockMovementRequest): Promise<FuelStockMovement> {
    const { data } = await axiosInstance.put<FuelStockMovement>(
      FUEL_STOCK_ENDPOINTS.update,
      movementData
    );
    return data;
  },
};

// ============================================
// LOAD LITERS (Cargas de Combustible)
// ============================================
const LOAD_LITERS_ENDPOINTS = {
  getAll: "/LoadLiters/GetAll",
  getById: "/LoadLiters/GetById",
  create: "/LoadLiters/Create",
  update: "/LoadLiters/Update",
  associateTrip: "/LoadLiters/AssociateLoadTrip",
  getAllLoadTrips: "/LoadLiters/GetAllLoadTrips",
  getLoadTripById: "/LoadLiters/GetByIdLoadTrips",
  getLoadTripsByTrip: "/LoadLiters/GetByIdTrip",
} as const;

export const loadLitersApi = {
  async getAll(): Promise<LoadLiters[]> {
    const { data } = await axiosInstance.get<LoadLiters[]>(LOAD_LITERS_ENDPOINTS.getAll);
    return data;
  },

  async getById(id: number): Promise<LoadLiters> {
    const { data } = await axiosInstance.get<LoadLiters>(LOAD_LITERS_ENDPOINTS.getById, {
      params: { id },
    });
    return data;
  },

  async create(loadData: CreateLoadLitersRequest): Promise<LoadLiters> {
    const { data } = await axiosInstance.post<LoadLiters>(
      LOAD_LITERS_ENDPOINTS.create,
      loadData
    );
    return data;
  },

  async update(id: number, loadData: UpdateLoadLitersRequest): Promise<LoadLiters> {
    const { data } = await axiosInstance.put<LoadLiters>(LOAD_LITERS_ENDPOINTS.update, loadData, {
      params: { id },
    });
    return data;
  },

  // Load Trips (Asociación Carga-Viaje)
  async associateTrip(tripData: CreateLoadTripRequest): Promise<LoadTrip> {
    const { data } = await axiosInstance.post<LoadTrip>(
      LOAD_LITERS_ENDPOINTS.associateTrip,
      tripData
    );
    return data;
  },

  async getAllLoadTrips(): Promise<LoadTrip[]> {
    const { data } = await axiosInstance.get<LoadTrip[]>(
      LOAD_LITERS_ENDPOINTS.getAllLoadTrips
    );
    return data;
  },

  async getLoadTripById(id: number): Promise<LoadTrip> {
    const { data } = await axiosInstance.get<LoadTrip>(
      LOAD_LITERS_ENDPOINTS.getLoadTripById,
      { params: { id } }
    );
    return data;
  },

  async getLoadTripsByTrip(idTrip: number): Promise<LoadTrip[]> {
    const { data } = await axiosInstance.get<LoadTrip[]>(
      LOAD_LITERS_ENDPOINTS.getLoadTripsByTrip,
      { params: { idTrip } }
    );
    return data;
  },
};
