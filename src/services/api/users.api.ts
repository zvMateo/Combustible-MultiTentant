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
  createRegister: "/Users/AddUseRegister",
  update: (userId: string) => `/Users/UpdateUser/${userId}`,
  changePassword: (userId: string) => `/Users/${userId}/ChangePassword`,
} as const;

export const usersApi = {
  async getByCompany(idCompany: number): Promise<ApiUser[]> {
    const { data } = await axiosInstance.get(USERS_ENDPOINTS.getAll, {
      params: { IdCompany: idCompany },
    });

    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray(data.users)) {
      return data.users;
    }

    return [];
  },

  /**
   * Obtener usuario por ID
   */
  async getById(userId: string): Promise<ApiUser> {
    const { data } = await axiosInstance.get(USERS_ENDPOINTS.getById(userId));
    return data.user || data;
  },

  /**
   * Crear usuario en una empresa existente (AddUser)
   */
  async create(userData: CreateUserRequest): Promise<ApiUser> {
    await axiosInstance.post(USERS_ENDPOINTS.create, userData);

    // Esperar para que la base de datos se actualice
    await new Promise((resolve) => setTimeout(resolve, 500));

    const allUsers = await this.getByCompany(userData.idCompany);
    const newUser = allUsers.find((u) => u.email === userData.email);

    if (!newUser) {
      throw new Error(
        "El usuario fue creado pero no se pudo recuperar su información"
      );
    }

    return newUser;
  },

  async createRegister(userData: CreateUserRequest): Promise<void> {
    await axiosInstance.post(USERS_ENDPOINTS.createRegister, userData);
  },

  /**
   * Actualizar usuario
   */
  async update(userId: string, userData: UpdateUserRequest): Promise<ApiUser> {
    const { data } = await axiosInstance.put(
      USERS_ENDPOINTS.update(userId),
      userData
    );
    return data.user || data;
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(
    userId: string,
    passwords: ChangePasswordRequest
  ): Promise<void> {
    await axiosInstance.put(USERS_ENDPOINTS.changePassword(userId), passwords);
  },
};
