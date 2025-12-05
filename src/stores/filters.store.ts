// src/stores/filters.store.ts
import { create } from "zustand";
import type { EstadoEvento, PeriodoReporte } from "@/types";

interface EventosFilters {
  search: string;
  estado: EstadoEvento | "todos";
  vehiculoId: number | null;
  choferId: number | null;
  surtidorId: number | null;
  fechaDesde: string;
  fechaHasta: string;
}

interface ReportesFilters {
  periodo: PeriodoReporte;
  fechaDesde: string;
  fechaHasta: string;
  vehiculoId: number | null;
  choferId: number | null;
  centroCostoId: number | null;
}

interface FiltersState {
  // Filtros de eventos
  eventosFilters: EventosFilters;
  setEventosFilters: (filters: Partial<EventosFilters>) => void;
  resetEventosFilters: () => void;

  // Filtros de reportes
  reportesFilters: ReportesFilters;
  setReportesFilters: (filters: Partial<ReportesFilters>) => void;
  resetReportesFilters: () => void;

  // Búsqueda global
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
}

const defaultEventosFilters: EventosFilters = {
  search: "",
  estado: "todos",
  vehiculoId: null,
  choferId: null,
  surtidorId: null,
  fechaDesde: "",
  fechaHasta: "",
};

const defaultReportesFilters: ReportesFilters = {
  periodo: "mes",
  fechaDesde: "",
  fechaHasta: "",
  vehiculoId: null,
  choferId: null,
  centroCostoId: null,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  // Eventos
  eventosFilters: defaultEventosFilters,
  setEventosFilters: (filters) =>
    set((state) => ({
      eventosFilters: { ...state.eventosFilters, ...filters },
    })),
  resetEventosFilters: () => set({ eventosFilters: defaultEventosFilters }),

  // Reportes
  reportesFilters: defaultReportesFilters,
  setReportesFilters: (filters) =>
    set((state) => ({
      reportesFilters: { ...state.reportesFilters, ...filters },
    })),
  resetReportesFilters: () => set({ reportesFilters: defaultReportesFilters }),

  // Global
  globalSearch: "",
  setGlobalSearch: (search) => set({ globalSearch: search }),
}));

// Selector hooks
export const useEventosFilters = () => useFiltersStore((state) => state.eventosFilters);
export const useReportesFilters = () => useFiltersStore((state) => state.reportesFilters);
export const useGlobalSearch = () => useFiltersStore((state) => state.globalSearch);

