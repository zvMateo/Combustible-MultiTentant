/**
 * Servicio de Empresas - API Real con Axios
 */
import axiosInstance, { toArray } from "@/lib/axios";
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "@/types/api.types";

const COMPANIES_ENDPOINTS = {
  getAll: "/Companies/GetAll",
  getById: "/Companies/GetById",
  create: "/Companies/Create",
  update: "/Companies/Update",
  deactivate: "/Companies/Desactivate",
} as const;

// src/services/api/companies.api.ts

export const companiesApi = {
  /**
   * Obtener todas las empresas
   */
  async getAll(): Promise<Company[]> {
    const { data } = await axiosInstance.get<Company[]>(
      COMPANIES_ENDPOINTS.getAll
    );
    return toArray<Company>(data);
  },

  /**
   * Obtener empresa por ID
   */
  async getById(id: number): Promise<Company> {
    const { data } = await axiosInstance.get<Company>(
      COMPANIES_ENDPOINTS.getById,
      {
        params: { id },
      }
    );
    return data;
  },

  /**
   * Crear nueva empresa
   */
  async create(companyData: CreateCompanyRequest): Promise<Company> {
    const response = await axiosInstance.post<Company>(
      COMPANIES_ENDPOINTS.create,
      companyData
    );

    if (
      response.data &&
      typeof response.data === "object" &&
      "id" in response.data
    ) {
      return response.data;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const allCompanies = await this.getAll();
    const newCompany = allCompanies.find((c) => c.name === companyData.name);

    if (!newCompany) {
      throw new Error(
        "La empresa fue creada pero no se pudo recuperar su información"
      );
    }

    return newCompany;
  },

  /**
   * Actualizar empresa
   */
  async update(companyData: UpdateCompanyRequest): Promise<Company> {
    const { data } = await axiosInstance.put<Company>(
      COMPANIES_ENDPOINTS.update,
      companyData
    );
    return data;
  },

  /**
   * Desactivar empresa
   */
  async deactivate(id: number): Promise<void> {
    await axiosInstance.patch(COMPANIES_ENDPOINTS.deactivate, null, {
      params: { id },
    });
  },
};

export default companiesApi;
