/**
 * Servicio de Autenticación - API Real con Axios
 */
import axiosInstance, { tokenStorage } from "@/lib/axios";
import type { LoginRequest, LoginResponse } from "@/types/api.types";

const AUTH_ENDPOINTS = {
  login: "/Auth/Login",
  getClaims: "/Auth/GetClaims",
} as const;

export interface AuthClaimDto {
  type: string;
  value: string;
}

export const authApi = {
  /**
   * Login con email/username y contraseña
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>(
      AUTH_ENDPOINTS.login,
      credentials
    );

    const data = response.data;

    // Guardar token si viene en la respuesta
    // La API devuelve { token, expiration, user }
    if (data.token) {
      tokenStorage.setToken(data.token, true);
      if (import.meta.env.DEV) {
        // Verificar que se guardó
        tokenStorage.getToken();
      }
    }

    return data;
  },

  async getClaims(): Promise<AuthClaimDto[]> {
    const { data } = await axiosInstance.get<AuthClaimDto[]>(
      AUTH_ENDPOINTS.getClaims
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * Logout - Limpiar tokens
   */
  logout(): void {
    tokenStorage.clearTokens();
  },

  /**
   * Verificar si hay sesión activa
   */
  isAuthenticated(): boolean {
    return !!tokenStorage.getToken();
  },
};
