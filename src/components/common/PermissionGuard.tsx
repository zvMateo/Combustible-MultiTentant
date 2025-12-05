import { ReactNode } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import type { Permission } from "../../utils/permissions";

interface PermissionGuardProps {
  /** Permiso requerido para mostrar el contenido */
  permission?: Permission;
  /** Lista de permisos (requiere TODOS) */
  requireAll?: Permission[];
  /** Lista de permisos (requiere AL MENOS UNO) */
  requireAny?: Permission[];
  /** Contenido a mostrar si el usuario tiene permiso */
  children: ReactNode;
  /** Contenido alternativo si no tiene permiso (opcional) */
  fallback?: ReactNode;
}

/**
 * Componente que controla la visibilidad de contenido según permisos
 * 
 * @example
 * // Requiere un permiso específico
 * <PermissionGuard permission="eventos.crear">
 *   <Button>Nuevo Evento</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Requiere TODOS los permisos
 * <PermissionGuard requireAll={['eventos.editar', 'eventos.eliminar']}>
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * @example
 * // Requiere AL MENOS UNO de los permisos
 * <PermissionGuard requireAny={['reportes.ver', 'dashboard.ver']}>
 *   <Analytics />
 * </PermissionGuard>
 * 
 * @example
 * // Con fallback
 * <PermissionGuard 
 *   permission="config.editar"
 *   fallback={<Typography>No tienes permiso para editar</Typography>}
 * >
 *   <EditButton />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  requireAll,
  requireAny,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can, canAll, canAny } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (requireAll) {
    hasAccess = canAll(requireAll);
  } else if (requireAny) {
    hasAccess = canAny(requireAny);
  } else {
    // Si no se especifica ningún permiso, permitir acceso por defecto
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

