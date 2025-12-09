/**
 * Hooks de React Query para Usuarios
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "@/services/api/users.api";
import { userRolesApi } from "@/services/api/roles.api";
import { queryKeys, QUERY_TIMES, invalidateQueries } from "@/lib/query-client";
import type {
  ApiUser,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@/types/api.types";

// ============================================
// QUERIES
// ============================================

/**
 * Obtener todos los usuarios
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: () => usersApi.getAll(),
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener usuario por ID
 */
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId!),
    queryFn: () => usersApi.getById(userId!),
    enabled: !!userId,
    ...QUERY_TIMES.MODERATE,
  });
}

/**
 * Obtener roles de un usuario
 */
export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.roles(userId!),
    queryFn: () => userRolesApi.getByUser(userId!),
    enabled: !!userId,
    ...QUERY_TIMES.STATIC,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Crear nuevo usuario
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: () => {
      invalidateQueries.users();
      toast.success("Usuario creado correctamente");
    },
  });
}

/**
 * Actualizar usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRequest }) =>
      usersApi.update(userId, data),
    onSuccess: (_, variables) => {
      // Invalidar lista y detalle específico
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId) });
      toast.success("Usuario actualizado correctamente");
    },
  });
}

/**
 * Cambiar contraseña
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangePasswordRequest }) =>
      usersApi.changePassword(userId, data),
    onSuccess: () => {
      toast.success("Contraseña cambiada correctamente");
    },
  });
}

/**
 * Agregar rol a usuario
 */
export function useAddUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      userRolesApi.addToUser(userId, { roleId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.roles(variables.userId) });
      toast.success("Rol asignado correctamente");
    },
  });
}

export default {
  useUsers,
  useUser,
  useUserRoles,
  useCreateUser,
  useUpdateUser,
  useChangePassword,
  useAddUserRole,
};


