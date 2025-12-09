// src/services/auth.service.ts
import type { User } from "@/types";
import { authApi } from "./api/auth.api";
import { tokenStorage } from "@/lib/axios";
import type { ApiUser } from "@/types/api.types";

/**
 * Mock users para desarrollo
 * TODO: Eliminar cuando la API esté lista
 */
const MOCK_USERS: Record<string, User> = {
  // SuperAdmin de GoodApps (acceso a /a)
  "admin@goodapps.com": {
    id: 1,
    email: "admin@goodapps.com",
    name: "Super Admin GoodApps",
    role: "superadmin",
    empresaId: null,
    empresaSubdomain: null,
    unidadesAsignadas: [], // SuperAdmin no tiene unidades
  },

  // Admin de Empresa - ve TODAS las unidades
  "admin@empresaA.com": {
    id: 2,
    email: "admin@empresaA.com",
    name: "Carlos Rodríguez",
    role: "admin",
    empresaId: 1,
    empresaSubdomain: "empresaa",
    empresaNombre: "Transportes Norte S.A.",
    unidadesAsignadas: [], // Admin ve todas (array vacío = todas)
    telefono: "+54 351 1234567",
  },

  // Supervisor - solo ve Campo Norte (id: 1)
  "supervisor@empresaA.com": {
    id: 3,
    email: "supervisor@empresaA.com",
    name: "Juan Pérez",
    role: "supervisor",
    empresaId: 1,
    empresaSubdomain: "empresaa",
    empresaNombre: "Transportes Norte S.A.",
    unidadesAsignadas: [1], // Solo Campo Norte
    telefono: "+54 351 2345678",
  },

  // Supervisor 2 - solo ve Campo Sur (id: 2)
  "supervisor2@empresaA.com": {
    id: 5,
    email: "supervisor2@empresaA.com",
    name: "María García",
    role: "supervisor",
    empresaId: 1,
    empresaSubdomain: "empresaa",
    empresaNombre: "Transportes Norte S.A.",
    unidadesAsignadas: [2], // Solo Campo Sur
    telefono: "+54 358 3456789",
  },

  // Operador - asignado a Campo Norte
  "operador@empresaA.com": {
    id: 4,
    email: "operador@empresaA.com",
    name: "Pedro López",
    role: "operador",
    empresaId: 1,
    empresaSubdomain: "empresaa",
    empresaNombre: "Transportes Norte S.A.",
    unidadesAsignadas: [1], // Solo Campo Norte
    telefono: "+54 351 4567890",
  },

  // Auditor - puede ver Campo Norte y Sur
  "auditor@empresaA.com": {
    id: 6,
    email: "auditor@empresaA.com",
    name: "Ana Martínez",
    role: "auditor",
    empresaId: 1,
    empresaSubdomain: "empresaa",
    empresaNombre: "Transportes Norte S.A.",
    unidadesAsignadas: [1, 2], // Campo Norte y Sur
    telefono: "+54 351 5678901",
  },
};

/**
 * Flag para usar mock o API real
 */
const USE_MOCK = true; // TODO: Cambiar a false cuando la API esté lista

class AuthService {
  /**
   * Login de usuario
   */
  async login(credentials: { userName: string; password: string }): Promise<User> {
    try {
      const response = await authApi.login(credentials);
      
      if (!response.user) {
        throw new Error("Usuario no encontrado en la respuesta");
      }

      // Convertir ApiUser a User
      const user: User = {
        id: parseInt(response.user.id) || 0,
        email: response.user.email,
        name: `${response.user.firstName || ""} ${response.user.lastName || ""}`.trim() || response.user.userName,
        role: "admin", // TODO: Obtener rol desde la API cuando esté disponible
        empresaId: response.user.idCompany || null,
        empresaNombre: undefined,
        unidadesAsignadas: response.user.idBusinessUnit ? [response.user.idBusinessUnit] : [],
        telefono: response.user.phoneNumber,
      };

      // El token ya fue guardado por authApi.login()
      this.saveSession(user);
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al iniciar sesión";
      throw new Error(message);
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    tokenStorage.clearTokens();
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) {
      try {
        return JSON.parse(sessionUser);
      } catch {
        return null;
      }
    }

    const localUser = localStorage.getItem("user");
    if (localUser) {
      try {
        return JSON.parse(localUser);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Verificar si hay sesión activa
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Guardar sesión
   */
  private saveSession(user: User): void {
    sessionStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
    // El token ya fue guardado por authApi.login() usando tokenStorage
  }

  /**
   * Actualizar usuario en sesión
   */
  updateUser(user: User): void {
    this.saveSession(user);
  }

  /**
   * Verificar si el usuario es válido para la ruta actual
   */
  isValidForCurrentRoute(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const isAdminRoute = window.location.pathname.startsWith("/a");

    if (isAdminRoute) {
      return user.role === "superadmin";
    }

    return user.role !== "superadmin";
  }

  /**
   * Refrescar token
   */
  async refreshToken(): Promise<string | null> {
    if (USE_MOCK) {
      return null;
    }

    try {
      const response = await apiClient.post<ApiResponse<{ token: string }>>(
        "/auth/refresh"
      );

      if (response.success && response.data) {
        sessionStorage.setItem("token", response.data.token);
        localStorage.setItem("token", response.data.token);
        return response.data.token;
      }
    } catch {
      this.logout();
    }

    return null;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }

    await apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }

    await apiClient.post("/auth/forgot-password", { email });
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }

    await apiClient.post("/auth/reset-password", { token, newPassword });
  }
}

export const authService = new AuthService();
export default authService;
