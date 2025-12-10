// src/services/auth.service.ts
import type { User, UserRole } from "@/types";
import { authApi } from "./api/auth.api";
import { userRolesApi } from "./api/roles.api";
import { tokenStorage } from "@/lib/axios";
import { 
  getUserIdFromToken, 
  getUserNameFromToken, 
  getCompanyIdFromToken, 
  getBusinessUnitIdFromToken 
} from "@/lib/jwt";

/**
 * Mapeo de nombres de roles de la API a roles de la aplicación
 */
const ROLE_MAPPING: Record<string, UserRole> = {
  "Admin": "admin",
  "Administrador": "admin",
  "SuperAdmin": "superadmin",
  "Super Admin": "superadmin",
  "Supervisor": "supervisor",
  "Auditor": "auditor",
  "Operador": "operador",
};

/**
 * Normalizar nombre de rol de la API al formato de la app
 */
function normalizeRole(apiRoleName: string): UserRole {
  // Buscar coincidencia exacta (case insensitive)
  const normalized = ROLE_MAPPING[apiRoleName];
  if (normalized) return normalized;

  // Buscar por coincidencia parcial
  const lowerName = apiRoleName.toLowerCase();
  if (lowerName.includes("superadmin") || lowerName.includes("super")) {
    return "superadmin";
  }
  if (lowerName.includes("admin")) {
    return "admin";
  }
  if (lowerName.includes("supervisor")) {
    return "supervisor";
  }
  if (lowerName.includes("auditor")) {
    return "auditor";
  }
  if (lowerName.includes("operador") || lowerName.includes("operator")) {
    return "operador";
  }

  // Por defecto, operador (menor privilegio)
  console.warn(`⚠️ Rol desconocido: "${apiRoleName}", asignando "operador"`);
  return "operador";
}

class AuthService {
  /**
   * Login de usuario - Obtiene el rol real desde la API
   */
  async login(credentials: { userName: string; password: string }): Promise<User> {
    try {
      console.log("🔐 [AuthService] Iniciando login...");
      
      // 1️⃣ Login y obtener token
      const response = await authApi.login(credentials);
      
      if (!response.token) {
        throw new Error("Token no encontrado en la respuesta");
      }

      console.log("✅ [AuthService] Login exitoso, token recibido");

      // 2️⃣ Extraer datos del token JWT
      const userId = getUserIdFromToken(response.token);
      const userName = getUserNameFromToken(response.token);
      const idCompany = getCompanyIdFromToken(response.token);
      const idBusinessUnit = getBusinessUnitIdFromToken(response.token);
      
      if (!userId) {
        throw new Error("No se pudo extraer el userId del token");
      }

      console.log("✅ [AuthService] Datos extraídos del token:", {
        userId,
        userName,
        idCompany,
        idBusinessUnit,
      });

      // 3️⃣ Obtener roles del usuario desde la API
      let userRole: UserRole = "operador"; // Default fallback
      
      try {
        console.log("🔍 [AuthService] Buscando roles para userId:", userId);
        const userRoles = await userRolesApi.getByUser(userId);
        
        console.log("🔍 [AuthService] Roles recibidos:", userRoles);
        
        if (userRoles && userRoles.length > 0) {
          const apiRoleName = userRoles[0].name;
          userRole = normalizeRole(apiRoleName);
          console.log(`✅ [AuthService] Rol obtenido: "${apiRoleName}" → "${userRole}"`);
        } else {
          console.warn("⚠️ [AuthService] Usuario sin roles asignados, usando 'operador'");
        }
      } catch (roleError) {
        console.error("❌ [AuthService] Error al obtener roles:", roleError);
        console.warn("⚠️ [AuthService] Usando rol por defecto: 'operador'");
      }

      // 4️⃣ Construir objeto User
      const user: User = {
        id: userId,
        email: credentials.userName, // El backend no devuelve email
        name: userName || credentials.userName,
        role: userRole,
        idCompany: idCompany || undefined,
        idBusinessUnit: idBusinessUnit || undefined,
        empresaId: idCompany,
        empresaNombre: undefined,
        empresaSubdomain: undefined,
        unidadesAsignadas: idBusinessUnit ? [idBusinessUnit] : [],
        telefono: undefined,
      };

      console.log("✅ [AuthService] Usuario completo:", {
        id: user.id,
        name: user.name,
        role: user.role,
        idCompany: user.idCompany,
        idBusinessUnit: user.idBusinessUnit,
      });

      // 5️⃣ Guardar sesión
      this.saveSession(user);
      
      return user;
    } catch (error) {
      console.error("❌ [AuthService] Error en login:", error);
      const message = error instanceof Error ? error.message : "Error al iniciar sesión";
      throw new Error(message);
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    console.log("👋 [AuthService] Cerrando sesión...");
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
    return this.getCurrentUser() !== null && tokenStorage.getToken() !== null;
  }

  /**
   * Guardar sesión
   */
  private saveSession(user: User): void {
    sessionStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
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
   * Cambiar contraseña
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // TODO: Implementar endpoint de cambio de contraseña
    throw new Error("Cambio de contraseña no implementado en la API");
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    // TODO: Implementar endpoint de recuperación de contraseña
    throw new Error("Recuperación de contraseña no implementada en la API");
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // TODO: Implementar endpoint de reset de contraseña
    throw new Error("Reset de contraseña no implementado en la API");
  }
}

export const authService = new AuthService();
export default authService;
