// src/stores/unidad.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UnidadNegocio, UnidadNegocioResumen } from "@/types";

/**
 * Estado del store de Unidades de Negocio
 */
interface UnidadState {
  // Lista de unidades disponibles para el usuario
  unidades: UnidadNegocioResumen[];
  
  // Unidad actualmente seleccionada (null = "Todas" para admin)
  unidadActiva: UnidadNegocioResumen | null;
  
  // Estado de carga
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setUnidades: (unidades: UnidadNegocioResumen[]) => void;
  setUnidadActiva: (unidad: UnidadNegocioResumen | null) => void;
  clearUnidades: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUnidadStore = create<UnidadState>()(
  persist(
    (set) => ({
      // Estado inicial
      unidades: [],
      unidadActiva: null,
      isLoading: false,
      error: null,

      // Setear lista de unidades
      setUnidades: (unidades) => {
        set({ unidades, isLoading: false, error: null });
        
        // Si hay una sola unidad, seleccionarla automáticamente
        if (unidades.length === 1) {
          set({ unidadActiva: unidades[0] });
        }
      },

      // Cambiar unidad activa
      setUnidadActiva: (unidad) => {
        set({ unidadActiva: unidad });
      },

      // Limpiar (al logout)
      clearUnidades: () => {
        set({
          unidades: [],
          unidadActiva: null,
          isLoading: false,
          error: null,
        });
      },

      // Setear error
      setError: (error) => set({ error, isLoading: false }),

      // Setear loading
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "unidad-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        unidadActiva: state.unidadActiva,
      }),
    }
  )
);

// ============================================
// Selectores para mejor rendimiento
// ============================================

/**
 * Obtener la unidad activa
 */
export const useUnidadActiva = () => 
  useUnidadStore((state) => state.unidadActiva);

/**
 * Obtener todas las unidades disponibles
 */
export const useUnidadesDisponibles = () => 
  useUnidadStore((state) => state.unidades);

/**
 * Obtener el ID de la unidad activa (o null si es "Todas")
 */
export const useUnidadActivaId = () => 
  useUnidadStore((state) => state.unidadActiva?.id ?? null);

/**
 * Verificar si el usuario tiene múltiples unidades
 */
export const useHasMultipleUnidades = () => 
  useUnidadStore((state) => state.unidades.length > 1);

/**
 * Verificar si está mostrando "Todas las unidades"
 */
export const useIsAllUnidades = () => 
  useUnidadStore((state) => state.unidadActiva === null);

// ============================================
// Helpers para filtrar queries
// ============================================

/**
 * Hook para obtener el filtro de unidad para las queries
 * Retorna el ID de la unidad activa o undefined para no filtrar
 */
export function useUnidadFilter(): number | undefined {
  const unidadActiva = useUnidadStore((state) => state.unidadActiva);
  return unidadActiva?.id;
}

/**
 * Obtener el nombre de la unidad activa para mostrar
 */
export function useUnidadActivaNombre(): string {
  const unidadActiva = useUnidadStore((state) => state.unidadActiva);
  return unidadActiva?.nombre ?? "Todas las unidades";
}

