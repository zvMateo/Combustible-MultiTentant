// DashboardLayout.tsx
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "../Layout/Sidebar";
import Header from "../Layout/Header";
import ProgressBar from "@/components/common/ProgressBar/ProgressBar";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessUnitsByCompany } from "@/hooks/queries";

export default function DashboardLayout() {
  const { isLoading, user } = useAuthStore();

  // Cargar las unidades de negocio de la empresa del usuario
  useBusinessUnitsByCompany(user?.idCompany || 0);

  // CSS Variables - colores por defecto (en el futuro pueden venir del usuario/empresa)
  const cssVariables = {
    "--primary-color": "#1E2C56",
    "--secondary-color": "#3b82f6",
    "--accent-color": "#10b981",
    "--sidebar-bg": "#1E2C56",
    "--sidebar-text": "#FFFFFF",
    "--header-bg": "#FFFFFF",
    "--content-bg": "#F4F8FA",
  } as React.CSSProperties;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }} style={cssVariables}>
      {/* ProgressBar GLOBAL - ARRIBA DE TODO */}
      <ProgressBar visible={isLoading} />

      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "var(--content-bg, #F4F8FA)",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "280px",
            background: "var(--content-bg, #F4F8FA)",
            borderRadius: "0 0 50% 50% / 0 0 30px 30px",
            zIndex: 0,
            pointerEvents: "none",
          },
        }}
      >
        <Header />
        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            minWidth: 0,
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "none",
              px: { xs: 2, sm: 3 },
              py: 3,
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
