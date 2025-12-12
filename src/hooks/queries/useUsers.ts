import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/services/api";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { useIdCompany } from "@/stores/auth.store";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@/types/api.types";

// Query Keys
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  byCompany: (idCompany: number) =>
    [...usersKeys.all, "byCompany", idCompany] as const,
  detail: (userId: string) => [...usersKeys.all, "detail", userId] as const,
};

/**
 * Obtener todos los usuarios
 */
export function useUsers() {
  const storeCompanyId = useIdCompany();
  const companyId = storeCompanyId ?? 0;

  return useQuery({
    queryKey: usersKeys.byCompany(companyId),
    queryFn: () => {
      return usersApi.getByCompany(companyId);
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Obtener usuario por ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersApi.getById(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Crear nuevo usuario
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => {
      console.log("🔥 [useCreateUser] Datos a enviar:", data);
      return usersApi.create(data);
    },
    onSuccess: (newUser) => {
      console.log("✅ [useCreateUser] Usuario creado:", newUser);
      toast.success("Usuario creado correctamente");
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: (error) => {
      console.error("❌ [useCreateUser] Error:", error);
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Actualizar usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserRequest;
    }) => usersApi.update(userId, data),
    onSuccess: (_, variables) => {
      toast.success("Usuario actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({
        queryKey: usersKeys.detail(variables.userId),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Cambiar contraseña
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      userId,
      passwords,
    }: {
      userId: string;
      passwords: ChangePasswordRequest;
    }) => usersApi.changePassword(userId, passwords),
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
