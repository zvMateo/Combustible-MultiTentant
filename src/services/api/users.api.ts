/**
 * Servicio de Usuarios - API Real con Axios
 */
import axiosInstance from "@/lib/axios";
import type {
  ApiUser,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@/types/api.types";

const USERS_ENDPOINTS = {
  getAll: "/Users/GetAllUsers",
  getById: (userId: string) => `/Users/GetUserByUserId/${userId}`,
  create: "/Users/AddUser",
  update: (userId: string) => `/Users/UpdateUser/${userId}`,
  changePassword: (userId: string) => `/Users/${userId}/ChangePassword`,
} as const;

export const usersApi = {
  /**
   * Obtener todos los usuarios
   */
  async getAll(): Promise<ApiUser[]> {
    const { data } = await axiosInstance.get<ApiUser[]>(USERS_ENDPOINTS.getAll);
    return data;
  },

  /**
   * Obtener usuario por ID
   */
  async getById(userId: string): Promise<ApiUser> {
    const { data } = await axiosInstance.get<ApiUser>(USERS_ENDPOINTS.getById(userId));
    return data;
  },

  /**
   * Crear nuevo usuario
   */
  async create(userData: CreateUserRequest): Promise<ApiUser> {
    const { data } = await axiosInstance.post<ApiUser>(USERS_ENDPOINTS.create, userData);
    return data;
  },

  /**
   * Actualizar usuario
   */
  async update(userId: string, userData: UpdateUserRequest): Promise<ApiUser> {
    const { data } = await axiosInstance.put<ApiUser>(
      USERS_ENDPOINTS.update(userId),
      userData
    );
    return data;
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(userId: string, passwords: ChangePasswordRequest): Promise<void> {
    await axiosInstance.put(USERS_ENDPOINTS.changePassword(userId), passwords);
  },
};

export default usersApi;
