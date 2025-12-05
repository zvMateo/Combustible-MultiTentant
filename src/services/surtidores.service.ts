// src/services/surtidores.service.ts
import type {
  Surtidor,
  SurtidorFormData,
  SurtidorConStats,
  SurtidorStats,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";
import { apiClient } from "./api.client";

/**
 * Mock data
 */
const MOCK_SURTIDORES: SurtidorConStats[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Surtidor Centro",
    codigo: "SUR-001",
    tipo: "fijo",
    ubicacion: "Córdoba Capital",
    latitud: -31.4201,
    longitud: -64.1888,
    capacidad: 5000,
    stockActual: 3500,
    estado: "activo",
    proveedor: "YPF",
    activo: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-12-01T15:30:00Z",
    stats: {
      totalLitros: 45000,
      totalEventos: 850,
      litrosHoy: 450,
      litrosSemana: 2800,
      litrosMes: 12000,
      promedioLitrosPorEvento: 52.9,
    },
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Surtidor Norte",
    codigo: "SUR-002",
    tipo: "fijo",
    ubicacion: "Zona Norte",
    latitud: -31.3801,
    longitud: -64.2088,
    capacidad: 3000,
    stockActual: 1800,
    estado: "activo",
    proveedor: "Shell",
    activo: true,
    createdAt: "2024-03-20T08:00:00Z",
    updatedAt: "2024-12-02T10:15:00Z",
    stats: {
      totalLitros: 28000,
      totalEventos: 520,
      litrosHoy: 280,
      litrosSemana: 1900,
      litrosMes: 8500,
      promedioLitrosPorEvento: 53.8,
    },
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Tanque Móvil 01",
    codigo: "TAN-001",
    tipo: "movil",
    ubicacion: "Campo Sur",
    capacidad: 1000,
    stockActual: 650,
    estado: "activo",
    activo: true,
    createdAt: "2024-06-10T12:00:00Z",
    updatedAt: "2024-12-01T09:00:00Z",
    stats: {
      totalLitros: 15000,
      totalEventos: 180,
      litrosHoy: 120,
      litrosSemana: 850,
      litrosMes: 3500,
      promedioLitrosPorEvento: 83.3,
    },
  },
];

const USE_MOCK = true;

class SurtidoresService {
  private mockData = [...MOCK_SURTIDORES];

  /**
   * Listar surtidores
   */
  async list(
    empresaId: number,
    params?: PaginationParams & { search?: string; tipo?: string; estado?: string }
  ): Promise<PaginatedResponse<SurtidorConStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = this.mockData.filter((s) => s.empresaId === empresaId);

      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.nombre.toLowerCase().includes(search) ||
            s.codigo?.toLowerCase().includes(search) ||
            s.ubicacion.toLowerCase().includes(search)
        );
      }
      if (params?.tipo) {
        filtered = filtered.filter((s) => s.tipo === params.tipo);
      }
      if (params?.estado) {
        filtered = filtered.filter((s) => s.estado === params.estado);
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

    return apiClient.get<PaginatedResponse<SurtidorConStats>>(`/empresas/${empresaId}/surtidores`, params);
  }

  /**
   * Obtener surtidor por ID
   */
  async getById(id: number): Promise<ApiResponse<SurtidorConStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const surtidor = this.mockData.find((s) => s.id === id);
      if (!surtidor) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Surtidor no encontrado" } };
      }

      return { success: true, data: surtidor };
    }

    return apiClient.get<ApiResponse<SurtidorConStats>>(`/surtidores/${id}`);
  }

  /**
   * Crear surtidor
   */
  async create(empresaId: number, data: SurtidorFormData): Promise<ApiResponse<Surtidor>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newSurtidor: SurtidorConStats = {
        id: Math.max(...this.mockData.map((s) => s.id), 0) + 1,
        empresaId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          totalLitros: 0,
          totalEventos: 0,
          litrosHoy: 0,
          litrosSemana: 0,
          litrosMes: 0,
          promedioLitrosPorEvento: 0,
        },
      };

      this.mockData.push(newSurtidor);
      return { success: true, data: newSurtidor, message: "Surtidor creado exitosamente" };
    }

    return apiClient.post<ApiResponse<Surtidor>>(`/empresas/${empresaId}/surtidores`, data);
  }

  /**
   * Actualizar surtidor
   */
  async update(id: number, data: Partial<SurtidorFormData>): Promise<ApiResponse<Surtidor>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((s) => s.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Surtidor no encontrado" } };
      }

      this.mockData[index] = {
        ...this.mockData[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return { success: true, data: this.mockData[index], message: "Surtidor actualizado" };
    }

    return apiClient.put<ApiResponse<Surtidor>>(`/surtidores/${id}`, data);
  }

  /**
   * Eliminar surtidor
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((s) => s.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Surtidor no encontrado" } };
      }

      this.mockData.splice(index, 1);
      return { success: true, data: undefined, message: "Surtidor eliminado" };
    }

    return apiClient.delete<ApiResponse<void>>(`/surtidores/${id}`);
  }

  /**
   * Obtener estadísticas del surtidor
   */
  async getStats(id: number): Promise<ApiResponse<SurtidorStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const surtidor = this.mockData.find((s) => s.id === id);
      if (!surtidor) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Surtidor no encontrado" } };
      }

      return { success: true, data: surtidor.stats };
    }

    return apiClient.get<ApiResponse<SurtidorStats>>(`/surtidores/${id}/stats`);
  }
}

export const surtidoresService = new SurtidoresService();
export default surtidoresService;

