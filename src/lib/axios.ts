/**
 * Configuración de Axios - Cliente HTTP
 *
 * Configuración centralizada de Axios con:
 * - Interceptores de request/response
 * - Manejo automático de tokens
 * - Retry automático
 * - Manejo de errores
 */
import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { toast } from "sonner";

let unauthorizedHandler: (() => void) | null = null;
let unauthorizedHandled = false;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

// ============================================
// CONFIGURACIÓN
// ============================================
const API_BASE_URL = "https://api.controlcombustible.com.ar/api";
const TIMEOUT = 30000;

// ============================================
// TIPOS
// ============================================
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: string[];
}

// ============================================
// STORAGE HELPERS
// ============================================
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const tokenStorage = {
  getToken: (): string | null => {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string, persistent = false): void => {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (persistent) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    unauthorizedHandled = false;
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  clearTokens: (): void => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    unauthorizedHandled = false;
  },
};

// ============================================
// CREAR INSTANCIA DE AXIOS
// ============================================
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();

    if (token && config.headers) {
      // Formato estándar: Bearer {token}
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Log del error
    if (import.meta.env.DEV) {
      console.error(`❌ [API] Error:`, error.response?.data || error.message);
    }

    // 401 - No autorizado
    if (error.response?.status === 401) {
      tokenStorage.clearTokens();
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");

      if (!unauthorizedHandled) {
        unauthorizedHandled = true;
        try {
          unauthorizedHandler?.();
        } catch {
          // No-op
        }
      }

      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes("/login")) {
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // 403 - Forbidden
    if (error.response?.status === 403) {
      if (import.meta.env.DEV) {
        console.error(
          `❌ [API] 403 Forbidden en ${originalRequest?.method?.toUpperCase()} ${
            originalRequest?.url
          }`
        );
        console.error(`❌ [API] Headers enviados:`, originalRequest?.headers);
        console.error(`❌ [API] Respuesta del servidor:`, error.response?.data);
      }
      toast.error("No tienes permisos para realizar esta acción.");
      return Promise.reject(error);
    }

    // 404 - Not Found
    if (error.response?.status === 404) {
      // No mostrar toast para 404, dejarlo al componente
      return Promise.reject(error);
    }

    // 500+ - Server Error
    if (error.response?.status && error.response.status >= 500) {
      toast.error("Error del servidor. Por favor, intenta más tarde.");
      return Promise.reject(error);
    }

    // Network Error (puede ser CORS)
    if (error.code === "ERR_NETWORK") {
      if (import.meta.env.DEV) {
        console.error(
          `❌ [API] Network Error (posible CORS) en ${originalRequest?.method?.toUpperCase()} ${
            originalRequest?.url
          }`
        );
      }
      // No mostrar toast para errores de red, pueden ser CORS que se resuelven con fallback
      return Promise.reject(error);
    }

    // Timeout
    if (error.code === "ECONNABORTED") {
      toast.error("La solicitud tardó demasiado. Intenta nuevamente.");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// ============================================
// HELPERS DE ERROR
// ============================================
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    // Error de la API
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Errores de validación
    if (axiosError.response?.data?.errors?.length) {
      return axiosError.response.data.errors.join(", ");
    }

    // Status text
    if (axiosError.response?.statusText) {
      return axiosError.response.statusText;
    }

    // Mensaje del error
    return axiosError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ha ocurrido un error inesperado";
}

// ============================================
// HELPERS DE NORMALIZACIÓN
// ============================================

/**
 * Normaliza respuestas de la API que pueden venir como array directo
 * o envueltas en un objeto { result: [...] }
 */
export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  // Algunos endpoints devuelven { result: [...] }
  // @ts-expect-error - shape legado de algunos endpoints
  if (Array.isArray(data?.result)) return data.result as T[];
  return [];
}

// ============================================
// EXPORTAR
// ============================================
export { axiosInstance };
export default axiosInstance;
