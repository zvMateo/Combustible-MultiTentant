// src/stores/auth.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { User, Permission } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import { authService } from "@/services";
import { toast } from "sonner";

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (userName: string, password: string) => Promise<void>;
  logout: () => void;
  handleSessionExpired: () => void;
  checkAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;

  // Helpers
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: User["role"][]) => boolean;
  isAdmin: () => boolean;
}

export interface TenantContext {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: User["role"] | null;
  idCompany: number | null;
  idBusinessUnit: number | null;
  empresaNombre: string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: true, // Empieza en true mientras se verifica auth
      error: null,

      // Login
      login: async (userName: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.login({ userName, password });
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          toast.success(`¡Bienvenido, ${user.name}!`);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Error al iniciar sesión";
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          throw err;
        }
      },

      // Logout
      logout: () => {
        authService.logout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        toast.info("Sesión cerrada correctamente");
      },

      // Sesión expirada (401) - no mostrar toast de logout manual
      handleSessionExpired: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Verificar autenticación existente
      checkAuth: () => {
        const user = authService.getCurrentUser();
        if (user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Actualizar usuario
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          authService.updateUser(updatedUser);
          set({ user: updatedUser });
        }
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Verificar permiso (usa ROLE_PERMISSIONS centralizado)
      // Soporta permisos personalizados del usuario si vienen de la API
      hasPermission: (permission: Permission) => {
        const user = get().user;
        if (!user) return false;

        // Si el usuario tiene permisos personalizados, usarlos (tienen prioridad)
        if (user.permissions && Array.isArray(user.permissions)) {
          return user.permissions.includes(permission);
        }

        // De lo contrario, usar los permisos del rol desde ROLE_PERMISSIONS
        return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
      },

      // Verificar rol
      hasRole: (roles: User["role"][]) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role);
      },

      // Es Admin de empresa
      isAdmin: () => {
        const role = get().user?.role;
        return role === "admin" || role === "superadmin";
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks para mejor rendimiento
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

export const useUserName = () =>
  useAuthStore((state) => state.user?.name ?? null);
export const useUserRole = () =>
  useAuthStore((state) => state.user?.role ?? null);
export const useIdCompany = () =>
  useAuthStore((state) => state.user?.idCompany ?? null);
export const useIdBusinessUnit = () =>
  useAuthStore((state) => state.user?.idBusinessUnit ?? null);

export const useTenantContext = (): TenantContext =>
  useAuthStore(
    useShallow((state) => ({
      userId: state.user?.id ?? null,
      name: state.user?.name ?? null,
      email: state.user?.email ?? null,
      role: state.user?.role ?? null,
      idCompany: state.user?.idCompany ?? null,
      idBusinessUnit: state.user?.idBusinessUnit ?? null,
      empresaNombre: state.user?.empresaNombre ?? null,
    }))
  );
