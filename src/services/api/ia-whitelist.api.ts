/**
 * Servicio de API - WhiteList de IA
 *
 * Gestión de números de teléfono autorizados para interactuar
 * con el bot de WhatsApp/IA.
 */
import axiosInstance from "@/lib/axios";

// ============================================
// TIPOS
// ============================================
export interface IaWhiteListContact {
  id: number;
  name: string;
  idCompany: number;
  company?: string;
  idBusinessUnit: number;
  businessUnit?: string | null;
  phoneNumber: string;
  active: boolean;
}

export interface CreateIaWhiteListRequest {
  name: string;
  idCompany: number;
  idBusinessUnit: number;
  phoneNumber: string;
}

export interface UpdateIaWhiteListRequest {
  id: number;
  name: string;
  idCompany: number;
  idBusinessUnit: number;
  phoneNumber: string;
}

// ============================================
// ENDPOINTS
// ============================================
const ENDPOINTS = {
  getAll: "/IaWhiteList/GetAll",
  getById: "/IaWhiteList/GetById",
  create: "/IaWhiteList/Create",
  update: "/IaWhiteList/Update",
  desactivate: "/IaWhiteList/Desactivate",
} as const;

// ============================================
// API SERVICE
// ============================================
export const iaWhiteListApi = {
  /**
   * Obtener todos los contactos de la WhiteList
   */
  async getAll(
    idCompany?: number,
    idBusinessUnit?: number
  ): Promise<IaWhiteListContact[]> {
    const params: Record<string, number> = {};
    if (typeof idCompany === "number") params.IdCompany = idCompany;
    if (typeof idBusinessUnit === "number") params.IdBusinessUnit = idBusinessUnit;

    const response = await axiosInstance.get<IaWhiteListContact[]>(ENDPOINTS.getAll, {
      params,
    });
    return response.data;
  },

  /**
   * Obtener un contacto por ID
   */
  async getById(
    id: number,
    idCompany?: number,
    idBusinessUnit?: number
  ): Promise<IaWhiteListContact> {
    const params: Record<string, number> = { id };
    if (typeof idCompany === "number") params.IdCompany = idCompany;
    if (typeof idBusinessUnit === "number") params.IdBusinessUnit = idBusinessUnit;

    const response = await axiosInstance.get<IaWhiteListContact>(ENDPOINTS.getById, {
      params,
    });
    return response.data;
  },

  /**
   * Crear un nuevo contacto en WhiteList
   */
  async create(data: CreateIaWhiteListRequest): Promise<IaWhiteListContact> {
    const response = await axiosInstance.post<IaWhiteListContact>(
      ENDPOINTS.create,
      data
    );
    return response.data;
  },

  /**
   * Actualizar un contacto existente
   */
  async update(data: UpdateIaWhiteListRequest): Promise<IaWhiteListContact> {
    const response = await axiosInstance.put<IaWhiteListContact>(
      ENDPOINTS.update,
      data
    );
    return response.data;
  },
  /**
   * Activar un contacto
   */
  async activate(id: number): Promise<void> {
    await axiosInstance.patch(`/IaWhiteList/Activate?id=${id}`);
  },

  /**
   * Cambiar estado (toggle)
   */
  async toggleActive(id: number, activate: boolean): Promise<void> {
    const endpoint = activate
      ? "/IaWhiteList/Activate"
      : "/IaWhiteList/Desactivate";
    await axiosInstance.patch(`${endpoint}?id=${id}`);
  },

  /**
   * Desactivar un contacto (soft delete)
   */
  async desactivate(id: number): Promise<void> {
    await axiosInstance.patch(`${ENDPOINTS.desactivate}?id=${id}`);
  },
};

export default iaWhiteListApi;
