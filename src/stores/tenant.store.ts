// src/stores/tenant.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  User,
  Permission,
  TenantConfig,
  EmpresaTheme,
  EmpresaPolicies,
} from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import { authService, empresasService } from "@/services";
import { toast } from "sonner";

interface TenantState {
  // Auth State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Tenant Config
  tenantSlug: string | null;
  tenantConfig: TenantConfig | null;
  theme: EmpresaTheme | null;
  policies: EmpresaPolicies | null;

  // Auth Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;

  // Tenant Actions
  setTenantSlug: (slug: string) => void;
  setTenantConfig: (config: TenantConfig) => void;
  fetchTenantConfig: (subdomain: string) => Promise<void>;

  // Permission Helpers
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: User["role"][]) => boolean;
  isAdmin: () => boolean;
  isSupervisor: () => boolean;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      // Initial auth state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Initial tenant state
      tenantSlug: null,
      tenantConfig: null,
      theme: null,
      policies: null,

      // Login
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.login({ email, password });

          // Superadmin no puede acceder al panel tenant
          if (user.role === "superadmin") {
            authService.logout();
            throw new Error(
              "Usa el panel de administración para acceder como SuperAdmin"
            );
          }

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

      // Check Auth
      checkAuth: () => {
        const user = authService.getCurrentUser();
        if (user && user.role !== "superadmin") {
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

      // Clear Error
      clearError: () => set({ error: null }),

      // Set Tenant Slug
      setTenantSlug: (slug: string) => {
        set({ tenantSlug: slug });
      },

      // Set Tenant Config
      setTenantConfig: (config: TenantConfig) => {
        set({
          tenantConfig: config,
          theme: config.theme,
          policies: config.policies,
        });
      },

      // Fetch Tenant Config from API
      fetchTenantConfig: async (subdomain: string) => {
        set({ isLoading: true });
        try {
          const response = await empresasService.getBySubdomain(subdomain);
          if (response.success && response.data) {
            const empresa = response.data;
            const config: TenantConfig = {
              id: empresa.id,
              name: empresa.nombre,
              subdomain: empresa.subdomain,
              theme: empresa.theme,
              policies: empresa.policies,
            };
            set({
              tenantSlug: subdomain,
              tenantConfig: config,
              theme: empresa.theme,
              policies: empresa.policies,
              isLoading: false,
            });
          } else {
            throw new Error("No se pudo cargar la configuración del tenant");
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Error al cargar tenant";
          set({ isLoading: false, error: message });
          toast.error(message);
        }
      },

      // Has Permission (usa ROLE_PERMISSIONS centralizado)
      hasPermission: (permission: Permission) => {
        const user = get().user;
        if (!user) return false;

        // Usa el mapeo centralizado de types/auth.ts
        return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
      },

      // Has Role
      hasRole: (roles: User["role"][]) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role);
      },

      // Is Admin
      isAdmin: () => get().user?.role === "admin",

      // Is Supervisor
      isSupervisor: () => get().user?.role === "supervisor",
    }),
    {
      name: "tenant-auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tenantSlug: state.tenantSlug,
      }),
    }
  )
);

// Selector hooks for better performance
export const useTenantUser = () => useTenantStore((state) => state.user);
export const useIsTenantAuthenticated = () =>
  useTenantStore((state) => state.isAuthenticated);
export const useTenantLoading = () =>
  useTenantStore((state) => state.isLoading);
export const useTenantError = () => useTenantStore((state) => state.error);
export const useTenantTheme = () => useTenantStore((state) => state.theme);
export const useTenantPolicies = () =>
  useTenantStore((state) => state.policies);
export const useCurrentTenant = () =>
  useTenantStore((state) => state.tenantConfig);
export const useTenantSlug = () => useTenantStore((state) => state.tenantSlug);
