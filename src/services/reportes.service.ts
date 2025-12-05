// src/services/reportes.service.ts
import type {
  ReporteFiltersBase,
  ConsumoVehiculoData,
  LitrosSurtidorData,
  LitrosOperadorData,
  CostoCentroCostoData,
  DesvioData,
  RankingEficienciaData,
  ReportesKPIs,
  ApiResponse,
} from "@/types";
import { apiClient } from "./api.client";

const USE_MOCK = true;

class ReportesService {
  async getKPIs(empresaId: number): Promise<ApiResponse<ReportesKPIs>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      return {
        success: true,
        data: {
          litrosTotales: 85000,
          costoTotal: 72250000,
          totalEventos: 1580,
          eventosValidados: 1420,
          eventosPendientes: 120,
          eventosRechazados: 40,
          vehiculosActivos: 24,
          alertasAbiertas: 5,
          eficienciaPromedio: 8.5,
          consumoPromedioDiario: 2850,
          tendenciaConsumo: 5.2,
          tendenciaCosto: 3.8,
        },
      };
    }
    return apiClient.get<ApiResponse<ReportesKPIs>>(`/empresas/${empresaId}/reportes/kpis`);
  }

  async getConsumoVehiculos(empresaId: number, filters?: ReporteFiltersBase): Promise<ApiResponse<ConsumoVehiculoData[]>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        success: true,
        data: [
          { vehiculoId: 1, vehiculoPatente: "ABC123", vehiculoTipo: "Camión", litrosTotales: 15000, costoTotal: 12750000, numeroEventos: 250, eficienciaKmPorLitro: 8.3, consumoPromedioPorEvento: 60 },
          { vehiculoId: 2, vehiculoPatente: "XYZ789", vehiculoTipo: "Pickup", litrosTotales: 5200, costoTotal: 4420000, numeroEventos: 85, eficienciaKmPorLitro: 11.8, consumoPromedioPorEvento: 61 },
          { vehiculoId: 3, vehiculoPatente: "AAA111", vehiculoTipo: "Tractor", litrosTotales: 42000, costoTotal: 35700000, numeroEventos: 350, eficienciaLitrosPorHora: 12, consumoPromedioPorEvento: 120 },
        ],
      };
    }
    return apiClient.get<ApiResponse<ConsumoVehiculoData[]>>(`/empresas/${empresaId}/reportes/consumo-vehiculos`, filters);
  }

  async getLitrosSurtidor(empresaId: number, filters?: ReporteFiltersBase): Promise<ApiResponse<LitrosSurtidorData[]>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        success: true,
        data: [
          { surtidorId: 1, surtidorNombre: "Surtidor Centro", surtidorUbicacion: "Córdoba", litrosTotales: 45000, costoTotal: 38250000, numeroEventos: 850, porcentajeTotal: 52.9 },
          { surtidorId: 2, surtidorNombre: "Surtidor Norte", surtidorUbicacion: "Zona Norte", litrosTotales: 28000, costoTotal: 23800000, numeroEventos: 520, porcentajeTotal: 32.9 },
          { surtidorId: 3, surtidorNombre: "Tanque Móvil", surtidorUbicacion: "Campo Sur", litrosTotales: 12000, costoTotal: 10200000, numeroEventos: 180, porcentajeTotal: 14.2 },
        ],
      };
    }
    return apiClient.get<ApiResponse<LitrosSurtidorData[]>>(`/empresas/${empresaId}/reportes/litros-surtidor`, filters);
  }

  async getLitrosOperador(empresaId: number, filters?: ReporteFiltersBase): Promise<ApiResponse<LitrosOperadorData[]>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        success: true,
        data: [
          { choferId: 1, choferNombre: "Juan", choferApellido: "Pérez", litrosTotales: 15000, costoTotal: 12750000, numeroEventos: 250, vehiculosMasUsados: ["ABC123"], eficienciaPromedio: 8.3 },
          { choferId: 2, choferNombre: "María", choferApellido: "González", litrosTotales: 5200, costoTotal: 4420000, numeroEventos: 85, vehiculosMasUsados: ["XYZ789"], eficienciaPromedio: 11.8 },
          { choferId: 3, choferNombre: "Carlos", choferApellido: "López", litrosTotales: 8500, costoTotal: 7225000, numeroEventos: 120, vehiculosMasUsados: ["AAA111"], eficienciaPromedio: 7.2 },
        ],
      };
    }
    return apiClient.get<ApiResponse<LitrosOperadorData[]>>(`/empresas/${empresaId}/reportes/litros-operador`, filters);
  }

  async getCostoCentroCosto(empresaId: number, filters?: ReporteFiltersBase): Promise<ApiResponse<CostoCentroCostoData[]>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        success: true,
        data: [
          { centroCostoId: 1, centroCostoCodigo: "LOTE-001", centroCostoNombre: "Lote Norte", centroCostoTipo: "Lote", litrosTotales: 25000, costoTotal: 21250000, numeroEventos: 450, vehiculosAsignados: 5, porcentajePresupuesto: 71.4 },
          { centroCostoId: 2, centroCostoCodigo: "LOTE-002", centroCostoNombre: "Lote Sur", centroCostoTipo: "Lote", litrosTotales: 18000, costoTotal: 15300000, numeroEventos: 320, vehiculosAsignados: 3, porcentajePresupuesto: 63.75 },
        ],
      };
    }
    return apiClient.get<ApiResponse<CostoCentroCostoData[]>>(`/empresas/${empresaId}/reportes/costo-centro`, filters);
  }

  async getDesvios(empresaId: number, filters?: ReporteFiltersBase): Promise<ApiResponse<DesvioData[]>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        success: true,
        data: [
          { eventoId: 3, fecha: "2024-12-03", vehiculoPatente: "AAA111", choferNombre: "Carlos López", litros: 220, tipoDesvio: "exceso", severidad: "alta", descripcion: "Carga excesiva (>200L)", resuelto: false },
          { eventoId: 15, fecha: "2024-12-02", vehiculoPatente: "XYZ789", choferNombre: "María González", litros: 45, tipoDesvio: "falta-evidencia", severidad: "media", descripcion: "Sin foto de odómetro", resuelto: true },
        ],
      };
    }
    return apiClient.get<ApiResponse<DesvioData[]>>(`/empresas/${empresaId}/reportes/desvios`, filters);
  }

  async getRankingEficiencia(empresaId: number, filters?: ReporteFiltersBase): Promise<ApiResponse<RankingEficienciaData[]>> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        success: true,
        data: [
          { posicion: 1, vehiculoId: 2, vehiculoPatente: "XYZ789", vehiculoTipo: "Pickup", eficiencia: 11.8, litrosTotales: 5200, tendencia: "mejorando", variacion: 8.5 },
          { posicion: 2, vehiculoId: 1, vehiculoPatente: "ABC123", vehiculoTipo: "Camión", eficiencia: 8.3, litrosTotales: 15000, tendencia: "estable", variacion: 0.2 },
          { posicion: 3, vehiculoId: 3, vehiculoPatente: "AAA111", vehiculoTipo: "Tractor", eficiencia: 6.8, litrosTotales: 42000, tendencia: "empeorando", variacion: -3.2 },
        ],
      };
    }
    return apiClient.get<ApiResponse<RankingEficienciaData[]>>(`/empresas/${empresaId}/reportes/ranking-eficiencia`, filters);
  }
}

export const reportesService = new ReportesService();
export default reportesService;

