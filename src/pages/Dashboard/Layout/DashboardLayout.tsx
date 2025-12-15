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

  useBusinessUnitsByCompany(user?.idCompany || 0);

  const themeVariables = useMemo(() => ({
    "--primary-color": tenantTheme?.primaryColor || "#1E2C56",
    "--secondary-color": tenantTheme?.secondaryColor || "#3b82f6",
    "--accent-color": tenantTheme?.accentColor || "#10b981",
    "--sidebar-bg": tenantTheme?.sidebarBg || "#1E2C56",
    "--sidebar-text": tenantTheme?.sidebarText || "#FFFFFF",
    "--header-bg": "#FFFFFF",
    "--content-bg": "#F8FAFC", // Un gris más limpio que el anterior
  }), [tenantTheme]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(themeVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });
  }, [themeVariables]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {isLoading && <ProgressBar visible={isLoading} />}

      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto outline-none">
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}