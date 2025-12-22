// src/services/auth.service.ts
import type { User, UserRole } from "@/types";
import { authApi } from "./api/auth.api";
import { usersApi } from "./api/users.api";
import { tokenStorage } from "@/lib/axios";
import type { AuthClaimDto } from "./api/auth.api";

/**
 * Mapeo de nombres de roles de la API a roles de la aplicación
 */
const ROLE_MAPPING: Record<string, UserRole> = {
  SuperAdmin: "superadmin",
  Superadmin: "superadmin",
  SUPERADMIN: "superadmin",
  Admin: "admin",
  Administrador: "admin",
  Supervisor: "supervisor",
  Auditor: "auditor",
  Operador: "operador",
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
  if (/super\s*[-_]?\s*admin/.test(lowerName)) {
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
  return "operador";
}

function getClaimValues(claims: AuthClaimDto[], type: string): string[] {
  return claims.filter((c) => c.type === type).map((c) => c.value);
}

function getFirstClaimValue(
  claims: AuthClaimDto[],
  type: string
): string | null {
  return claims.find((c) => c.type === type)?.value ?? null;
}

function parseCompanyId(claims: AuthClaimDto[]): number | null {
  const value = getFirstClaimValue(claims, "IdCompany");
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseBusinessUnitId(claims: AuthClaimDto[]): number | null {
  const value = getFirstClaimValue(claims, "IdBusinessUnit");
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseRole(claims: AuthClaimDto[]): UserRole {
  const roleClaimType =
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

  const roleValues = getClaimValues(claims, roleClaimType);
  const normalizedRoles = (roleValues.length ? roleValues : ["Operador"]).map(
    (r) => normalizeRole(r)
  );

  const priority: UserRole[] = [
    "superadmin",
    "admin",
    "supervisor",
    "auditor",
    "operador",
  ];

  for (const p of priority) {
    if (normalizedRoles.includes(p)) return p;
  }

  return "operador";
}

function parseUserName(claims: AuthClaimDto[], fallback: string): string {
  return (
    getFirstClaimValue(
      claims,
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    ) ?? fallback
  );
}

function parseUserId(claims: AuthClaimDto[]): string | null {
  const nameIdentifiers = getClaimValues(
    claims,
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
  );

  if (!nameIdentifiers.length) return null;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const uuid = nameIdentifiers.find((v) => uuidRegex.test(v));
  return uuid ?? nameIdentifiers[nameIdentifiers.length - 1] ?? null;
}

class AuthService {
  /**
   * Login de usuario - Obtiene el rol real desde la API
   */
  async login(credentials: {
    userName: string;
    password: string;
  }): Promise<User> {
    try {
      // 1️⃣ Login y obtener token
      const response = await authApi.login(credentials);

      if (!response.token) {
        throw new Error("Token no encontrado en la respuesta");
      }

      // 2️⃣ Obtener claims desde la API (backend deserializa el token)
      const claims = await authApi.getClaims();
      const userId = parseUserId(claims);
      if (!userId) {
        throw new Error("No se pudo obtener el userId desde los claims");
      }

      const userName = parseUserName(claims, credentials.userName);
      let idCompany = parseCompanyId(claims);
      let idBusinessUnit = parseBusinessUnitId(claims);
      const userRole = parseRole(claims);

      // Si por algún motivo los claims no vienen completos, completar desde el usuario
      // (hay endpoints y pantallas que dependen de idCompany/idBusinessUnit)
      if (!idCompany || !idBusinessUnit) {
        try {
          const detailed = await usersApi.getById(userId);

          if (!idCompany) {
            const detailedCompanyId = detailed?.idCompany;
            if (
              typeof detailedCompanyId === "number" &&
              detailedCompanyId > 0
            ) {
              idCompany = detailedCompanyId;
            }
          }

          if (!idBusinessUnit) {
            const detailedBusinessUnitId = detailed?.idBusinessUnit;
            if (
              typeof detailedBusinessUnitId === "number" &&
              detailedBusinessUnitId > 0
            ) {
              idBusinessUnit = detailedBusinessUnitId;
            }
          }
        } catch {
          // ignore
        }
      }

      // 4️⃣ Construir objeto User
      const user: User = {
        id: userId,
        email: credentials.userName, // El backend no devuelve email
        name: userName || credentials.userName,
        role: userRole,
        idCompany: idCompany ?? undefined,
        idBusinessUnit: idBusinessUnit ?? undefined,
        empresaId: idCompany ?? null,
        empresaNombre: undefined,
        empresaSubdomain: undefined,
        unidadesAsignadas: idBusinessUnit ? [idBusinessUnit] : [],
        telefono: undefined,
      };

      // 5️⃣ Guardar sesión
      this.saveSession(user);

      return user;
    } catch (error) {
      console.error("❌ [AuthService] Error en login:", error);
      const message =
        error instanceof Error ? error.message : "Error al iniciar sesión";
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

    return true;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // TODO: Implementar endpoint de cambio de contraseña cuando esté disponible en el backend
    void currentPassword;
    void newPassword;
    throw new Error("Cambio de contraseña no implementado en la API");
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    void email;
    throw new Error("Recuperación de contraseña no implementada en la API");
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    void token;
    void newPassword;
    throw new Error("Reset de contraseña no implementado en la API");
  }
}

export const authService = new AuthService();
export default authService;
