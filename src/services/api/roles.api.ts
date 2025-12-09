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
    const { data } = await axiosInstance.get<ApiRole[]>(ROLES_ENDPOINTS.getAll);
    return data;
  },

  /**
   * Crear nuevo rol
   */
  async create(roleData: ApiRole): Promise<ApiRole> {
    const { data } = await axiosInstance.post<ApiRole>(ROLES_ENDPOINTS.create, roleData);
    return data;
  },

  /**
   * Actualizar rol
   */
  async update(roleId: string, roleData: ApiRole): Promise<ApiRole> {
    const { data } = await axiosInstance.put<ApiRole>(
      ROLES_ENDPOINTS.update(roleId),
      roleData
    );
    return data;
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
    const { data } = await axiosInstance.get<ApiRole[]>(
      USER_ROLES_ENDPOINTS.getByUser(userId)
    );
    return data;
  },

  /**
   * Agregar rol a usuario
   */
  async addToUser(userId: string, roleData: AddUserRoleRequest): Promise<void> {
    await axiosInstance.post(USER_ROLES_ENDPOINTS.addToUser(userId), roleData);
  },
};

export default rolesApi;
