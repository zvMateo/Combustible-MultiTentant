// src/services/eventos.service.ts
import type {
  Evento,
  EventoExpandido,
  EventoFormData,
  EventoFilters,
  ValidarEventoData,
  EventosResumen,
  ApiResponse,
  PaginatedResponse,
} from "@/types";
import { apiClient } from "./api.client";

/**
 * Mock data para desarrollo - Eventos asignados a diferentes unidades
 */
const MOCK_EVENTOS: EventoExpandido[] = [
  // Eventos de Campo Norte (unidadId: 1)
  {
    id: 1,
    empresaId: 1,
    unidadId: 1,
    unidadNombre: "Campo Norte",
    vehiculoId: 1,
    vehiculoPatente: "ABC123",
    vehiculoTipo: "Camión",
    choferId: 1,
    choferNombre: "Juan Pérez",
    surtidorId: 1,
    surtidorNombre: "Surtidor Norte",
    litros: 50,
    precio: 850,
    total: 42500,
    fecha: "2024-12-01",
    estado: "validado",
    origen: "whatsapp",
    activo: true,
    createdAt: "2024-12-01T10:30:00Z",
    updatedAt: "2024-12-01T11:00:00Z",
  },
  {
    id: 3,
    empresaId: 1,
    unidadId: 1,
    unidadNombre: "Campo Norte",
    vehiculoId: 3,
    vehiculoPatente: "AAA111",
    vehiculoTipo: "Tractor",
    choferId: 3,
    choferNombre: "Pedro López",
    surtidorId: 1,
    surtidorNombre: "Surtidor Norte",
    litros: 220,
    precio: 850,
    total: 187000,
    fecha: "2024-12-03",
    estado: "pendiente",
    origen: "whatsapp",
    observaciones: "Carga excesiva",
    activo: true,
    createdAt: "2024-12-03T08:45:00Z",
    updatedAt: "2024-12-03T08:45:00Z",
  },
  // Eventos de Campo Sur (unidadId: 2)
  {
    id: 2,
    empresaId: 1,
    unidadId: 2,
    unidadNombre: "Campo Sur",
    vehiculoId: 2,
    vehiculoPatente: "XYZ789",
    vehiculoTipo: "Pickup",
    choferId: 2,
    choferNombre: "María García",
    surtidorId: 2,
    surtidorNombre: "Surtidor Sur",
    litros: 35,
    precio: 850,
    total: 29750,
    fecha: "2024-12-02",
    estado: "pendiente",
    origen: "web",
    activo: true,
    createdAt: "2024-12-02T14:15:00Z",
    updatedAt: "2024-12-02T14:15:00Z",
  },
  {
    id: 4,
    empresaId: 1,
    unidadId: 2,
    unidadNombre: "Campo Sur",
    vehiculoId: 4,
    vehiculoPatente: "DEF456",
    vehiculoTipo: "Tractor",
    choferId: 5,
    choferNombre: "Ana Martínez",
    surtidorId: 2,
    surtidorNombre: "Surtidor Sur",
    litros: 150,
    precio: 850,
    total: 127500,
    fecha: "2024-12-04",
    estado: "validado",
    origen: "whatsapp",
    activo: true,
    createdAt: "2024-12-04T09:30:00Z",
    updatedAt: "2024-12-04T10:00:00Z",
  },
];

const USE_MOCK = true;

class EventosService {
  private mockData = [...MOCK_EVENTOS];

  /**
   * Listar eventos con filtros y paginación (incluyendo unidadId)
   */
  async list(filters?: EventoFilters): Promise<PaginatedResponse<EventoExpandido>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      let filtered = [...this.mockData];

      if (filters?.empresaId) {
        filtered = filtered.filter((e) => e.empresaId === filters.empresaId);
      }
      // Filtrar por unidad de negocio
      if (filters?.unidadId) {
        filtered = filtered.filter((e) => e.unidadId === filters.unidadId);
      }
      if (filters?.vehiculoId) {
        filtered = filtered.filter((e) => e.vehiculoId === filters.vehiculoId);
      }
      if (filters?.choferId) {
        filtered = filtered.filter((e) => e.choferId === filters.choferId);
      }
      if (filters?.estado) {
        filtered = filtered.filter((e) => e.estado === filters.estado);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.vehiculoPatente.toLowerCase().includes(search) ||
            e.choferNombre.toLowerCase().includes(search)
        );
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
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

