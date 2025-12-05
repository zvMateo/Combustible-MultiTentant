// src/services/tanques.service.ts
import type {
  Tanque,
  TanqueFormData,
  TanqueMovimiento,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";
import { apiClient } from "./api.client";

/**
 * Mock data
 */
const MOCK_TANQUES: Tanque[] = [
  {
    id: 1,
    empresaId: 1,
    nombre: "Tanque Principal",
    codigo: "TQ-001",
    tipo: "principal",
    capacidad: 10000,
    stockActual: 7500,
    stockMinimo: 2000,
    ubicacion: "Depósito Central",
    latitud: -31.4201,
    longitud: -64.1888,
    estado: "operativo",
    proveedor: "YPF",
    ultimaRecarga: "2024-12-01T08:00:00Z",
    activo: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-12-01T15:30:00Z",
  },
  {
    id: 2,
    empresaId: 1,
    nombre: "Tanque Auxiliar Norte",
    codigo: "TQ-002",
    tipo: "auxiliar",
    capacidad: 5000,
    stockActual: 1200,
    stockMinimo: 1000,
    ubicacion: "Zona Norte",
    estado: "operativo",
    activo: true,
    createdAt: "2024-03-20T08:00:00Z",
    updatedAt: "2024-12-02T10:15:00Z",
  },
  {
    id: 3,
    empresaId: 1,
    nombre: "Tanque Reserva",
    codigo: "TQ-003",
    tipo: "reserva",
    capacidad: 3000,
    stockActual: 2800,
    stockMinimo: 500,
    ubicacion: "Depósito Central",
    estado: "operativo",
    activo: true,
    createdAt: "2024-06-10T12:00:00Z",
    updatedAt: "2024-12-01T09:00:00Z",
  },
];

const USE_MOCK = true;

class TanquesService {
  private mockData = [...MOCK_TANQUES];

  /**
   * Listar tanques
   */
  async list(
    empresaId: number,
    params?: PaginationParams & { search?: string; tipo?: string; estado?: string }
  ): Promise<PaginatedResponse<Tanque>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = this.mockData.filter((t) => t.empresaId === empresaId);

      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.nombre.toLowerCase().includes(search) ||
            t.codigo?.toLowerCase().includes(search) ||
            t.ubicacion.toLowerCase().includes(search)
        );
      }
      if (params?.tipo) {
        filtered = filtered.filter((t) => t.tipo === params.tipo);
      }
      if (params?.estado) {
        filtered = filtered.filter((t) => t.estado === params.estado);
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

    return apiClient.get<PaginatedResponse<Tanque>>(`/empresas/${empresaId}/tanques`, params);
  }

  /**
   * Obtener tanque por ID
   */
  async getById(id: number): Promise<ApiResponse<Tanque>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const tanque = this.mockData.find((t) => t.id === id);
      if (!tanque) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Tanque no encontrado" } };
      }

      return { success: true, data: tanque };
    }

    return apiClient.get<ApiResponse<Tanque>>(`/tanques/${id}`);
  }

  /**
   * Crear tanque
   */
  async create(empresaId: number, data: TanqueFormData): Promise<ApiResponse<Tanque>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newTanque: Tanque = {
        id: Math.max(...this.mockData.map((t) => t.id), 0) + 1,
        empresaId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.mockData.push(newTanque);
      return { success: true, data: newTanque, message: "Tanque creado exitosamente" };
    }

    return apiClient.post<ApiResponse<Tanque>>(`/empresas/${empresaId}/tanques`, data);
  }

  /**
   * Actualizar tanque
   */
  async update(id: number, data: Partial<TanqueFormData>): Promise<ApiResponse<Tanque>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((t) => t.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Tanque no encontrado" } };
      }

      this.mockData[index] = {
        ...this.mockData[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return { success: true, data: this.mockData[index], message: "Tanque actualizado" };
    }

    return apiClient.put<ApiResponse<Tanque>>(`/tanques/${id}`, data);
  }

  /**
   * Eliminar tanque
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((t) => t.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Tanque no encontrado" } };
      }

      this.mockData.splice(index, 1);
      return { success: true, data: undefined, message: "Tanque eliminado" };
    }

    return apiClient.delete<ApiResponse<void>>(`/tanques/${id}`);
  }

  /**
   * Registrar movimiento de stock
   */
  async registrarMovimiento(
    tanqueId: number,
    tipo: "ingreso" | "egreso" | "ajuste",
    litros: number,
    observaciones?: string
  ): Promise<ApiResponse<TanqueMovimiento>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const tanque = this.mockData.find((t) => t.id === tanqueId);
      if (!tanque) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Tanque no encontrado" } };
      }

      const stockAnterior = tanque.stockActual;
      let stockPosterior = stockAnterior;

      if (tipo === "ingreso") {
        stockPosterior = stockAnterior + litros;
      } else if (tipo === "egreso") {
        stockPosterior = stockAnterior - litros;
      } else {
        stockPosterior = litros;
      }

      // Actualizar stock del tanque
      tanque.stockActual = stockPosterior;
      tanque.updatedAt = new Date().toISOString();
      if (tipo === "ingreso") {
        tanque.ultimaRecarga = new Date().toISOString();
      }

      const movimiento: TanqueMovimiento = {
        id: Math.floor(Math.random() * 10000),
        tanqueId,
        tipo,
        litros,
        stockAnterior,
        stockPosterior,
        observaciones,
        userId: 1,
        createdAt: new Date().toISOString(),
      };

      return { success: true, data: movimiento, message: "Movimiento registrado" };
    }

    return apiClient.post<ApiResponse<TanqueMovimiento>>(`/tanques/${tanqueId}/movimientos`, {
      tipo,
      litros,
      observaciones,
    });
  }

  /**
   * Obtener historial de movimientos
   */
  async getMovimientos(
    tanqueId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<TanqueMovimiento>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Mock de movimientos
      const movimientos: TanqueMovimiento[] = [
        {
          id: 1,
          tanqueId,
          tipo: "ingreso",
          litros: 5000,
          stockAnterior: 2500,
          stockPosterior: 7500,
          userId: 1,
          observaciones: "Recarga mensual",
          createdAt: "2024-12-01T08:00:00Z",
        },
        {
          id: 2,
          tanqueId,
          tipo: "egreso",
          litros: 150,
          stockAnterior: 7500,
          stockPosterior: 7350,
          eventoId: 1,
          userId: 1,
          createdAt: "2024-12-01T10:30:00Z",
        },
      ];

      return {
        success: true,
        data: movimientos,
        pagination: {
          page: 1,
          limit: 20,
          total: movimientos.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    return apiClient.get<PaginatedResponse<TanqueMovimiento>>(
      `/tanques/${tanqueId}/movimientos`,
      params
    );
  }

  /**
   * Obtener tanques con stock bajo
   */
  getTanquesStockBajo(tanques: Tanque[]): Tanque[] {
    return tanques.filter((t) => t.stockActual <= t.stockMinimo);
  }
}

export const tanquesService = new TanquesService();
export default tanquesService;

