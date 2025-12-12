// DashboardLayout.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "../Layout/Sidebar";
import Header from "../Layout/Header";
import ProgressBar from "@/components/common/ProgressBar/ProgressBar";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessUnitsByCompany } from "@/hooks/queries";
import { useTheme } from "@/components/providers/theme/use-theme";
import { useEffect, useMemo } from "react";

export default function DashboardLayout() {
  const { isLoading, user } = useAuthStore();
  const { tenantTheme } = useTheme();

  // Cargar las unidades de negocio de la empresa del usuario
  useBusinessUnitsByCompany(user?.idCompany || 0);

  // Variables CSS dinámicas según el tema - usando propiedades existentes
  const themeVariables = useMemo(() => {
    return {
      "--primary-color": tenantTheme?.primaryColor || "#1E2C56",
      "--secondary-color": tenantTheme?.secondaryColor || "#3b82f6",
      "--accent-color": tenantTheme?.accentColor || "#10b981",
      "--sidebar-bg": tenantTheme?.sidebarBg || "#1E2C56",
      "--sidebar-text": tenantTheme?.sidebarText || "#FFFFFF",
      // Si no existen estas propiedades en TenantThemeConfig, usa valores por defecto
      "--header-bg": "#FFFFFF", // Blanco por defecto
      "--content-bg": "#F4F8FA", // Gris claro por defecto
    } as Record<string, string>;
  }, [tenantTheme]);

  // Aplicar variables CSS al root del documento
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(themeVariables).forEach(([key, value]) => {
      if (key.startsWith("--")) {
        root.style.setProperty(key, value as string);
      }
    });

    return () => {
      // Limpiar las variables al desmontar
      Object.keys(themeVariables).forEach((key) => {
        if (key.startsWith("--")) {
          root.style.removeProperty(key);
        }
      });
    };
  }, [themeVariables]);

  return (
    <div className="flex min-h-screen bg-(--content-bg)">
      {/* ProgressBar GLOBAL */}
      {isLoading && <ProgressBar visible={isLoading} />}

      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header - fijo en la parte superior */}
        <Header />

        {/* Contenido principal con scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}