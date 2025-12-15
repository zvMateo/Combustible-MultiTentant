import { Outlet } from "react-router-dom";
import Sidebar from "../Layout/Sidebar";
import Header from "../Layout/Header";
import ProgressBar from "@/components/common/ProgressBar/ProgressBar";
import { useAuthStore } from "@/stores/auth.store";
import { useIdCompany } from "@/stores/auth.store";
import { useBusinessUnitsByCompany } from "@/hooks/queries";
import { useTheme } from "@/components/providers/theme/use-theme";
import { useEffect, useMemo } from "react";
import { useUnidadStore } from "@/stores/unidad.store";
import type { UnidadNegocioResumen, UnidadNegocioStatus } from "@/types";
import { usersApi } from "@/services/api";
import type { User } from "@/types";

export default function DashboardLayout() {
  const { isLoading, user } = useAuthStore();
  const updateUser = useAuthStore((s) => s.updateUser);
  const effectiveCompanyId = useIdCompany();
  const { tenantTheme } = useTheme();

  const { data: businessUnits = [] } = useBusinessUnitsByCompany(
    effectiveCompanyId || 0
  );
  const { unidades, unidadActiva, setUnidades, setUnidadActiva } =
    useUnidadStore();

  useEffect(() => {
    if (!user?.id) return;

    const hasCompany = typeof user.idCompany === "number" && user.idCompany > 0;
    const hasBusinessUnit =
      typeof user.idBusinessUnit === "number" && user.idBusinessUnit > 0;
    if (hasCompany && hasBusinessUnit) return;

    void (async () => {
      try {
        const detailed = await usersApi.getById(user.id);

        const patch: Partial<User> = {};

        if (!hasCompany) {
          const detailedCompanyId = detailed?.idCompany;
          if (typeof detailedCompanyId === "number" && detailedCompanyId > 0) {
            patch.idCompany = detailedCompanyId;
            patch.empresaId = detailedCompanyId;
          }
        }

        if (!hasBusinessUnit) {
          const detailedBusinessUnitId = detailed?.idBusinessUnit;
          if (
            typeof detailedBusinessUnitId === "number" &&
            detailedBusinessUnitId > 0
          ) {
            patch.idBusinessUnit = detailedBusinessUnitId;
            patch.unidadesAsignadas = [detailedBusinessUnitId];
          }
        }

        if (Object.keys(patch).length > 0) {
          updateUser(patch);
        }
      } catch {
        // ignore
      }
    })();
  }, [updateUser, user?.id, user?.idBusinessUnit, user?.idCompany]);

  useEffect(() => {
    if (!user?.idCompany) return;

    const isSuperAdmin = user.role === "superadmin";
    const isAdmin = user.role === "admin";
    const isCompanyAdmin = isAdmin || isSuperAdmin;
    const assignedForAdmin = isAdmin
      ? user.idBusinessUnit ?? user.unidadesAsignadas?.[0] ?? null
      : null;

    const scopedBusinessUnits = assignedForAdmin
      ? businessUnits.filter((bu) => bu.id === assignedForAdmin)
      : businessUnits;

    const unidadesResumen: UnidadNegocioResumen[] = scopedBusinessUnits.map(
      (bu) => ({
        id: bu.id,
        nombre: bu.name,
        codigo: String(bu.id),
        tipo: "otro",
        status: ((bu.active ?? bu.isActive) === false
          ? "inactiva"
          : "activa") as UnidadNegocioStatus,
      })
    );

    const sameUnidades =
      unidades.length === unidadesResumen.length &&
      unidades.every((u, idx) => {
        const next = unidadesResumen[idx];
        return (
          !!next &&
          u.id === next.id &&
          u.nombre === next.nombre &&
          u.codigo === next.codigo &&
          u.tipo === next.tipo &&
          u.status === next.status
        );
      });

    if (!sameUnidades) {
      setUnidades(unidadesResumen);
    }

    if (isCompanyAdmin) {
      // Admin asignado a una unidad: unidad fija (no existe "Todas")
      if (assignedForAdmin) {
        const match =
          unidadesResumen.find((u) => u.id === assignedForAdmin) || null;
        const desired = match || unidadesResumen[0] || null;
        if ((desired?.id ?? null) !== (unidadActiva?.id ?? null)) {
          setUnidadActiva(desired);
        }
        return;
      }

      // Admin full: puede quedar en "Todas" (unidadActiva=null) o una unidad específica
      if (unidadActiva) {
        const match =
          unidadesResumen.find((u) => u.id === unidadActiva.id) || null;
        if ((match?.id ?? null) !== (unidadActiva?.id ?? null)) {
          setUnidadActiva(match);
        }
      }
      return;
    }

    const assignedId = user.idBusinessUnit;
    if (assignedId) {
      const match = unidadesResumen.find((u) => u.id === assignedId) || null;
      const desired = match || unidadesResumen[0] || null;
      if ((desired?.id ?? null) !== (unidadActiva?.id ?? null)) {
        setUnidadActiva(desired);
      }
      return;
    }

    if (unidadesResumen.length === 1) {
      if (unidadActiva?.id !== unidadesResumen[0].id) {
        setUnidadActiva(unidadesResumen[0]);
      }
    }
  }, [
    businessUnits,
    setUnidades,
    setUnidadActiva,
    unidades,
    unidadActiva,
    user?.idBusinessUnit,
    user?.unidadesAsignadas,
    user?.idCompany,
    user?.role,
  ]);

  const themeVariables = useMemo(
    () => ({
      "--primary-color": tenantTheme?.primaryColor || "#1E2C56",
      "--secondary-color": tenantTheme?.secondaryColor || "#3b82f6",
      "--accent-color": tenantTheme?.accentColor || "#10b981",
      "--sidebar-bg": tenantTheme?.sidebarBg || "#1E2C56",
      "--sidebar-text": tenantTheme?.sidebarText || "#FFFFFF",
      "--header-bg": "#FFFFFF",
      "--content-bg": "#F8FAFC", // Un gris más limpio que el anterior
    }),
    [tenantTheme]
  );

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(themeVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });
  }, [themeVariables]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
