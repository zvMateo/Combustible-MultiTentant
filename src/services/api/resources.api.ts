/**
 * Servicio de Recursos (Vehículos, Tanques, Surtidores) - API Real con Axios
 */
import axiosInstance, { toArray } from "@/lib/axios";
import type {
  Resource,
  ResourceType,
  CreateResourceRequest,
  UpdateResourceRequest,
  CreateResourceTypeRequest,
  UpdateResourceTypeRequest,
} from "@/types/api.types";
import { RESOURCE_TYPES } from "@/types/api.types";

const RESOURCE_ENDPOINTS = {
  getAll: "/Resource/GetAll",
  getById: "/Resource/GetById",
  getByType: "/Resource/GetByIdType",
  getByCompany: "/Resource/GetByIdCompany",
  getByBusinessUnit: "/Resource/GetByIdBusinessUnit",
  create: "/Resource/Create",
  update: "/Resource/Update",
  deactivate: "/Resource/Deactivate",
} as const;

const RESOURCE_TYPES_ENDPOINTS = {
  getAll: "/ResourceTypes/GetAll",
  getByCompany: "/ResourceTypes/GetByIdCompany",
  getByBusinessUnit: "/ResourceTypes/GetByIdBusinessUnit",
  getById: "/ResourceTypes/GetById",
  create: "/ResourceTypes/Create",
  update: "/ResourceTypes/Update",
  deactivate: "/ResourceTypes/Deactivate",
} as const;

export const resourcesApi = {
  /**
   * Obtener todos los recursos (superadmin)
   */
  async getAll(): Promise<Resource[]> {
    const { data } = await axiosInstance.get<Resource[]>(RESOURCE_ENDPOINTS.getAll);
    return toArray<Resource>(data);
  },

  /**
   * Obtener recurso por ID
   */
  async getById(id: number): Promise<Resource> {
    const { data } = await axiosInstance.get<Resource>(
      RESOURCE_ENDPOINTS.getById,
      {
        params: { id },
      }
    );
    return data;
  },

  /**
   * Obtener recursos por tipo (vehículos, tanques, surtidores)
   */
  async getByType(idType: number): Promise<Resource[]> {
    const { data } = await axiosInstance.get<Resource[]>(
      RESOURCE_ENDPOINTS.getByType,
      { params: { IdType: idType } }
    );
    return toArray<Resource>(data);
  },

  /**
   * Obtener recursos por empresa
   */
  async getByCompany(idCompany: number): Promise<Resource[]> {
    const { data } = await axiosInstance.get<Resource[]>(
      RESOURCE_ENDPOINTS.getByCompany,
      { params: { IdCompany: idCompany } }
    );
    return toArray<Resource>(data);
  },

  /**
   * Obtener recursos por unidad de negocio
   */
  async getByBusinessUnit(idBusinessUnit: number): Promise<Resource[]> {
    const { data } = await axiosInstance.get<Resource[]>(
      RESOURCE_ENDPOINTS.getByBusinessUnit,
      { params: { IdBusinessUnit: idBusinessUnit } }
    );
    return toArray<Resource>(data);
  },

  /**
   * Crear nuevo recurso
   */
  async create(resourceData: CreateResourceRequest): Promise<Resource> {
    const { data } = await axiosInstance.post<Resource>(
      RESOURCE_ENDPOINTS.create,
      resourceData
    );
    return data;
  },

  /**
   * Actualizar recurso
   */
  async update(resourceData: UpdateResourceRequest): Promise<Resource> {
    const { data } = await axiosInstance.put<Resource>(
      RESOURCE_ENDPOINTS.update,
      resourceData
    );
    return data;
  },

  /**
   * Desactivar recurso
   */
  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(RESOURCE_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },

  // ============================================
  // HELPERS PARA TIPOS ESPECÍFICOS
  // ============================================

  /**
   * Obtener todos los vehículos
   */
  async getVehicles(): Promise<Resource[]> {
    return this.getByType(RESOURCE_TYPES.VEHICLE);
  },

  /**
   * Obtener todos los tanques
   */
  async getTanks(): Promise<Resource[]> {
    return this.getByType(RESOURCE_TYPES.TANK);
  },

  /**
   * Obtener todos los surtidores
   */
  async getDispensers(): Promise<Resource[]> {
    return this.getByType(RESOURCE_TYPES.DISPENSER);
  },
};

export const resourceTypesApi = {
  /**
   * Obtener tipos de recursos por empresa
   */
  async getByCompany(idCompany: number): Promise<ResourceType[]> {
    const { data } = await axiosInstance.get<ResourceType[]>(
      RESOURCE_TYPES_ENDPOINTS.getByCompany,
      { params: { idCompany } }
    );
    return data;
  },

  /**
   * Obtener tipos de recursos por unidad de negocio
   */
  async getByBusinessUnit(idBusinessUnit: number): Promise<ResourceType[]> {
    const { data } = await axiosInstance.get<ResourceType[]>(
      RESOURCE_TYPES_ENDPOINTS.getByBusinessUnit,
      { params: { IdBusinessUnit: idBusinessUnit } }
    );
    return data;
  },

  /**
   * Obtener tipo de recurso por ID
   */
  async getById(id: number): Promise<ResourceType> {
    const { data } = await axiosInstance.get<ResourceType>(
      RESOURCE_TYPES_ENDPOINTS.getById,
      { params: { id } }
    );
    return data;
  },

  /**
   * Crear nuevo tipo de recurso
   */
  async create(typeData: CreateResourceTypeRequest): Promise<ResourceType> {
    const { data } = await axiosInstance.post<ResourceType>(
      RESOURCE_TYPES_ENDPOINTS.create,
      typeData
    );
    return data;
  },

  /**
   * Actualizar tipo de recurso
   */
  async update(typeData: UpdateResourceTypeRequest): Promise<ResourceType> {
    const { data } = await axiosInstance.put<ResourceType>(
      RESOURCE_TYPES_ENDPOINTS.update,
      typeData
    );
    return data;
  },

  /**
   * Desactivar tipo de recurso
   */
  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(RESOURCE_TYPES_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },
};

export default resourcesApi;
