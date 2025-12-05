import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { Box, Typography, Button } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import type { Permission } from "../../utils/permissions";

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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          p: 4,
        }}
      >
        <LockIcon sx={{ fontSize: 80, color: "#dc2626", mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
          No tienes los permisos necesarios para acceder a esta sección.
          Contacta a un administrador si crees que deberías tener acceso.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.history.back()}
          sx={{ bgcolor: "#1E2C56", "&:hover": { bgcolor: "#16213E" } }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}

