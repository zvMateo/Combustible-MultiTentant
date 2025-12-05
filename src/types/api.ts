// src/types/api.ts

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Información de paginación
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

/**
 * Error de la API
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * Respuesta de error
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  errors?: ApiError[];
  statusCode: number;
}

/**
 * Estado de carga
 */
export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  isSuccess: boolean;
}

/**
 * Respuesta de creación
 */
export interface CreateResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * Respuesta de actualización
 */
export interface UpdateResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * Respuesta de eliminación
 */
export interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Filtros de búsqueda comunes
 */
export interface CommonFilters {
  search?: string;
  activo?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
}

/**
 * Opciones de ordenamiento
 */
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Request para bulk operations
 */
export interface BulkOperationRequest {
  ids: number[];
  action: string;
  data?: Record<string, unknown>;
}

/**
 * Response de bulk operations
 */
export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: { id: number; error: string }[];
}

/**
 * Configuración del cliente HTTP
 */
export interface HttpClientConfig {
  baseUrl: string;
  timeout: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

/**
 * Interceptor de request
 */
export type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;

/**
 * Interceptor de response
 */
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * Helper para verificar si es un error de API
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "success" in error &&
    (error as ApiErrorResponse).success === false
  );
}

/**
 * Helper para extraer mensaje de error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.error?.message || "Error desconocido";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido";
}

