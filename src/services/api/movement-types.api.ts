/**
 * Servicio de Tipos de Movimiento - API Real con Axios
 */
import axiosInstance from "@/lib/axios";
import type {
  MovementType,
  CreateMovementTypeRequest,
  UpdateMovementTypeRequest,
} from "@/types/api.types";

const MOVEMENT_TYPES_ENDPOINTS = {
  getAll: "/MovementTypes/GetAll",
  getById: "/MovementTypes/GetById",
  create: "/MovementTypes/Create",
  update: "/MovementTypes/Update",
  deactivate: "/MovementTypes/Deactivate",
} as const;

export const movementTypesApi = {
  /**
   * Obtener todos los tipos de movimiento
   */
  async getAll(): Promise<MovementType[]> {
    const { data } = await axiosInstance.get<MovementType[]>(
      MOVEMENT_TYPES_ENDPOINTS.getAll
    );
    return data;
  },

  /**
   * Obtener tipo de movimiento por ID
   */
  async getById(id: number): Promise<MovementType> {
    const { data } = await axiosInstance.get<MovementType>(
      MOVEMENT_TYPES_ENDPOINTS.getById,
      { params: { id } }
    );
    return data;
  },

  /**
   * Crear nuevo tipo de movimiento
   */
  async create(movementTypeData: CreateMovementTypeRequest): Promise<MovementType> {
    const { data } = await axiosInstance.post<MovementType>(
      MOVEMENT_TYPES_ENDPOINTS.create,
      movementTypeData
    );
    return data;
  },

  /**
   * Actualizar tipo de movimiento
   */
  async update(movementTypeData: UpdateMovementTypeRequest): Promise<MovementType> {
    const { data } = await axiosInstance.put<MovementType>(
      MOVEMENT_TYPES_ENDPOINTS.update,
      movementTypeData
    );
    return data;
  },

  /**
   * Desactivar tipo de movimiento
   */
  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(MOVEMENT_TYPES_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },
};

export default movementTypesApi;

