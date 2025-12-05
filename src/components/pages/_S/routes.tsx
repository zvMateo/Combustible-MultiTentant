import { useRoutes, Navigate } from "react-router-dom";
import { useTenantDomain } from "@/hooks/use-tenant-domain";
import { TenantProvider } from "@/components/providers/tenants/tenant-provider";
import { TenantAuthGuard } from "@/components/guards/tenant-auth.guard";
import DashboardLayout from "@/components/pages/_S/Layout/DashboardLayout";
import LoginPage from "@/components/pages/_S/Login/LoginPage";
import Dashboard from "@/components/pages/_S/Dashboard/Dashboard";
import ChoferesPage from "@/components/pages/_S/Choferes/ChoferesPage";
import CentroCostoPage from "@/components/pages/_S/CentroCosto/CentrosCostoPage";
import ConfiguracionPage from "@/components/pages/_S/Configuracion/ConfiguracionPage";
import DemoPage from "@/components/pages/_S/Demo/DemoPage";
import EmpresasPage from "@/components/pages/_S/Empresas/EmpresasPage";
import EventosPage from "@/components/pages/_S/Eventos/EventosPage";
import ReportesPage from "@/components/pages/_S/Reportes/ReportesPage";
import SurtidoresPage from "@/components/pages/_S/Surtidores/SurtidoresPage";
import TanquesPage from "@/components/pages/_S/Tanques/TanquesPage";
import UsuariosPage from "@/components/pages/_S/Usuarios/UsuariosPage";
import ValidacionPage from "@/components/pages/_S/Validacion/ValidacionEventosPage";
import VehiculosPage from "@/components/pages/_S/Vehiculos/VehiculosPage";
import UnidadesNegocioPage from "@/components/pages/_S/UnidadesNegocio/UnidadesNegocioPage";
import Home from "@/components/pages/_S/Home/Home";
import { appRoutes } from "@/components/pages/_A/routes";

export function Routing() {
  const tenant = useTenantDomain();
  const publicRoutes = [
    ...appRoutes, 
    { path: "/", element: <Home /> },
    { path: "*", element: <Navigate to="/" replace /> },
  ];

  const tenantRoutes = [
    { path: "/s/login", element: <LoginPage /> },
    {
      path: "/s",
      element: (
        <TenantAuthGuard>
          <DashboardLayout />
        </TenantAuthGuard>
      ),
      children: [
        { index: true, element: <Navigate to="/s/dashboard" replace /> },
        { path: "dashboard", element: <Dashboard /> },
        { path: "unidades", element: <UnidadesNegocioPage /> },
        { path: "usuarios", element: <UsuariosPage /> },
        { path: "centro-costo", element: <CentroCostoPage /> },
        { path: "configuracion", element: <ConfiguracionPage /> },
        { path: "vehiculos", element: <VehiculosPage /> },
        { path: "choferes", element: <ChoferesPage /> },
        { path: "eventos", element: <EventosPage /> },
        { path: "validacion", element: <ValidacionPage /> },
        { path: "surtidores", element: <SurtidoresPage /> },
        { path: "tanques", element: <TanquesPage /> },
        { path: "reportes", element: <ReportesPage /> },
        { path: "empresas", element: <EmpresasPage /> },
        { path: "demo", element: <DemoPage /> },
      ],
    },
    { path: "*", element: <Navigate to="/s/login" replace /> },
  ];

  const element = useRoutes(tenant === "default" ? publicRoutes : tenantRoutes);

  if (tenant === "default") {
    return element;
  }

  return <TenantProvider>{element}</TenantProvider>;
}
