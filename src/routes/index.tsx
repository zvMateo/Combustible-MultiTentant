// src/routes/index.tsx
import { useRoutes, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

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
import LoadsPage from "@/pages/Dashboard/Loads/LoadsPage";
import ValidationPage from "@/pages/Dashboard/Validation/ValidationPage";
import DispensersPage from "@/pages/Dashboard/Dispensers/DispensersPage";
import TanksPage from "@/pages/Dashboard/Tanks/TanksPage";
import ReportsPage from "@/pages/Dashboard/Reports/ReportsPage";

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
        { path: "companies", element: <CompaniesPage /> },
        { path: "business-units", element: <BusinessUnitsPage /> },
        { path: "users", element: <UsersPage /> },
        { path: "cost-centers", element: <CostCentersPage /> },
        { path: "settings", element: <SettingsPage /> },
        { path: "vehicles", element: <VehiclesPage /> },
        { path: "drivers", element: <DriversPage /> },
        { path: "loads", element: <LoadsPage /> },
        { path: "validation", element: <ValidationPage /> },
        { path: "dispensers", element: <DispensersPage /> },
        { path: "tanks", element: <TanksPage /> },
        { path: "reports", element: <ReportsPage /> },
      ],
    },

    // Catch-all redirect
    { path: "*", element: <Navigate to="/" replace /> },
  ]);

  return routes;
}
