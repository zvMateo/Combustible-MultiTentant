import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import type { Permission } from "@/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: Permission;
  requireAll?: Permission[];
  requireAny?: Permission[];
  redirectTo?: string;
  showDenied?: boolean;
}

/**
 * Componente para proteger rutas completas basado en permisos
 *
 * @example
 * <Route
 *   path="/vehiculos"
 *   element={
 *     <ProtectedRoute permission={PERMISSIONS.ABM_VEHICULOS}>
 *       <Vehiculos />
 *     </ProtectedRoute>
 *   }
 * />
 */
export default function ProtectedRoute({
  children,
  permission,
  requireAll,
  requireAny,
  redirectTo = "/",
  showDenied = true,
}: ProtectedRouteProps) {
  const { can, canAll, canAny } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (requireAll) {
    hasAccess = canAll(requireAll);
  } else if (requireAny) {
    hasAccess = canAny(requireAny);
  } else {
    // Si no se especifica ningún permiso, permitir acceso
    hasAccess = true;
  }

  if (!hasAccess) {
    // Si showDenied es false, redirigir silenciosamente
    if (!showDenied) {
      return <Navigate to={redirectTo} replace />;
    }

    // Mostrar mensaje de acceso denegado
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Lock className="mb-4 h-20 w-20 text-red-600" />
        <div className="mb-2 text-3xl font-bold">Acceso Denegado</div>
        <div className="mb-6 max-w-[500px] text-sm text-muted-foreground">
          No tienes los permisos necesarios para acceder a esta sección.
          Contacta a un administrador si crees que deberías tener acceso.
        </div>
        <Button
          onClick={() => window.history.back()}
          className="bg-primary font-semibold hover:bg-primary/90"
        >
          Volver
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
