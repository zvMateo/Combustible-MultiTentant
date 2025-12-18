/**
 * Helpers para TanStack Query con Optimistic Updates
 * Mejora la UX al mostrar cambios inmediatamente
 */
import type { QueryClient } from "@tanstack/react-query";

/**
 * Helper para crear contexto de optimistic update
 * @param queryClient - Cliente de TanStack Query
 * @param queryKey - Key de la query a actualizar
 */
export function createOptimisticContext<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
) {
  // Cancelar queries en progreso
  queryClient.cancelQueries({ queryKey });

  // Guardar el estado anterior
  const previousData = queryClient.getQueryData<T[]>(queryKey);

  return { previousData, queryKey };
}

/**
 * Helper para aplicar optimistic update en creación
 */
export function optimisticCreate<T extends { id?: number }>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  newItem: Omit<T, "id"> & { id?: number }
) {
  const context = createOptimisticContext<T>(queryClient, queryKey);

  // Actualizar optimisticamente con ID temporal
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return [{ ...newItem, id: -Date.now() } as T];
    return [...old, { ...newItem, id: -Date.now() } as T];
  });

  return context;
}

/**
 * Helper para aplicar optimistic update en actualización
 */
export function optimisticUpdate<T extends { id: number }>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updatedItem: T
) {
  const context = createOptimisticContext<T>(queryClient, queryKey);

  // Actualizar optimisticamente
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return [updatedItem];
    return old.map((item) =>
      item.id === updatedItem.id ? { ...item, ...updatedItem } : item
    );
  });

  return context;
}

/**
 * Helper para aplicar optimistic update en eliminación
 */
export function optimisticDelete<T extends { id: number }>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  id: number
) {
  const context = createOptimisticContext<T>(queryClient, queryKey);

  // Eliminar optimisticamente
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return [];
    return old.filter((item) => item.id !== id);
  });

  return context;
}

/**
 * Helper para revertir optimistic update en caso de error
 */
export function rollbackOptimistic<T>(
  queryClient: QueryClient,
  context: { previousData: T[] | undefined; queryKey: readonly unknown[] }
) {
  if (context.previousData) {
    queryClient.setQueryData(context.queryKey, context.previousData);
  }
}

/**
 * Tipo para el contexto de optimistic update
 */
export type OptimisticContext<T> = {
  previousData: T[] | undefined;
  queryKey: readonly unknown[];
};
