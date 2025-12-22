/**
 * Hooks de TanStack Query para Companies
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type {
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "@/types/api.types";

// Query Keys
export const companiesKeys = {
  all: ["companies"] as const,
  lists: () => [...companiesKeys.all, "list"] as const,
  detail: (id: number) => [...companiesKeys.all, "detail", id] as const,
};

/**
 * Obtener todas las empresas
 */
export function useCompanies() {
  return useQuery({
    queryKey: companiesKeys.lists(),
    queryFn: async () => {
      try {
        return await companiesApi.getAll();
      } catch (error: unknown) {
        // ✅ Si es 403 (sin permisos), devolver array vacío sin romper la app
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status === 403
        ) {
          return [];
        }
        throw error;
      }
    },
    initialData: [], // ✅ Evita "undefined" mientras carga
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Obtener empresa por ID
 */
export function useCompany(id: number) {
  return useQuery({
    queryKey: companiesKeys.detail(id),
    queryFn: () => companiesApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Crear nueva empresa
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyRequest) => companiesApi.create(data),
    onSuccess: () => {
      toast.success("Empresa creada correctamente");
      queryClient.invalidateQueries({ queryKey: companiesKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar empresa
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyRequest) => companiesApi.update(data),
    onSuccess: (_, variables) => {
      toast.success("Empresa actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: companiesKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: companiesKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar empresa
 */
export function useDeactivateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companiesApi.deactivate(id),
    onSuccess: () => {
      toast.success("Empresa desactivada");
      queryClient.invalidateQueries({ queryKey: companiesKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
