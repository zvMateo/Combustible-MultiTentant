// src/stores/auth.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, Permission } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import { authService } from "@/services";

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;

  // Helpers
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: User["role"][]) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.login({ email, password });
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error al iniciar sesión";
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
      hasPermission: (permission: Permission) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === "superadmin") return true;

        // Usa el mapeo centralizado de types/auth.ts
        return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
      },

      // Verificar rol
      hasRole: (roles: User["role"][]) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role);
      },

      // Es SuperAdmin
      isSuperAdmin: () => get().user?.role === "superadmin",

      // Es Admin de empresa
      isAdmin: () => get().user?.role === "admin",
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
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

