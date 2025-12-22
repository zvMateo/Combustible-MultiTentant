/**
 * Servicio de Movimientos de Stock de Combustible - API Real con Axios
 */
import axiosInstance, { toArray } from "@/lib/axios";
import type {
  FuelStockMovement,
  CreateFuelStockMovementRequest,
  UpdateFuelStockMovementRequest,
} from "@/types/api.types";

const FUEL_STOCK_MOVEMENT_ENDPOINTS = {
  getAll: "/FuelStockMovement/GetAll",
  getByCompany: "/FuelStockMovement/GetByIdCompany",
  getByBusinessUnit: "/FuelStockMovement/GetByIdBusinessUnit",
  getById: "/FuelStockMovement/GetById",
  create: "/FuelStockMovement/Create",
  update: "/FuelStockMovement/Update",
} as const;

export const fuelStockMovementApi = {
  /**
   * Obtener todos los movimientos de stock
   */
  async getAll(): Promise<FuelStockMovement[]> {
    const { data } = await axiosInstance.get<FuelStockMovement[]>(
      FUEL_STOCK_MOVEMENT_ENDPOINTS.getAll
    );
    return data;
  },

  /**
   * Obtener movimientos por empresa
   */
  async getByCompany(idCompany: number): Promise<FuelStockMovement[]> {
    const { data } = await axiosInstance.get<FuelStockMovement[]>(
      FUEL_STOCK_MOVEMENT_ENDPOINTS.getByCompany,
      { params: { IdCompany: idCompany } }
    );
    return toArray<FuelStockMovement>(data);
  },

  /**
   * Obtener movimientos por unidad de negocio
   */
  async getByBusinessUnit(idBusinessUnit: number): Promise<FuelStockMovement[]> {
    const { data } = await axiosInstance.get<FuelStockMovement[]>(
      FUEL_STOCK_MOVEMENT_ENDPOINTS.getByBusinessUnit,
      { params: { IdBusinessUnit: idBusinessUnit } }
    );
    return toArray<FuelStockMovement>(data);
  },

  /**
   * Obtener movimiento de stock por ID
   */
  async getById(id: number): Promise<FuelStockMovement> {
    const { data } = await axiosInstance.get<FuelStockMovement>(
      FUEL_STOCK_MOVEMENT_ENDPOINTS.getById,
      { params: { id } }
    );
    return data;
  },

  /**
   * Crear nuevo movimiento de stock
   */
  async create(
    movementData: CreateFuelStockMovementRequest
  ): Promise<FuelStockMovement> {
    const { data } = await axiosInstance.post<FuelStockMovement>(
      FUEL_STOCK_MOVEMENT_ENDPOINTS.create,
      movementData
    );
    return data;
  },

  /**
   * Actualizar movimiento de stock
   */
  async update(
    movementData: UpdateFuelStockMovementRequest
  ): Promise<FuelStockMovement> {
    const { data } = await axiosInstance.put<FuelStockMovement>(
      FUEL_STOCK_MOVEMENT_ENDPOINTS.update,
      movementData
    );
    return data;
  },
};

