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
    const response = await axiosInstance.post<unknown>(
      COMPANIES_ENDPOINTS.create,
      companyData
    );

    const data = response.data as unknown;

    const extractCompany = (value: unknown): Company | null => {
      if (!value || typeof value !== "object") return null;

      const v = value as Record<string, unknown>;

      if (typeof v.id === "number") {
        return v as unknown as Company;
      }

      // Algunos endpoints devuelven { data: { ... } } o { result: { ... } }
      const nestedCandidates = [v.data, v.result, v.company];
      for (const c of nestedCandidates) {
        const nested = extractCompany(c);
        if (nested) return nested;
      }
      return null;
    };

    const createdCompany = extractCompany(data);
    if (createdCompany) {
      return createdCompany;
    }

    const extractCompanyId = (value: unknown): number | null => {
      if (typeof value === "number") return Number.isFinite(value) ? value : null;
      if (typeof value === "string") {
        const n = Number.parseInt(value, 10);
        return Number.isFinite(n) ? n : null;
      }
      if (!value || typeof value !== "object") return null;

      const v = value as Record<string, unknown>;
      const candidates = [v.id, v.companyId, v.idCompany];
      for (const c of candidates) {
        const n = extractCompanyId(c);
        if (typeof n === "number") return n;
      }

      const nestedCandidates = [v.data, v.result];
      for (const c of nestedCandidates) {
        const n = extractCompanyId(c);
        if (typeof n === "number") return n;
      }

      return null;
    };

    const createdId = extractCompanyId(data);
    if (createdId) {
      return await this.getById(createdId);
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
