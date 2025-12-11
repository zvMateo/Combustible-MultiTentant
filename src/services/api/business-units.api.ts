/**
 * Servicio de Unidades de Negocio - API Real con Axios
 */
import axiosInstance, { toArray } from "@/lib/axios";
import type {
  BusinessUnit,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
} from "@/types/api.types";

const BUSINESS_UNITS_ENDPOINTS = {
  getAll: "/BusinessUnits/GetAll",
  getById: "/BusinessUnits/GetById",
  getByCompany: "/BusinessUnits/GetByIdCompany",
  create: "/BusinessUnits/Create",
  update: "/BusinessUnits/Update",
  deactivate: "/BusinessUnits/Desactivate",
} as const;

export const businessUnitsApi = {
  /**
   * Obtener todas las unidades de negocio
   */
  async getAll(): Promise<BusinessUnit[]> {
    const { data } = await axiosInstance.get<BusinessUnit[]>(
      BUSINESS_UNITS_ENDPOINTS.getAll
    );
    return toArray<BusinessUnit>(data);
  },

  /**
   * Obtener unidad de negocio por ID
   */
  async getById(id: number): Promise<BusinessUnit> {
    const { data } = await axiosInstance.get<BusinessUnit>(
      BUSINESS_UNITS_ENDPOINTS.getById,
      { params: { id } }
    );
    return data;
  },

  /**
   * Obtener unidades de negocio por empresa
   */
  async getByCompany(idCompany: number): Promise<BusinessUnit[]> {
    const { data } = await axiosInstance.get<BusinessUnit[]>(
      BUSINESS_UNITS_ENDPOINTS.getByCompany,
      { params: { idCompany } }
    );
    return toArray<BusinessUnit>(data);
  },

  /**
   * Crear nueva unidad de negocio
   */
  async create(unitData: CreateBusinessUnitRequest): Promise<BusinessUnit> {
    const { data } = await axiosInstance.post<BusinessUnit>(
      BUSINESS_UNITS_ENDPOINTS.create,
      unitData
    );
    return data;
  },

  /**
   * Actualizar unidad de negocio
   */
  async update(unitData: UpdateBusinessUnitRequest): Promise<BusinessUnit> {
    const { data } = await axiosInstance.put<BusinessUnit>(
      BUSINESS_UNITS_ENDPOINTS.update,
      unitData
    );
    return data;
  },

  /**
   * Desactivar unidad de negocio
   */
  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(BUSINESS_UNITS_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },
};

export default businessUnitsApi;
