/**
 * Hooks de React Query para Empresas
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companiesApi } from "@/services/api/companies.api";
import { queryKeys, QUERY_TIMES, invalidateQueries } from "@/lib/query-client";
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "@/types/api.types";

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todas las empresas
 */
export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies.lists(),
    queryFn: () => companiesApi.getAll(),
    ...QUERY_TIMES.STATIC,
  });
}

/**
 * Obtener empresa por ID
 */
export function useCompany(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id!),
    queryFn: () => companiesApi.getById(id!),
    enabled: !!id,
    ...QUERY_TIMES.STATIC,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear nueva empresa
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyRequest) => companiesApi.create(data),
    onSuccess: () => {
      invalidateQueries.companies();
      toast.success("Empresa creada correctamente");
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
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(variables.id) });
      toast.success("Empresa actualizada correctamente");
    },
  });
}

export default {
  useCompanies,
  useCompany,
  useCreateCompany,
  useUpdateCompany,
};


