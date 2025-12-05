// src/services/api.client.ts
import type { ApiResponse, PaginatedResponse, ApiErrorResponse } from "@/types";

/**
 * Configuración del cliente API
 */
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000,
};

/**
 * Obtiene el token de autenticación
 */
function getAuthToken(): string | null {
  const user = sessionStorage.getItem("user") || localStorage.getItem("user");
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Headers por defecto
 */
function getDefaultHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Manejo de errores de la API
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiErrorResponse;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: `Error ${response.status}: ${response.statusText}`,
        },
        statusCode: response.status,
      };
    }

    // Si es 401, limpiar sesión y redirigir
    if (response.status === 401) {
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      window.location.href = "/a/login";
    }

    throw errorData;
  }

  return response.json();
}

/**
 * Cliente HTTP genérico
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    let url = `${API_CONFIG.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getDefaultHeaders(),
    });

    return handleResponse<T>(response);
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      method: "POST",
      headers: getDefaultHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: getDefaultHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      method: "PATCH",
      headers: getDefaultHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: getDefaultHeaders(),
    });

    return handleResponse<T>(response);
  },

  /**
   * Upload de archivos
   */
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers: HeadersInit = {};
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // No incluir Content-Type, el browser lo setea automáticamente con boundary

    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    return handleResponse<T>(response);
  },
};

/**
 * Helpers para respuestas tipadas
 */
export function createApiResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export default apiClient;
