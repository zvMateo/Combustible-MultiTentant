/**
 * Hooks de TanStack Query para Roles y UserRoles
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi, userRolesApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import type { ApiRole, AddUserRoleRequest } from "@/types/api.types";

// Query Keys
export const rolesKeys = {
  all: ["roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
};

export const userRolesKeys = {
  all: ["userRoles"] as const,
  byUser: (userId: string) => [...userRolesKeys.all, "byUser", userId] as const,
};

/**
 * Obtener todos los roles
 */
export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.lists(),
    queryFn: () => rolesApi.getAll(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Crear nuevo rol
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApiRole) => rolesApi.create(data),
    onSuccess: () => {
      toast.success("Rol creado correctamente");
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar rol
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: ApiRole }) =>
      rolesApi.update(roleId, data),
    onSuccess: () => {
      toast.success("Rol actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Eliminar rol
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => rolesApi.delete(roleId),
    onSuccess: () => {
      toast.success("Rol eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Obtener roles de un usuario
 */
export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: userRolesKeys.byUser(userId),
    queryFn: () => userRolesApi.getByUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Agregar rol a usuario
 */
export function useAddUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AddUserRoleRequest }) =>
      userRolesApi.addToUser(userId, data),
    onSuccess: (_, variables) => {
      toast.success("Rol asignado correctamente");
      queryClient.invalidateQueries({ queryKey: userRolesKeys.byUser(variables.userId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

