// src/stores/index.ts
// Barrel export de todos los stores

// Auth Store
export {
  useAuthStore,
  useUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
} from "./auth.store";

// UI Store
export {
  useUIStore,
  useSidebarOpen,
  useSidebarCollapsed,
  useTheme,
  useModal,
  useDrawer,
  useGlobalLoading,
} from "./ui.store";

// Tenant Store
export {
  useTenantStore,
  useCurrentTenant,
  useTenantSlug,
  useTenantTheme,
  useTenantPolicies,
  useTenantLoading,
} from "./tenant.store";

// Filters Store
export {
  useFiltersStore,
  useEventosFilters,
  useReportesFilters,
  useGlobalSearch,
} from "./filters.store";

// Unidad Store
export {
  useUnidadStore,
  useUnidadActiva,
  useUnidadesDisponibles,
  useUnidadActivaId,
  useHasMultipleUnidades,
  useIsAllUnidades,
  useUnidadFilter,
  useUnidadActivaNombre,
} from "./unidad.store";

