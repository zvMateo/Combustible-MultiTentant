// src/services/alertas.service.ts
import type {
  Alerta,
  AlertaFilters,
  AlertasResumen,
  ResolverAlertaData,
  ApiResponse,
  PaginatedResponse,
} from "@/types";
import { apiClient } from "./api.client";

const MOCK_ALERTAS: Alerta[] = [
  {
    id: 1,
    empresaId: 1,
    tipo: "exceso_litros",
    severidad: "alta",
    estado: "abierta",
    titulo: "Carga excesiva detectada",
    descripcion: "El evento #3 registra 220L, superando el umbral de 200L",
    eventoId: 3,
    vehiculoId: 3,
    createdAt: "2024-12-03T08:45:00Z",
    updatedAt: "2024-12-03T08:45:00Z",
  },
  {
    id: 2,
    empresaId: 1,
    tipo: "tanque_bajo",
    severidad: "media",
    estado: "abierta",
    titulo: "Stock bajo en tanque",
    descripcion: "Tanque Auxiliar Norte tiene solo 1200L (24% de capacidad)",
    tanqueId: 2,
    createdAt: "2024-12-02T10:15:00Z",
    updatedAt: "2024-12-02T10:15:00Z",
  },
];

const USE_MOCK = true;

class AlertasService {
  private mockData = [...MOCK_ALERTAS];

  async list(filters?: AlertaFilters): Promise<PaginatedResponse<Alerta>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      let filtered = [...this.mockData];
      if (filters?.empresaId)
        filtered = filtered.filter((a) => a.empresaId === filters.empresaId);
      if (filters?.estado)
        filtered = filtered.filter((a) => a.estado === filters.estado);
      if (filters?.severidad)
        filtered = filtered.filter((a) => a.severidad === filters.severidad);

      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      return {
        success: true,
        data: filtered.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    return apiClient.get<PaginatedResponse<Alerta>>("/alertas", filters);
  }

  async getResumen(empresaId?: number): Promise<ApiResponse<AlertasResumen>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const alertas = empresaId
        ? this.mockData.filter((a) => a.empresaId === empresaId)
        : this.mockData;
      return {
        success: true,
        data: {
          total: alertas.length,
          abiertas: alertas.filter((a) => a.estado === "abierta").length,
          criticas: alertas.filter((a) => a.severidad === "critica").length,
          altas: alertas.filter((a) => a.severidad === "alta").length,
          medias: alertas.filter((a) => a.severidad === "media").length,
          bajas: alertas.filter((a) => a.severidad === "baja").length,
        },
      };
    }
    return apiClient.get<ApiResponse<AlertasResumen>>("/alertas/resumen", {
      empresaId,
    });
  }

  async resolver(data: ResolverAlertaData): Promise<ApiResponse<Alerta>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      const index = this.mockData.findIndex((a) => a.id === data.alertaId);
      if (index === -1)
        throw {
          success: false,
          error: { code: "NOT_FOUND", message: "Alerta no encontrada" },
        };

      this.mockData[index] = {
        ...this.mockData[index],
        estado: data.accion === "resolver" ? "resuelta" : "ignorada",
        resolucion: data.resolucion,
        resueltaAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        success: true,
        data: this.mockData[index],
        message: "Alerta resuelta",
      };
    }
    return apiClient.post<ApiResponse<Alerta>>(
      `/alertas/${data.alertaId}/resolver`,
      data
    );
  }
}

export const alertasService = new AlertasService();
export default alertasService;
