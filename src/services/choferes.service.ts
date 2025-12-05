// src/services/choferes.service.ts
import type {
  Chofer,
  ChoferFormData,
  ChoferConStats,
  ChoferStats,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";
import { apiClient } from "./api.client";

/**
 * Mock data
 */
const MOCK_CHOFERES: ChoferConStats[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Juan",
    apellido: "Pérez",
    dni: "25456789",
    telefono: "+54 351 1234567",
    email: "juan.perez@empresa.com",
    whatsappNumber: "+5493511234567",
    licenciaTipo: "C",
    licenciaVencimiento: "2025-06-15",
    estado: "activo",
    vehiculoAsignadoId: 1,
    activo: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-12-01T15:30:00Z",
    stats: {
      totalEventos: 250,
      totalLitros: 15000,
      totalCosto: 12750000,
      eventosValidados: 240,
      eventosRechazados: 5,
      eventosPendientes: 5,
      vehiculosMasUsados: ["ABC123"],
      ultimaCarga: "2024-12-04T10:30:00Z",
    },
    vehiculoAsignadoPatente: "ABC123",
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "María",
    apellido: "González",
    dni: "30123456",
    telefono: "+54 351 7654321",
    email: "maria.gonzalez@empresa.com",
    whatsappNumber: "+5493517654321",
    licenciaTipo: "B",
    licenciaVencimiento: "2024-12-30",
    estado: "activo",
    vehiculoAsignadoId: 2,
    activo: true,
    createdAt: "2024-03-20T08:00:00Z",
    updatedAt: "2024-12-02T10:15:00Z",
    stats: {
      totalEventos: 85,
      totalLitros: 5200,
      totalCosto: 4420000,
      eventosValidados: 82,
      eventosRechazados: 2,
      eventosPendientes: 1,
      vehiculosMasUsados: ["XYZ789"],
      ultimaCarga: "2024-12-03T14:45:00Z",
    },
    vehiculoAsignadoPatente: "XYZ789",
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Carlos",
    apellido: "López",
    dni: "28987654",
    telefono: "+54 351 9876543",
    estado: "activo",
    activo: true,
    createdAt: "2024-02-10T12:00:00Z",
    updatedAt: "2024-12-01T09:00:00Z",
    stats: {
      totalEventos: 120,
      totalLitros: 8500,
      totalCosto: 7225000,
      eventosValidados: 115,
      eventosRechazados: 3,
      eventosPendientes: 2,
      vehiculosMasUsados: ["AAA111", "ABC123"],
      ultimaCarga: "2024-12-04T08:00:00Z",
    },
  },
];

const USE_MOCK = true;

class ChoferesService {
  private mockData = [...MOCK_CHOFERES];

  /**
   * Listar choferes
   */
  async list(
    empresaId: number,
    params?: PaginationParams & { search?: string; estado?: string }
  ): Promise<PaginatedResponse<ChoferConStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = this.mockData.filter((c) => c.empresaId === empresaId);

      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.nombre.toLowerCase().includes(search) ||
            c.apellido.toLowerCase().includes(search) ||
            c.dni.includes(search)
        );
      }
      if (params?.estado) {
        filtered = filtered.filter((c) => c.estado === params.estado);
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

    return apiClient.get<PaginatedResponse<ChoferConStats>>(`/empresas/${empresaId}/choferes`, params);
  }

  /**
   * Obtener chofer por ID
   */
  async getById(id: number): Promise<ApiResponse<ChoferConStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const chofer = this.mockData.find((c) => c.id === id);
      if (!chofer) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Chofer no encontrado" } };
      }

      return { success: true, data: chofer };
    }

    return apiClient.get<ApiResponse<ChoferConStats>>(`/choferes/${id}`);
  }

  /**
   * Crear chofer
   */
  async create(empresaId: number, data: ChoferFormData): Promise<ApiResponse<Chofer>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newChofer: ChoferConStats = {
        id: Math.max(...this.mockData.map((c) => c.id), 0) + 1,
        empresaId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          totalEventos: 0,
          totalLitros: 0,
          totalCosto: 0,
          eventosValidados: 0,
          eventosRechazados: 0,
          eventosPendientes: 0,
          vehiculosMasUsados: [],
        },
      };

      this.mockData.push(newChofer);
      return { success: true, data: newChofer, message: "Chofer creado exitosamente" };
    }

    return apiClient.post<ApiResponse<Chofer>>(`/empresas/${empresaId}/choferes`, data);
  }

  /**
   * Actualizar chofer
   */
  async update(id: number, data: Partial<ChoferFormData>): Promise<ApiResponse<Chofer>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((c) => c.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Chofer no encontrado" } };
      }

      this.mockData[index] = {
        ...this.mockData[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return { success: true, data: this.mockData[index], message: "Chofer actualizado" };
    }

    return apiClient.put<ApiResponse<Chofer>>(`/choferes/${id}`, data);
  }

  /**
   * Eliminar chofer
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((c) => c.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Chofer no encontrado" } };
      }

      this.mockData.splice(index, 1);
      return { success: true, data: undefined, message: "Chofer eliminado" };
    }

    return apiClient.delete<ApiResponse<void>>(`/choferes/${id}`);
  }

  /**
   * Obtener estadísticas del chofer
   */
  async getStats(id: number): Promise<ApiResponse<ChoferStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const chofer = this.mockData.find((c) => c.id === id);
      if (!chofer) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Chofer no encontrado" } };
      }

      return { success: true, data: chofer.stats };
    }

    return apiClient.get<ApiResponse<ChoferStats>>(`/choferes/${id}/stats`);
  }

  /**
   * Verificar licencia próxima a vencer
   */
  getLicenciasProximasAVencer(choferes: ChoferConStats[], diasAnticipacion = 30): ChoferConStats[] {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + diasAnticipacion);

    return choferes.filter((c) => {
      if (!c.licenciaVencimiento) return false;
      const vencimiento = new Date(c.licenciaVencimiento);
      return vencimiento <= limite && vencimiento >= hoy;
    });
  }
}

export const choferesService = new ChoferesService();
export default choferesService;

