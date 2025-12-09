/**
 * Hooks de React Query para Autenticación
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/services/api/auth.api";
import { queryKeys, invalidateQueries } from "@/lib/query-client";
import { tokenStorage, getErrorMessage } from "@/lib/axios";
import type { LoginRequest, LoginResponse } from "@/types/api.types";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Hook para hacer login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setUser, setLoading, setError } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data: LoginResponse) => {
      if (data.user) {
        // Mapear usuario de la API al store
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || data.user.userName,
          role: "admin", // TODO: obtener rol real de la API
          empresaId: data.user.idCompany || null,
          empresaNombre: null, // TODO: obtener de la API
          empresaSubdomain: null,
          unidadesAsignadas: data.user.idBusinessUnit ? [data.user.idBusinessUnit] : [],
          createdAt: new Date().toISOString(),
          isActive: true,
        });
      }
      
      toast.success("¡Bienvenido!");
      navigate("/dashboard");
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setError(message);
      toast.error(message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook para hacer logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout: clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      authApi.logout();
    },
    onSuccess: () => {
      // Limpiar auth store
      clearAuth();
      // Limpiar todas las queries cacheadas
      queryClient.clear();
      // Redirigir al login
      navigate("/login");
      toast.success("Sesión cerrada correctamente");
    },
  });
}

export default {
  useLogin,
  useLogout,
};


