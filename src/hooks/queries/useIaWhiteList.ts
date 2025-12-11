/**
 * Hooks de TanStack Query para IA WhiteList
 * Gestión de contactos autorizados para interactuar con el bot de IA
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { iaWhiteListApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type {
  IaWhiteListContact,
  CreateIaWhiteListRequest,
  UpdateIaWhiteListRequest,
} from "@/services/api/ia-whitelist.api";

// ============================================
// QUERY KEYS
// ============================================
export const iaWhiteListKeys = {
  all: ["iaWhiteList"] as const,
  lists: () => [...iaWhiteListKeys.all, "list"] as const,
  list: (idCompany?: number, idBusinessUnit?: number) =>
    [...iaWhiteListKeys.lists(), { idCompany, idBusinessUnit }] as const,
  detail: (id: number) => [...iaWhiteListKeys.all, "detail", id] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los contactos de la WhiteList
 * @param idCompany - ID de la empresa (opcional)
 * @param idBusinessUnit - ID de la unidad de negocio (opcional)
 */
export function useIaWhiteList(idCompany?: number, idBusinessUnit?: number) {
  return useQuery({
    queryKey: iaWhiteListKeys.list(idCompany, idBusinessUnit),
    queryFn: () => iaWhiteListApi.getAll(idCompany, idBusinessUnit),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Obtener un contacto por ID
 * @param id - ID del contacto
 * @param idCompany - ID de la empresa (opcional)
 * @param idBusinessUnit - ID de la unidad de negocio (opcional)
 */
export function useIaWhiteListContact(
  id: number,
  idCompany?: number,
  idBusinessUnit?: number
) {
  return useQuery({
    queryKey: iaWhiteListKeys.detail(id),
    queryFn: () => iaWhiteListApi.getById(id, idCompany, idBusinessUnit),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear nuevo contacto en la WhiteList
 */
export function useCreateIaWhiteListContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIaWhiteListRequest) => {
      console.log("🔥 [useCreateIaWhiteListContact] Datos a enviar:", data);
      return iaWhiteListApi.create(data);
    },
    onSuccess: (newContact, variables) => {
      console.log(
        "✅ [useCreateIaWhiteListContact] Contacto creado:",
        newContact
      );
      toast.success(`Contacto ${newContact.name} agregado a la WhiteList`);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: iaWhiteListKeys.list(
          variables.idCompany,
          variables.idBusinessUnit
        ),
      });
    },
    onError: (error) => {
      console.error("❌ [useCreateIaWhiteListContact] Error:", error);
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar contacto existente
 */
export function useUpdateIaWhiteListContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateIaWhiteListRequest) => {
      console.log("🔥 [useUpdateIaWhiteListContact] Datos a enviar:", data);
      return iaWhiteListApi.update(data);
    },
    onSuccess: (updatedContact, variables) => {
      console.log(
        "✅ [useUpdateIaWhiteListContact] Contacto actualizado:",
        updatedContact
      );
      toast.success(`Contacto ${updatedContact.name} actualizado`);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: iaWhiteListKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: iaWhiteListKeys.list(
          variables.idCompany,
          variables.idBusinessUnit
        ),
      });
    },
    onError: (error) => {
      console.error("❌ [useUpdateIaWhiteListContact] Error:", error);
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Activar contacto
 */
export function useActivateIaWhiteListContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      console.log("🔥 [useActivateIaWhiteListContact] Activando contacto:", id);
      return iaWhiteListApi.activate(id);
    },
    onSuccess: (_, id) => {
      console.log("✅ [useActivateIaWhiteListContact] Contacto activado:", id);
      toast.success("Contacto activado correctamente");

      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.all });
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.detail(id) });
    },
    onError: (error) => {
      console.error("❌ [useActivateIaWhiteListContact] Error:", error);
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Toggle estado del contacto
 */
export function useToggleIaWhiteListContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) => {
      console.log("🔥 [useToggleIaWhiteListContact]", { id, activate });
      return iaWhiteListApi.toggleActive(id, activate);
    },
    onSuccess: (_, { id, activate }) => {
      console.log("✅ [useToggleIaWhiteListContact] Estado cambiado:", {
        id,
        activate,
      });
      toast.success(activate ? "Contacto activado" : "Contacto desactivado");

      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.all });
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.detail(id) });
    },
    onError: (error) => {
      console.error("❌ [useToggleIaWhiteListContact] Error:", error);
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Desactivar contacto (soft delete)
 */
export function useDesactivateIaWhiteListContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      console.log(
        "🔥 [useDesactivateIaWhiteListContact] Desactivando contacto:",
        id
      );
      return iaWhiteListApi.desactivate(id);
    },
    onSuccess: (_, id) => {
      console.log(
        "✅ [useDesactivateIaWhiteListContact] Contacto desactivado:",
        id
      );
      toast.success("Contacto desactivado correctamente");

      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.lists() });
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.all });
      queryClient.invalidateQueries({ queryKey: iaWhiteListKeys.detail(id) });
    },
    onError: (error) => {
      console.error("❌ [useDesactivateIaWhiteListContact] Error:", error);
      toast.error(getErrorMessage(error));
    },
  });
}
