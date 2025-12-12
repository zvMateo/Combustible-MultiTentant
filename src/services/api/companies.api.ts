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
    console.log("🚀 [companiesApi.create] Enviando datos:", companyData);

    const response = await axiosInstance.post<Company>(
      COMPANIES_ENDPOINTS.create,
      companyData
    );

    console.log("✅ [companiesApi.create] Response:", response.data);
    console.log("✅ [companiesApi.create] Status:", response.status);

    // Si el backend devuelve el objeto directamente con id, retornarlo
    if (
      response.data &&
      typeof response.data === "object" &&
      "id" in response.data
    ) {
      console.log(
        "✅ [companiesApi.create] Empresa con ID recibida:",
        response.data
      );
      return response.data;
    }

    // Si el backend solo devuelve un mensaje, buscar la empresa recién creada
    console.log(
      "🔍 [companiesApi.create] Backend no devolvió el objeto, buscando empresa por nombre:",
      companyData.name
    );

    // Esperar un momento para que la base de datos se actualice
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Buscar la empresa recién creada por nombre
    const allCompanies = await this.getAll();
    const newCompany = allCompanies.find((c) => c.name === companyData.name);

    if (!newCompany) {
      console.error(
        "❌ [companiesApi.create] No se encontró la empresa recién creada"
      );
      throw new Error(
        "La empresa fue creada pero no se pudo recuperar su información"
      );
    }

    console.log("✅ [companiesApi.create] Empresa encontrada:", newCompany);
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

