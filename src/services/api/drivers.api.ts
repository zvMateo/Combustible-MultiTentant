/**
 * Servicio de Choferes - API Real con Axios
 */
import axiosInstance, { toArray } from "@/lib/axios";
import type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
} from "@/types/api.types";

const DRIVERS_ENDPOINTS = {
  getAll: "/Drivers/GetAll",
  getById: "/Drivers/GetById",
  getByCompany: "/Drivers/GetByIdCompany",
  create: "/Drivers/Create",
  update: "/Drivers/Update",
  deactivate: "/Drivers/Deactivate",
} as const;

export const driversApi = {
  /**
   * Obtener chofer por ID
   */
  async getById(id: number): Promise<Driver> {
    const { data } = await axiosInstance.get<Driver>(
      DRIVERS_ENDPOINTS.getById,
      {
        params: { id },
      }
    );
    return data;
  },

  /**
   * Obtener choferes por empresa
   */
  async getByCompany(idCompany: number): Promise<Driver[]> {
    const { data } = await axiosInstance.get<Driver[]>(
      DRIVERS_ENDPOINTS.getByCompany,
      { params: { idCompany } }
    );
    return toArray<Driver>(data);
  },

  /**
   * Crear nuevo chofer
   */
  async create(driverData: CreateDriverRequest): Promise<Driver> {
    const { data } = await axiosInstance.post<Driver>(
      DRIVERS_ENDPOINTS.create,
      driverData
    );
    return data;
  },

  /**
   * Actualizar chofer
   */
  async update(driverData: UpdateDriverRequest): Promise<Driver> {
    const { data } = await axiosInstance.put<Driver>(
      DRIVERS_ENDPOINTS.update,
      driverData
    );
    return data;
  },

  /**
   * Desactivar chofer
   */
  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(DRIVERS_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },
};

export default driversApi;
