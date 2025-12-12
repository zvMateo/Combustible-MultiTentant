/**
 * Servicio de Tipos de Combustible - API Real con Axios
 */
import axiosInstance from "@/lib/axios";
import type {
  FuelType,
  CreateFuelTypeRequest,
  UpdateFuelTypeRequest,
} from "@/types/api.types";

const FUEL_TYPES_ENDPOINTS = {
  getAll: "/FuelTypes/GetAll",
  getByCompany: "/FuelTypes/GetFuelTypesByIdCompany",
  getById: "/FuelTypes/GetById",
  create: "/FuelTypes/Create",
  update: "/FuelTypes/Update",
  deactivate: "/FuelTypes/Deactivate",
} as const;

export const fuelTypesApi = {
  /**
   * Obtener tipos de combustible por empresa
   */
  async getByCompany(idCompany: number): Promise<FuelType[]> {
    const { data } = await axiosInstance.get<FuelType[]>(
      FUEL_TYPES_ENDPOINTS.getByCompany,
      { params: { idCompany } }
    );
    return data;
  },

  /**
   * Obtener tipo de combustible por ID
   */
  async getById(id: number): Promise<FuelType> {
    const { data } = await axiosInstance.get<FuelType>(
      FUEL_TYPES_ENDPOINTS.getById,
      {
        params: { id },
      }
    );
    return data;
  },

  /**
   * Crear nuevo tipo de combustible
   */
  async create(fuelTypeData: CreateFuelTypeRequest): Promise<FuelType> {
    const { data } = await axiosInstance.post<FuelType>(
      FUEL_TYPES_ENDPOINTS.create,
      fuelTypeData
    );
    return data;
  },

  /**
   * Actualizar tipo de combustible
   */
  async update(fuelTypeData: UpdateFuelTypeRequest): Promise<FuelType> {
    const { data } = await axiosInstance.put<FuelType>(
      FUEL_TYPES_ENDPOINTS.update,
      fuelTypeData
    );
    return data;
  },

  /**
   * Desactivar tipo de combustible
   */
  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(FUEL_TYPES_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },
};

export default fuelTypesApi;
