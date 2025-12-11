/**
 * Servicio de Roles - API Real con Axios
 */
import axiosInstance from "@/lib/axios";
import type { ApiRole, AddUserRoleRequest } from "@/types/api.types";

const ROLES_ENDPOINTS = {
  getAll: "/Roles/GetAllRoles",
  create: "/Roles/AddRole",
  update: (roleId: string) => `/Roles/UpdateRole/${roleId}`,
  delete: (roleId: string) => `/Roles/DeleteRole/${roleId}`,
} as const;

const USER_ROLES_ENDPOINTS = {
  getByUser: (userId: string) => `/UserRoles/GetUserRolesByUserId/${userId}`,
  addToUser: (userId: string) => `/UserRoles/AddUserRoles/${userId}`,
} as const;

export const rolesApi = {
  /**
   * Obtener todos los roles
   */
  async getAll(): Promise<ApiRole[]> {
    const { data } = await axiosInstance.get(ROLES_ENDPOINTS.getAll);

    // ✅ Desempaquetar: {status: 200, message: '...', roles: Array(2)}
    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray(data.roles)) {
      return data.roles;
    }

    console.error("❌ Formato inesperado en roles.getAll():", data);
    return [];
  },

  /**
   * Crear nuevo rol
   */
  async create(roleData: ApiRole): Promise<ApiRole> {
    const { data } = await axiosInstance.post(ROLES_ENDPOINTS.create, roleData);
    return data.role || data;
  },

  /**
   * Actualizar rol
   */
  async update(roleId: string, roleData: ApiRole): Promise<ApiRole> {
    const { data } = await axiosInstance.put(
      ROLES_ENDPOINTS.update(roleId),
      roleData
    );
    return data.role || data;
  },

  /**
   * Eliminar rol
   */
  async delete(roleId: string): Promise<void> {
    await axiosInstance.delete(ROLES_ENDPOINTS.delete(roleId));
  },
};

export const userRolesApi = {
  /**
   * Obtener roles de un usuario
   */
  async getByUser(userId: string): Promise<ApiRole[]> {
    const { data } = await axiosInstance.get(
      USER_ROLES_ENDPOINTS.getByUser(userId)
    );

    console.log("🔍 [userRolesApi.getByUser] Respuesta completa:", data);

    // ✅ Desempaquetar: {status: 200, message: '...', userRoles: Array(2)}
    if (Array.isArray(data)) {
      console.log(
        "✅ [userRolesApi.getByUser] Formato directo:",
        data.length,
        "roles"
      );
      return data;
    }

    if (data && Array.isArray(data.userRoles)) {
      console.log(
        "✅ [userRolesApi.getByUser] Formato envuelto:",
        data.userRoles.length,
        "roles"
      );

      // ✅ Mapear de {roleId, roleName} a {id, name}
      // Nota: idCompany se obtiene del token JWT, no del endpoint de roles
      interface UserRoleResponse {
        roleId: string;
        roleName: string;
        description?: string;
      }
      return data.userRoles.map((ur: UserRoleResponse) => ({
        id: ur.roleId,
        name: ur.roleName,
        description: ur.description || "",
      }));
    }

    console.error("❌ Formato inesperado en userRoles.getByUser():", data);
    return [];
  },

  async addToUser(userId: string, roleData: AddUserRoleRequest): Promise<void> {
    console.log("🔍 [userRolesApi.addToUser] userId:", userId);
    console.log("🔍 [userRolesApi.addToUser] roleData:", roleData);
    console.log(
      "🔍 [userRolesApi.addToUser] JSON.stringify:",
      JSON.stringify(roleData)
    );

    await axiosInstance.post(USER_ROLES_ENDPOINTS.addToUser(userId), roleData, {
      headers: {
        "Content-Type": "application/json", // ✅ Forzar Content-Type
      },
    });
  },
};

export default rolesApi;
