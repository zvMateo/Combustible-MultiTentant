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
  getAll: '/Users/GetAllUsers', 
  getById: (userId: string) => `/Users/GetUserByUserId/${userId}`,
  create: "/Users/AddUser",
  createRegister: '/Users/AddUseRegister',
  update: (userId: string) => `/Users/UpdateUser/${userId}`, 
  changePassword: (userId: string) => `/Users/${userId}/ChangePassword`, 
} as const;

export const usersApi = {
  async getAll(): Promise<ApiUser[]> {
    const { data } = await axiosInstance.get(USERS_ENDPOINTS.getAll);

    console.log("🔍 [usersApi.getAll] Respuesta completa:", data);

    if (Array.isArray(data)) {
      console.log(
        "✅ [usersApi.getAll] Formato directo:",
        data.length,
        "usuarios"
      );
      // Verificar si los usuarios tienen idCompany
      const usersWithCompany = data.filter(
        (u: ApiUser) => u.idCompany !== undefined
      );
      if (usersWithCompany.length < data.length) {
        console.warn(
          `⚠️ [usersApi.getAll] ${
            data.length - usersWithCompany.length
          } usuarios sin idCompany. El backend debería incluirlo.`
        );
      }
      return data;
    }

    if (data && Array.isArray(data.users)) {
      console.log(
        "✅ [usersApi.getAll] Formato envuelto:",
        data.users.length,
        "usuarios"
      );
      // Verificar si los usuarios tienen idCompany
      const usersWithCompany = data.users.filter(
        (u: ApiUser) => u.idCompany !== undefined
      );
      if (usersWithCompany.length < data.users.length) {
        console.warn(
          `⚠️ [usersApi.getAll] ${
            data.users.length - usersWithCompany.length
          } usuarios sin idCompany. El backend debería incluirlo.`
        );
      }
      return data.users;
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
   * Crear usuario en una empresa existente (AddUser)
   */
  async create(userData: CreateUserRequest): Promise<ApiUser> {
    console.log("🚀 [usersApi.create] Enviando datos:", userData);

    // 1️⃣ Crear el usuario (retorna 204 No Content)
    const response = await axiosInstance.post(USERS_ENDPOINTS.create, userData);

    console.log(
      "✅ [usersApi.create] Usuario creado, status:",
      response.status
    );
    console.log("✅ [usersApi.create] Response data:", response.data);

    // 2️⃣ Como el backend retorna 204, debemos buscar el usuario recién creado
    console.log(
      "🔍 [usersApi.create] Buscando usuario recién creado por email:",
      userData.email
    );

    // Esperar un momento para que la base de datos se actualice
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Buscar entre todos los usuarios el que tiene el email que acabamos de crear
    const allUsers = await this.getAll();
    const newUser = allUsers.find((u) => u.email === userData.email);

    if (!newUser) {
      console.error(
        "❌ [usersApi.create] No se encontró el usuario recién creado"
      );
      throw new Error(
        "El usuario fue creado pero no se pudo recuperar su información"
      );
    }

    console.log("✅ [usersApi.create] Usuario encontrado:", newUser);
    console.log("✅ [usersApi.create] userId:", newUser.id);

    return newUser;
  },


  async createRegister(userData: CreateUserRequest): Promise<void> {
    console.log("🚀 [usersApi.createRegister] Enviando datos:", userData);

    const response = await axiosInstance.post(
      USERS_ENDPOINTS.createRegister,
      userData
    );

    console.log(
      "✅ [usersApi.createRegister] Usuario admin creado, status:",
      response.status
    );
    console.log(
      "✅ [usersApi.createRegister] Response data:",
      response.data
    );

    return;
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

export default usersApi;
