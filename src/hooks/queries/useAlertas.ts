// src/hooks/queries/useAlertas.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertasService } from "@/services";
import type { AlertaFilters, ResolverAlertaData } from "@/types";
import { toast } from "sonner";

export const alertasKeys = {
  all: ["alertas"] as const,
  lists: () => [...alertasKeys.all, "list"] as const,
  list: (filters?: AlertaFilters) => [...alertasKeys.lists(), filters] as const,
  resumen: (empresaId?: number) => [...alertasKeys.all, "resumen", empresaId] as const,
};

export function useAlertas(filters?: AlertaFilters) {
  return useQuery({
    queryKey: alertasKeys.list(filters),
    queryFn: () => alertasService.list(filters),
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 60 * 2, // Refetch cada 2 minutos
  });
}

export function useAlertasResumen(empresaId?: number) {
  return useQuery({
    queryKey: alertasKeys.resumen(empresaId),
    queryFn: () => alertasService.getResumen(empresaId),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useResolverAlerta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResolverAlertaData) => alertasService.resolver(data),
    onSuccess: (response, { accion }) => {
      queryClient.invalidateQueries({ queryKey: alertasKeys.lists() });
      queryClient.invalidateQueries({ queryKey: alertasKeys.resumen() });
      toast.success(
        accion === "resolver" ? "Alerta resuelta" : "Alerta ignorada"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al procesar alerta");
    },
  });
}