    return apiClient.get<PaginatedResponse<EventoExpandido>>("/eventos", filters);
  }

  /**
   * Listar eventos pendientes de validación (con filtro de unidad)
   */
  async listPendientes(empresaId?: number, unidadId?: number): Promise<ApiResponse<EventoExpandido[]>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      let pendientes = this.mockData.filter((e) => e.estado === "pendiente");
      if (empresaId) {
        pendientes = pendientes.filter((e) => e.empresaId === empresaId);
      }
      // Filtrar por unidad de negocio
      if (unidadId) {
        pendientes = pendientes.filter((e) => e.unidadId === unidadId);
      }

      return { success: true, data: pendientes };
    }

    return apiClient.get<ApiResponse<EventoExpandido[]>>("/eventos/pendientes", { empresaId });
  }

  /**
   * Obtener evento por ID
   */
  async getById(id: number): Promise<ApiResponse<EventoExpandido>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const evento = this.mockData.find((e) => e.id === id);
      if (!evento) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Evento no encontrado" } };
      }

      return { success: true, data: evento };
    }

    return apiClient.get<ApiResponse<EventoExpandido>>(`/eventos/${id}`);
  }

  /**
   * Crear evento
   */
  async create(data: EventoFormData, empresaId: number): Promise<ApiResponse<Evento>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newEvento: EventoExpandido = {
        id: Math.max(...this.mockData.map((e) => e.id), 0) + 1,
        empresaId,
        ...data,
        total: data.litros * data.precio,
        estado: "pendiente",
        origen: "web",
        vehiculoPatente: "NEW123",
        choferNombre: "Nuevo Chofer",
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.mockData.push(newEvento);
      return { success: true, data: newEvento, message: "Evento creado exitosamente" };
    }

    return apiClient.post<ApiResponse<Evento>>("/eventos", { ...data, empresaId });
  }

  /**
   * Actualizar evento
   */
  async update(id: number, data: Partial<EventoFormData>): Promise<ApiResponse<Evento>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((e) => e.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Evento no encontrado" } };
      }

      this.mockData[index] = {
        ...this.mockData[index],
        ...data,
        total: (data.litros || this.mockData[index].litros) * (data.precio || this.mockData[index].precio),
        updatedAt: new Date().toISOString(),
      };

      return { success: true, data: this.mockData[index], message: "Evento actualizado" };
    }

    return apiClient.put<ApiResponse<Evento>>(`/eventos/${id}`, data);
  }

  /**
   * Eliminar evento
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((e) => e.id === id);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Evento no encontrado" } };
      }

      this.mockData.splice(index, 1);
      return { success: true, data: undefined, message: "Evento eliminado" };
    }

    return apiClient.delete<ApiResponse<void>>(`/eventos/${id}`);
  }

  /**
   * Validar evento
   */
  async validar(data: ValidarEventoData): Promise<ApiResponse<Evento>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = this.mockData.findIndex((e) => e.id === data.eventoId);
      if (index === -1) {
        throw { success: false, error: { code: "NOT_FOUND", message: "Evento no encontrado" } };
      }

      this.mockData[index] = {
        ...this.mockData[index],
        estado: data.accion === "validar" ? "validado" : "rechazado",
        motivoRechazo: data.motivo,
        validadoAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: this.mockData[index],
        message: data.accion === "validar" ? "Evento validado" : "Evento rechazado",
      };
    }

    return apiClient.post<ApiResponse<Evento>>(`/eventos/${data.eventoId}/validar`, data);
  }

  /**
   * Obtener resumen de eventos (con filtro de unidad)
   */
  async getResumen(empresaId?: number, unidadId?: number): Promise<ApiResponse<EventosResumen>> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      let eventos = [...this.mockData];
      if (empresaId) {
        eventos = eventos.filter((e) => e.empresaId === empresaId);
      }
      // Filtrar por unidad de negocio
      if (unidadId) {
        eventos = eventos.filter((e) => e.unidadId === unidadId);
      }

      const resumen: EventosResumen = {
        total: eventos.length,
        pendientes: eventos.filter((e) => e.estado === "pendiente").length,
        validados: eventos.filter((e) => e.estado === "validado").length,
        rechazados: eventos.filter((e) => e.estado === "rechazado").length,
        litrosTotales: eventos.reduce((sum, e) => sum + e.litros, 0),
        costoTotal: eventos.reduce((sum, e) => sum + e.total, 0),
        tendencia: 12.5,
      };

      return { success: true, data: resumen };
    }

    return apiClient.get<ApiResponse<EventosResumen>>("/eventos/resumen", { empresaId, unidadId });
  }
}

export const eventosService = new EventosService();
export default eventosService;

