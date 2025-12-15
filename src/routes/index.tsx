// src/routes/index.tsx
import { lazy, Suspense } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission, UserRole } from "@/types";

// Componente de carga para Suspense
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  );
}

// Pages públicas (carga inmediata para mejor UX inicial)
import LandingPage from "@/pages/Landing/LandingPage";
import LoginPage from "@/pages/Auth/LoginPage";
import RegisterPage from "@/pages/Auth/RegisterPage";

// Dashboard Layout (carga inmediata - es el contenedor)
import DashboardLayout from "@/pages/Dashboard/Layout/DashboardLayout";

// Dashboard Pages (lazy loading)
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard/Dashboard"));
const BusinessUnitsPage = lazy(
  () => import("@/pages/Dashboard/BusinessUnits/BusinessUnitsPage")
);
const UsersPage = lazy(() => import("@/pages/Dashboard/Users/UsersPage"));
const SettingsPage = lazy(
  () => import("@/pages/Dashboard/Settings/SettingsPage")
);
const VehiclesPage = lazy(
  () => import("@/pages/Dashboard/Vehicles/VehiclesPage")
);
const DriversPage = lazy(() => import("@/pages/Dashboard/Drivers/DriversPage"));
const FuelManagementPage = lazy(
  () => import("@/pages/Dashboard/Fuel/FuelManagementPage")
);
const ResourcesPage = lazy(
  () => import("@/pages/Dashboard/Resources/ResourcesPage")
);
const ReportsPage = lazy(() => import("@/pages/Dashboard/Reports/ReportsPage"));

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
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
  const { user } = useAuthStore();

  const isAdminAssigned =
    user?.role === "admin" &&
    (!!user?.idBusinessUnit || (user?.unidadesAsignadas?.length ?? 0) > 0);

  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin asignado a unidad: bloquear pantallas de administración global
  if (
    isAdminAssigned &&
    (permission === "unidades:gestionar" ||
      permission === "configuracion:editar")
  ) {
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
        {
          index: true,
          element: (
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          ),
        },
        {
          path: "business-units",
          element: (
            <RbacGuard
              roles={["superadmin", "admin"]}
              permission="unidades:gestionar"
            >
              <Suspense fallback={<PageLoader />}>
                <BusinessUnitsPage />
              </Suspense>
            </RbacGuard>
          ),
        },
        {
          path: "users",
          element: (
            <RbacGuard
              roles={["superadmin", "admin", "supervisor"]}
              permission="usuarios:gestionar"
            >
              <Suspense fallback={<PageLoader />}>
                <UsersPage />
              </Suspense>
            </RbacGuard>
          ),
        },
        {
          path: "settings",
          element: (
            <RbacGuard
              roles={["superadmin", "admin"]}
              permission="configuracion:editar"
            >
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            </RbacGuard>
          ),
        },
        {
          path: "vehicles",
          element: (
            <RbacGuard
              roles={["superadmin", "admin", "supervisor"]}
              permission="vehiculos:gestionar"
            >
              <Suspense fallback={<PageLoader />}>
                <VehiclesPage />
              </Suspense>
            </RbacGuard>
          ),
        },
        {
          path: "drivers",
          element: (
            <RbacGuard
              roles={["superadmin", "admin", "supervisor"]}
              permission="choferes:gestionar"
            >
              <Suspense fallback={<PageLoader />}>
                <DriversPage />
              </Suspense>
            </RbacGuard>
          ),
        },
        {
          path: "fuel",
          element: (
            <RbacGuard
              roles={[
                "superadmin",
                "admin",
                "supervisor",
                "operador",
                "auditor",
              ]}
              permission="eventos:ver"
            >
              <Suspense fallback={<PageLoader />}>
                <FuelManagementPage />
              </Suspense>
            </RbacGuard>
          ),
        },
        {
          path: "resources",
          element: (
            <RbacGuard
              roles={["superadmin", "admin", "supervisor", "operador"]}
              permission="recursos:gestionar"
            >
              <Suspense fallback={<PageLoader />}>
                <ResourcesPage />
              </Suspense>
            </RbacGuard>
          ),
        },
        {
          path: "reports",
          element: (
            <RbacGuard
              roles={["superadmin", "admin", "supervisor", "auditor"]}
              permission="reportes:ver"
            >
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
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
