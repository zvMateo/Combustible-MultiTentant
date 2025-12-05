// src/hooks/queries/useReportes.ts
import { useQuery } from "@tanstack/react-query";
import { reportesService } from "@/services";
import type { ReporteFiltersBase } from "@/types";

export const reportesKeys = {
  all: ["reportes"] as const,
  kpis: (empresaId: number) => [...reportesKeys.all, "kpis", empresaId] as const,
  consumoVehiculos: (empresaId: number, filters?: ReporteFiltersBase) =>
    [...reportesKeys.all, "consumo-vehiculos", empresaId, filters] as const,
  litrosSurtidor: (empresaId: number, filters?: ReporteFiltersBase) =>
    [...reportesKeys.all, "litros-surtidor", empresaId, filters] as const,
  litrosOperador: (empresaId: number, filters?: ReporteFiltersBase) =>
    [...reportesKeys.all, "litros-operador", empresaId, filters] as const,
  costoCentroCosto: (empresaId: number, filters?: ReporteFiltersBase) =>
    [...reportesKeys.all, "costo-centro", empresaId, filters] as const,
  desvios: (empresaId: number, filters?: ReporteFiltersBase) =>
    [...reportesKeys.all, "desvios", empresaId, filters] as const,
  rankingEficiencia: (empresaId: number, filters?: ReporteFiltersBase) =>
    [...reportesKeys.all, "ranking-eficiencia", empresaId, filters] as const,
};

export function useReportesKPIs(empresaId: number) {
  return useQuery({
    queryKey: reportesKeys.kpis(empresaId),
    queryFn: () => reportesService.getKPIs(empresaId),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useConsumoVehiculos(empresaId: number, filters?: ReporteFiltersBase) {
  return useQuery({
    queryKey: reportesKeys.consumoVehiculos(empresaId, filters),
    queryFn: () => reportesService.getConsumoVehiculos(empresaId, filters),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLitrosSurtidor(empresaId: number, filters?: ReporteFiltersBase) {
  return useQuery({
    queryKey: reportesKeys.litrosSurtidor(empresaId, filters),
    queryFn: () => reportesService.getLitrosSurtidor(empresaId, filters),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLitrosOperador(empresaId: number, filters?: ReporteFiltersBase) {
  return useQuery({
    queryKey: reportesKeys.litrosOperador(empresaId, filters),
    queryFn: () => reportesService.getLitrosOperador(empresaId, filters),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCostoCentroCosto(empresaId: number, filters?: ReporteFiltersBase) {
  return useQuery({
    queryKey: reportesKeys.costoCentroCosto(empresaId, filters),
    queryFn: () => reportesService.getCostoCentroCosto(empresaId, filters),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDesvios(empresaId: number, filters?: ReporteFiltersBase) {
  return useQuery({
    queryKey: reportesKeys.desvios(empresaId, filters),
    queryFn: () => reportesService.getDesvios(empresaId, filters),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRankingEficiencia(empresaId: number, filters?: ReporteFiltersBase) {
  return useQuery({
    queryKey: reportesKeys.rankingEficiencia(empresaId, filters),
    queryFn: () => reportesService.getRankingEficiencia(empresaId, filters),
    enabled: empresaId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

