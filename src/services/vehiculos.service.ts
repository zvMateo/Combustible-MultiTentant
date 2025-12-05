// src/services/vehiculos.service.ts
import type {
  Vehiculo,
  VehiculoFormData,
  VehiculoConStats,
  VehiculoStats,
  VehiculoFilters,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types";
import { apiClient } from "./api.client";

/**
 * Mock data - Vehículos asignados a diferentes unidades
 */
const MOCK_VEHICULOS: VehiculoConStats[] = [
  // Vehículos de Campo Norte (unidadId: 1)
  {
    id: 1,
    empresaId: 1,
    unidadId: 1,
    unidadNombre: "Campo Norte",
    patente: "ABC123",
    marca: "Ford",
    modelo: "Cargo 1722",
    anio: 2020,
    tipo: "camion",
    tipoCombustible: "diesel",
    capacidadTanque: 300,
    kmActual: 125000,
    consumoPromedio: 4.5,
    estado: "activo",
    choferAsignadoId: 1,
    activo: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-12-01T15:30:00Z",
    stats: {
      totalLitros: 15000,
      totalCosto: 12750000,
      totalEventos: 250,
      ultimaCarga: "2024-12-04T10:30:00Z",
      consumoPromedio: 4.5,
      eficienciaKmPorLitro: 8.3,
    },
    choferNombre: "Juan Pérez",
  },
  {
    id: 3,
    empresaId: 1,
    unidadId: 1,
    unidadNombre: "Campo Norte",
    patente: "AAA111",
    marca: "John Deere",
    modelo: "6130J",
    anio: 2021,
    tipo: "tractor",
    tipoCombustible: "diesel",
    capacidadTanque: 200,
    horasActual: 3500,
    consumoPromedio: 12,
    estado: "activo",
    activo: true,
    createdAt: "2024-02-10T12:00:00Z",
    updatedAt: "2024-12-01T09:00:00Z",
    stats: {
      totalLitros: 42000,
      totalCosto: 35700000,
      totalEventos: 350,
      ultimaCarga: "2024-12-04T08:00:00Z",
      consumoPromedio: 12,
      eficienciaLitrosPorHora: 12,
    },
  },
  // Vehículos de Campo Sur (unidadId: 2)
  {
    id: 2,
    empresaId: 1,
    unidadId: 2,
    unidadNombre: "Campo Sur",
    patente: "XYZ789",
    marca: "Toyota",
    modelo: "Hilux",
    anio: 2022,
    tipo: "pickup",
    tipoCombustible: "diesel",
    capacidadTanque: 80,
    kmActual: 45000,
    consumoPromedio: 8.5,
    estado: "activo",
    choferAsignadoId: 2,
    activo: true,
    createdAt: "2024-03-20T08:00:00Z",
    updatedAt: "2024-12-02T10:15:00Z",
    stats: {
      totalLitros: 5200,
      totalCosto: 4420000,
      totalEventos: 85,
      ultimaCarga: "2024-12-03T14:45:00Z",
      consumoPromedio: 8.5,
      eficienciaKmPorLitro: 11.8,
    },
    choferNombre: "María García",
  },
  {
    id: 4,
    empresaId: 1,
    unidadId: 2,
    unidadNombre: "Campo Sur",
    patente: "DEF456",
    marca: "Massey Ferguson",
    modelo: "MF 4708",
    anio: 2023,
    tipo: "tractor",
    tipoCombustible: "diesel",
    capacidadTanque: 180,
    horasActual: 1200,
    consumoPromedio: 10,
    estado: "activo",
    activo: true,
    createdAt: "2024-05-15T08:00:00Z",
    updatedAt: "2024-12-01T11:00:00Z",
    stats: {
      totalLitros: 12000,
      totalCosto: 10200000,
      totalEventos: 120,
      ultimaCarga: "2024-12-04T07:00:00Z",
      consumoPromedio: 10,
      eficienciaLitrosPorHora: 10,
    },
  },
];

const USE_MOCK = true;

class VehiculosService {
  private mockData = [...MOCK_VEHICULOS];

  /**
   * Listar vehículos con filtro por unidad
   */
  async list(
    empresaId: number,
    params?: PaginationParams & VehiculoFilters
  ): Promise<PaginatedResponse<VehiculoConStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = this.mockData.filter((v) => v.empresaId === empresaId);

      // Filtrar por unidad de negocio
      if (params?.unidadId) {
        filtered = filtered.filter((v) => v.unidadId === params.unidadId);
      }

      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.patente.toLowerCase().includes(search) ||
            v.marca.toLowerCase().includes(search) ||
            v.modelo.toLowerCase().includes(search)
        );
      }
      if (params?.tipo) {
        filtered = filtered.filter((v) => v.tipo === params.tipo);
      }
      if (params?.estado) {
        filtered = filtered.filter((v) => v.estado === params.estado);
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

    return apiClient.get<PaginatedResponse<VehiculoConStats>>(`/empresas/${empresaId}/vehiculos`, params);
  }

  /**
   * Obtener vehículo por ID
   */
  async getById(id: number): Promise<ApiResponse<VehiculoConStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const vehiculo = this.mockData.find((v) => v.id === id);
      if (!vehiculo) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Vehículo no encontrado" } };
      }

      return { success: true, data: vehiculo };
    }

    return apiClient.get<ApiResponse<VehiculoConStats>>(`/vehiculos/${id}`);
  }

  /**
   * Crear vehículo
   */
  async create(empresaId: number, data: VehiculoFormData): Promise<ApiResponse<Vehiculo>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newVehiculo: VehiculoConStats = {
        id: Math.max(...this.mockData.map((v) => v.id), 0) + 1,
        empresaId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          totalLitros: 0,
          totalCosto: 0,
          totalEventos: 0,
          consumoPromedio: 0,
        },
      };

      this.mockData.push(newVehiculo);
      return { success: true, data: newVehiculo, message: "Vehículo creado exitosamente" };
    }

    return apiClient.post<ApiResponse<Vehiculo>>(`/empresas/${empresaId}/vehiculos`, data);
  }

  /**
   * Actualizar vehículo
   */
  async update(id: number, data: Partial<VehiculoFormData>): Promise<ApiResponse<Vehiculo>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((v) => v.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Vehículo no encontrado" } };
      }

      this.mockData[index] = {
        ...this.mockData[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return { success: true, data: this.mockData[index], message: "Vehículo actualizado" };
    }

    return apiClient.put<ApiResponse<Vehiculo>>(`/vehiculos/${id}`, data);
  }

  /**
   * Eliminar vehículo
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((v) => v.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Vehículo no encontrado" } };
      }

      this.mockData.splice(index, 1);
      return { success: true, data: undefined, message: "Vehículo eliminado" };
    }

    return apiClient.delete<ApiResponse<void>>(`/vehiculos/${id}`);
  }

  /**
   * Obtener estadísticas del vehículo
   */
  async getStats(id: number): Promise<ApiResponse<VehiculoStats>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const vehiculo = this.mockData.find((v) => v.id === id);
      if (!vehiculo) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Vehículo no encontrado" } };
      }

      return { success: true, data: vehiculo.stats };
    }

    return apiClient.get<ApiResponse<VehiculoStats>>(`/vehiculos/${id}/stats`);
  }

  /**
   * Asignar chofer a vehículo
   */
  async asignarChofer(vehiculoId: number, choferId: number | null): Promise<ApiResponse<Vehiculo>> {
    return this.update(vehiculoId, { choferAsignadoId: choferId || undefined });
  }
}

export const vehiculosService = new VehiculosService();
export default vehiculosService;

