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
    const { data } = await axiosInstance.get(USERS_ENDPOINTS.getAll);
    
    console.log("🔍 [usersApi.getAll] Respuesta completa:", data);
    
    // ✅ Desempaquetar: {status: 200, message: '...', users: Array(3)}
    if (Array.isArray(data)) {
      console.log("✅ [usersApi.getAll] Formato directo:", data.length, "usuarios");
      return data;
    }
    
    if (data && Array.isArray(data.users)) {
      console.log("✅ [usersApi.getAll] Formato envuelto:", data.users.length, "usuarios");
      return data.users; // ← ESTO ES LO CLAVE
    }
    
    console.error("❌ [usersApi.getAll] Formato inesperado:", data);
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
   * Crear nuevo usuario
   */
  async create(userData: CreateUserRequest): Promise<ApiUser> {
    const { data } = await axiosInstance.post(USERS_ENDPOINTS.create, userData);
    
    console.log("✅ [usersApi.create] Usuario creado, respuesta:", data);
    
    // ✅ Extraer el user si viene envuelto
    return data.user || data;
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
  async changePassword(userId: string, passwords: ChangePasswordRequest): Promise<void> {
    await axiosInstance.put(USERS_ENDPOINTS.changePassword(userId), passwords);
  },
};

export default usersApi;
