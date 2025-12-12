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
        console.log("🔐 Token guardado correctamente");
        console.log(
          "🔐 Token (primeros 30 chars):",
          data.token.substring(0, 30) + "..."
        );
        // Verificar que se guardó
        const savedToken = tokenStorage.getToken();
        console.log(
          "🔐 Token verificado en storage:",
          savedToken ? savedToken.substring(0, 30) + "..." : "NO ENCONTRADO"
        );
      }
    } else {
      console.warn("⚠️ No se recibió token en la respuesta del login");
      console.warn("⚠️ Respuesta completa:", data);
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

export default authApi;
