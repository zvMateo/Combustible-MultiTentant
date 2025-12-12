// src/routes/index.tsx
import { useRoutes, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Box, CircularProgress } from "@mui/material";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission, UserRole } from "@/types";

// Pages
import LandingPage from "@/pages/Landing/LandingPage";
import LoginPage from "@/pages/Auth/LoginPage";
import RegisterPage from "@/pages/Auth/RegisterPage";

// Dashboard Layout & Pages
import DashboardLayout from "@/pages/Dashboard/Layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard/Dashboard/Dashboard";
import CompaniesPage from "@/pages/Dashboard/Companies/CompaniesPage";
import BusinessUnitsPage from "@/pages/Dashboard/BusinessUnits/BusinessUnitsPage";
import UsersPage from "@/pages/Dashboard/Users/UsersPage";
import CostCentersPage from "@/pages/Dashboard/CostCenters/CostCentersPage";
import SettingsPage from "@/pages/Dashboard/Settings/SettingsPage";
import VehiclesPage from "@/pages/Dashboard/Vehicles/VehiclesPage";
import DriversPage from "@/pages/Dashboard/Drivers/DriversPage";
import FuelManagementPage from "@/pages/Dashboard/Fuel/FuelManagementPage";
import ResourcesPage from "@/pages/Dashboard/Resources/ResourcesPage";
import ReportsPage from "@/pages/Dashboard/Reports/ReportsPage";

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "#F8FAFB",
        }}
      >
        <CircularProgress sx={{ color: "#284057" }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RbacGuard({
  children,
  roles,
  permission,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
  permission?: Permission;
}) {
  const { hasRole, can } = usePermissions();

  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  const routes = useRoutes([
    // Public routes
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/registro", element: <RegisterPage /> },

    // Protected dashboard routes
    {
      path: "/dashboard",
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        { index: true, element: <Dashboard /> },
        {
          path: "companies",
          element: (
            <RbacGuard roles={["admin"]} permission="empresas:gestionar">
              <CompaniesPage />
            </RbacGuard>
          ),
        },
        {
          path: "business-units",
          element: (
            <RbacGuard roles={["admin"]} permission="unidades:gestionar">
              <BusinessUnitsPage />
            </RbacGuard>
          ),
        },
        {
          path: "users",
          element: (
            <RbacGuard
              roles={["admin", "supervisor"]}
              permission="usuarios:gestionar"
            >
              <UsersPage />
            </RbacGuard>
          ),
        },
        {
          path: "cost-centers",
          element: (
            <RbacGuard
              roles={["admin", "supervisor"]}
              permission="centros-costo:gestionar"
            >
              <CostCentersPage />
            </RbacGuard>
          ),
        },
        {
          path: "settings",
          element: (
            <RbacGuard roles={["admin"]} permission="configuracion:editar">
              <SettingsPage />
            </RbacGuard>
          ),
        },
        {
          path: "vehicles",
          element: (
            <RbacGuard
              roles={["admin", "supervisor"]}
              permission="vehiculos:gestionar"
            >
              <VehiclesPage />
            </RbacGuard>
          ),
        },
        {
          path: "drivers",
          element: (
            <RbacGuard
              roles={["admin", "supervisor"]}
              permission="choferes:gestionar"
            >
              <DriversPage />
            </RbacGuard>
          ),
        },
        {
          path: "fuel",
          element: (
            <RbacGuard
              roles={["admin", "supervisor", "operador", "auditor"]}
              permission="eventos:ver"
            >
              <FuelManagementPage />
            </RbacGuard>
          ),
        },
        {
          path: "resources",
          element: (
            <RbacGuard
              roles={["admin", "supervisor", "operador"]}
              permission="recursos:gestionar"
            >
              <ResourcesPage />
            </RbacGuard>
          ),
        },
        {
          path: "reports",
          element: (
            <RbacGuard
              roles={["admin", "supervisor", "auditor"]}
              permission="reportes:ver"
            >
              <ReportsPage />
            </RbacGuard>
          ),
        },
      ],
    },

    // Catch-all redirect
    { path: "*", element: <Navigate to="/" replace /> },
  ]);

  return routes;
}
