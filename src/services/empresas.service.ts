// src/services/empresas.service.ts
import type {
  Empresa,
  EmpresaFormData,
  EmpresaResumen,
  EmpresaStats,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";
import { apiClient } from "./api.client";

/**
 * Mock data para desarrollo
 */
const MOCK_EMPRESAS: Empresa[] = [
  {
    id: 1,
    nombre: "Empresa A - Agrícola",
    razonSocial: "Empresa A S.A.",
    cuit: "30-12345678-9",
    subdomain: "empresaa", // Coincide con usuarios mock
    adminEmail: "admin@empresaA.com",
    telefono: "+54 351 1234567",
    direccion: "Av. Colón 1234, Córdoba",
    activo: true,
    theme: { primaryColor: "#1E3A5F", secondaryColor: "#10B981" },
    policies: {
      requiredPhotos: true,
      requiredLocation: true,
      requiredAudio: false,
      maxLitrosThreshold: 200,
      minLitrosThreshold: 5,
      fuelPrice: 850,
      allowOfflineMode: false,
      autoValidateEvents: false,
      requireOdometerPhoto: true,
      requireFuelPumpPhoto: true,
    },
    subscriptionPlan: "professional",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-12-01T15:30:00Z",
  },
  {
    id: 2,
    nombre: "Empresa B - Logística",
    razonSocial: "Empresa B S.R.L.",
    cuit: "30-98765432-1",
    subdomain: "empresab", // Coincide con patrón
    adminEmail: "admin@empresaB.com",
    telefono: "+54 351 7654321",
    direccion: "Ruta 9 Km 15, Córdoba",
    activo: true,
    theme: { primaryColor: "#10B981", secondaryColor: "#3B82F6" },
    policies: {
      requiredPhotos: true,
      requiredLocation: true,
      requiredAudio: true,
      maxLitrosThreshold: 300,
      minLitrosThreshold: 10,
      fuelPrice: 845,
      allowOfflineMode: true,
      autoValidateEvents: false,
      requireOdometerPhoto: true,
      requireFuelPumpPhoto: true,
    },
    subscriptionPlan: "enterprise",
    createdAt: "2024-02-20T08:00:00Z",
    updatedAt: "2024-12-02T10:15:00Z",
  },
];

/**
 * Flag para usar mock o API real
 */
const USE_MOCK = true;

class EmpresasService {
  private mockData = [...MOCK_EMPRESAS];

  /**
   * Listar empresas con paginación
   */
  async list(params?: PaginationParams & { search?: string; activo?: boolean }): Promise<PaginatedResponse<Empresa>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = [...this.mockData];
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.nombre.toLowerCase().includes(search) ||
            e.subdomain.toLowerCase().includes(search) ||
            e.adminEmail.toLowerCase().includes(search)
        );
      }
      
      if (params?.activo !== undefined) {
        filtered = filtered.filter((e) => e.activo === params.activo);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    }

    return apiClient.get<PaginatedResponse<Empresa>>("/empresas", params);
  }

  /**
   * Obtener empresa por ID
   */
  async getById(id: number): Promise<ApiResponse<Empresa>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const empresa = this.mockData.find((e) => e.id === id);
      
      if (!empresa) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } };
      }

      return { success: true, data: empresa };
    }

    return apiClient.get<ApiResponse<Empresa>>(`/empresas/${id}`);
  }

  /**
   * Obtener empresa por subdomain
   */
  async getBySubdomain(subdomain: string): Promise<ApiResponse<Empresa>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const empresa = this.mockData.find(
        (e) => e.subdomain.toLowerCase() === subdomain.toLowerCase()
      );
      
      if (!empresa) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } };
      }

      return { success: true, data: empresa };
    }

    return apiClient.get<ApiResponse<Empresa>>(`/empresas/subdomain/${subdomain}`);
  }

  /**
   * Crear empresa
   */
  async create(data: EmpresaFormData): Promise<ApiResponse<Empresa>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newEmpresa: Empresa = {
        id: Math.max(...this.mockData.map((e) => e.id), 0) + 1,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.mockData.push(newEmpresa);
      return { success: true, data: newEmpresa, message: "Empresa creada exitosamente" };
    }

    return apiClient.post<ApiResponse<Empresa>>("/empresas", data);
  }

  /**
   * Actualizar empresa
   */
  async update(id: number, data: Partial<EmpresaFormData>): Promise<ApiResponse<Empresa>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((e) => e.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } };
      }

      this.mockData[index] = {
        ...this.mockData[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return { success: true, data: this.mockData[index], message: "Empresa actualizada exitosamente" };
    }

    return apiClient.put<ApiResponse<Empresa>>(`/empresas/${id}`, data);
  }

  /**
   * Eliminar empresa
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((e) => e.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Empresa no encontrada" } };
      }

      this.mockData.splice(index, 1);
      return { success: true, data: undefined, message: "Empresa eliminada exitosamente" };
    }

    return apiClient.delete<ApiResponse<void>>(`/empresas/${id}`);
  }

  /**
   * Activar/Desactivar empresa
   */
  async toggleActive(id: number, activo: boolean): Promise<ApiResponse<Empresa>> {
    return this.update(id, { activo });
  }

  /**
   * Obtener estadísticas de empresa
   */
  async getStats(id: number): Promise<ApiResponse<EmpresaStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const stats: EmpresaStats = {
        totalUsers: 45,
        totalVehicles: 32,
        totalDrivers: 28,
        totalEvents: 1250,
        dailyEvents: 24,
        monthlyEvents: 580,
        totalLitros: 45000,
        totalCostos: 38250000,
        validatedEvents: 1180,
        pendingEvents: 45,
        rejectedEvents: 25,
      };

      return { success: true, data: stats };
    }

    return apiClient.get<ApiResponse<EmpresaStats>>(`/empresas/${id}/stats`);
  }

  /**
   * Obtener resumen de empresas para dashboard
   */
  async getResumen(): Promise<ApiResponse<EmpresaResumen[]>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      const resumen: EmpresaResumen[] = this.mockData.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        subdomain: e.subdomain,
        primaryColor: e.theme.primaryColor,
        activa: e.activo,
        eventosHoy: Math.floor(Math.random() * 30) + 5,
        litrosHoy: Math.floor(Math.random() * 2000) + 500,
        usuarios: Math.floor(Math.random() * 50) + 10,
        vehiculos: Math.floor(Math.random() * 30) + 5,
      }));

      return { success: true, data: resumen };
    }

    return apiClient.get<ApiResponse<EmpresaResumen[]>>("/empresas/resumen");
  }

  /**
   * Verificar disponibilidad de subdomain
   */
  async checkSubdomain(subdomain: string): Promise<ApiResponse<{ available: boolean }>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const exists = this.mockData.some(
        (e) => e.subdomain.toLowerCase() === subdomain.toLowerCase()
      );

      return { success: true, data: { available: !exists } };
    }

    return apiClient.get<ApiResponse<{ available: boolean }>>(`/empresas/check-subdomain/${subdomain}`);
  }
}

export const empresasService = new EmpresasService();
export default empresasService;

