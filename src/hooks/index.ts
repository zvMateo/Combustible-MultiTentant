/**
 * Hooks - Barrel export
 *
 * Exporta todos los hooks personalizados del proyecto
 */

// Query hooks (TanStack Query)
export * from "./queries";

// Form hooks
export { useZodForm } from "./useZodForm";

// CRUD page hook
export { useCrudPage } from "./useCrudPage";
export type { UseCrudPageConfig, UseCrudPageReturn } from "./useCrudPage";

// Utility hooks
export { useDebouncedValue, useDebouncedState } from "./useDebouncedValue";
export { useIsMobile } from "./use-mobile";
export { useExcelExport, exportToExcel } from "./useExcelExport";

// Permission & Role hooks
export { usePermissions } from "./usePermissions";
export { useRoleLogic } from "./useRoleLogic";
export { useUnidadFilterLogic } from "./useUnidadFilterLogic";
