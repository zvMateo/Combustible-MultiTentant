// src/services/centros-costo.service.ts
import type {
  CentroCosto,
  CentroCostoFormData,
  CentroCostoConStats,
  CentroCostoStats,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";
import { apiClient } from "./api.client";

/**
 * Mock data
 */
const MOCK_CENTROS_COSTO: CentroCostoConStats[] = [
  {
    id: 1,
    empresaId: 1,
    codigo: "LOTE-001",
    nombre: "Lote Norte",
    descripcion: "Lote de producción norte",
    tipo: "lote",
    presupuestoMensual: 500000,
    presupuestoAnual: 6000000,
    activo: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-12-01T15:30:00Z",
    stats: {
      totalLitros: 25000,
      totalCosto: 21250000,
      totalEventos: 450,
      vehiculosAsignados: 5,
      consumoMensual: 4200,
      costoMensual: 3570000,
      porcentajePresupuesto: 71.4,
    },
  },
  {
    id: 2,
    empresaId: 1,
    codigo: "LOTE-002",
    nombre: "Lote Sur",
    descripcion: "Lote de producción sur",
    tipo: "lote",
    presupuestoMensual: 400000,
    presupuestoAnual: 4800000,
    activo: true,
    createdAt: "2024-03-20T08:00:00Z",
    updatedAt: "2024-12-02T10:15:00Z",
    stats: {
      totalLitros: 18000,
      totalCosto: 15300000,
      totalEventos: 320,
      vehiculosAsignados: 3,
      consumoMensual: 3000,
      costoMensual: 2550000,
      porcentajePresupuesto: 63.75,
    },
  },
  {
    id: 3,
    empresaId: 1,
    codigo: "TRANS-001",
    nombre: "Transporte",
    descripcion: "Departamento de logística y transporte",
    tipo: "departamento",
    presupuestoMensual: 800000,
    presupuestoAnual: 9600000,
    activo: true,
    createdAt: "2024-02-10T12:00:00Z",
    updatedAt: "2024-12-01T09:00:00Z",
    stats: {
      totalLitros: 42000,
      totalCosto: 35700000,
      totalEventos: 780,
      vehiculosAsignados: 8,
      consumoMensual: 7000,
      costoMensual: 5950000,
      porcentajePresupuesto: 74.375,
    },
  },
];

const USE_MOCK = true;

class CentrosCostoService {
  private mockData = [...MOCK_CENTROS_COSTO];

  /**
   * Listar centros de costo
   */
  async list(
    empresaId: number,
    params?: PaginationParams & { search?: string; tipo?: string }
  ): Promise<PaginatedResponse<CentroCostoConStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = this.mockData.filter((c) => c.empresaId === empresaId);

      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.nombre.toLowerCase().includes(search) ||
            c.codigo.toLowerCase().includes(search)
        );
      }
      if (params?.tipo) {
        filtered = filtered.filter((c) => c.tipo === params.tipo);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const total = filtered.length;

      return {
        success: true,
        data: filtered.slice((page - 1) * limit, page * limit),
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

    return apiClient.get<PaginatedResponse<CentroCostoConStats>>(
      `/empresas/${empresaId}/centros-costo`,
      params
    );
  }

  /**
   * Obtener centro de costo por ID
   */
  async getById(id: number): Promise<ApiResponse<CentroCostoConStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const centro = this.mockData.find((c) => c.id === id);
      if (!centro) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Centro de costo no encontrado" } };
      }

      return { success: true, data: centro };
    }

    return apiClient.get<ApiResponse<CentroCostoConStats>>(`/centros-costo/${id}`);
  }

  /**
   * Crear centro de costo
   */
  async create(empresaId: number, data: CentroCostoFormData): Promise<ApiResponse<CentroCosto>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newCentro: CentroCostoConStats = {
        id: Math.max(...this.mockData.map((c) => c.id), 0) + 1,
        empresaId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          totalLitros: 0,
          totalCosto: 0,
          totalEventos: 0,
          vehiculosAsignados: 0,
          consumoMensual: 0,
          costoMensual: 0,
        },
      };

      this.mockData.push(newCentro);
      return { success: true, data: newCentro, message: "Centro de costo creado" };
    }

    return apiClient.post<ApiResponse<CentroCosto>>(`/empresas/${empresaId}/centros-costo`, data);
  }

  /**
   * Actualizar centro de costo
   */
  async update(id: number, data: Partial<CentroCostoFormData>): Promise<ApiResponse<CentroCosto>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((c) => c.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Centro de costo no encontrado" } };
      }

      this.mockData[index] = {
        ...this.mockData[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return { success: true, data: this.mockData[index], message: "Centro de costo actualizado" };
    }

    return apiClient.put<ApiResponse<CentroCosto>>(`/centros-costo/${id}`, data);
  }

  /**
   * Eliminar centro de costo
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((c) => c.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Centro de costo no encontrado" } };
      }

      this.mockData.splice(index, 1);
      return { success: true, data: undefined, message: "Centro de costo eliminado" };
    }

    return apiClient.delete<ApiResponse<void>>(`/centros-costo/${id}`);
  }

  /**
   * Obtener estadísticas del centro de costo
   */
  async getStats(id: number): Promise<ApiResponse<CentroCostoStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const centro = this.mockData.find((c) => c.id === id);
      if (!centro) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Centro de costo no encontrado" } };
      }

      return { success: true, data: centro.stats };
    }

    return apiClient.get<ApiResponse<CentroCostoStats>>(`/centros-costo/${id}/stats`);
  }

  /**
   * Obtener centros de costo que exceden presupuesto
   */
  getCentrosExcedenPresupuesto(centros: CentroCostoConStats[], umbral = 90): CentroCostoConStats[] {
    return centros.filter(
      (c) => c.stats.porcentajePresupuesto && c.stats.porcentajePresupuesto >= umbral
    );
  }
}

export const centrosCostoService = new CentrosCostoService();
export default centrosCostoService;

