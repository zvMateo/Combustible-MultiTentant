import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  Fuel,
  LayoutDashboard,
  Settings,
  Shield,
  Store,
  Truck,
  User,
  Users,
} from "lucide-react";
import { useTenantContext } from "@/stores/auth.store";
import { useUnidadStore } from "@/stores/unidad.store";
import { usePermissions } from "@/hooks/usePermissions";
import type { UserRole, Permission } from "@/types";
import { useTheme } from "@/components/providers/theme/use-theme";

// Mantenemos el ancho de 340px con presencia institucional
const DRAWER_WIDTH = 340;

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  roles: UserRole[];
  permission?: Permission;
  submenu?: MenuItem[];
}

const menuStructure: MenuItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard size={22} />,
    path: "/dashboard",
    roles: ["admin", "supervisor", "operador", "auditor"],
  },
  {
    label: "Administración",
    icon: <Shield size={22} />,
    roles: ["admin", "supervisor"],
    submenu: [
      {
        label: "Unidades de Negocio",
        icon: <Store size={18} />,
        path: "/dashboard/business-units",
        roles: ["admin"],
        permission: "unidades:gestionar",
      },
      {
        label: "Usuarios",
        icon: <Users size={18} />,
        path: "/dashboard/users",
        roles: ["admin", "supervisor"],
        permission: "usuarios:gestionar",
      },
    ],
  },
  {
    label: "Flota",
    icon: <Truck size={22} />,
    roles: ["admin", "supervisor"],
    submenu: [
      {
        label: "Vehículos",
        icon: <Truck size={18} />,
        path: "/dashboard/vehicles",
        roles: ["admin", "supervisor"],
        permission: "vehiculos:gestionar",
      },
      {
        label: "Choferes",
        icon: <User size={18} />,
        path: "/dashboard/drivers",
        roles: ["admin", "supervisor"],
        permission: "choferes:gestionar",
      },
    ],
  },
  {
    label: "Combustible",
    icon: <Fuel size={22} />,
    roles: ["admin", "supervisor", "operador", "auditor"],
    submenu: [
      {
        label: "Cargas",
        icon: <Fuel size={18} />,
        path: "/dashboard/fuel",
        roles: ["admin", "supervisor", "operador", "auditor"],
        permission: "eventos:ver",
      },
      {
        label: "Recursos",
        icon: <Fuel size={18} />,
        path: "/dashboard/resources",
        roles: ["admin", "supervisor", "operador"],
        permission: "recursos:gestionar",
      },
    ],
  },
  {
    label: "Reportes",
    icon: <BarChart3 size={22} />,
    path: "/dashboard/reports",
    roles: ["admin", "supervisor", "auditor"],
    permission: "reportes:ver",
  },
  {
    label: "Configuración",
    icon: <Settings size={22} />,
    path: "/dashboard/settings",
    roles: ["admin"],
    permission: "configuracion:editar",
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const tenant = useTenantContext();
  const { unidadActiva, unidades } = useUnidadStore();
  const { tenantTheme } = useTheme();
  const { hasRole, can } = usePermissions();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Administración: true,
    Flota: true,
    Combustible: true,
  });

  const isAdmin = tenant.role === "admin";
  const unidadNombre = isAdmin
    ? unidadActiva?.nombre ?? "Global"
    : unidadActiva?.nombre ?? unidades[0]?.nombre ?? "Mi Unidad";

  const handleMenuClick = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path?: string) =>
    path ? location.pathname === path : false;

  const hasAccess = (roles: UserRole[], permission?: Permission) => {
    if (!hasRole(roles)) return false;
    return permission ? can(permission) : true;
  };

  return (
    <div className="shrink-0" style={{ width: DRAWER_WIDTH }}>
      <aside
        className="fixed left-0 top-0 flex h-screen flex-col border-r shadow-2xl"
        style={{
          width: DRAWER_WIDTH,
          background: `linear-gradient(180deg, ${
            tenantTheme?.sidebarBg || "#1E2C56"
          } 0%, ${tenantTheme?.sidebarBg || "#151f3d"} 100%)`,
          color: tenantTheme?.sidebarText || "#ffffff",
          borderRightColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* HEADER GESTIÓN */}
        <div className="shrink-0 px-6 py-8 text-center">
          <div className="mb-5 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
                border: `2px solid ${tenantTheme?.accentColor || "#10b981"}50`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
              }}
            >
              <Fuel
                size={30}
                style={{ color: tenantTheme?.accentColor || "#10b981" }}
              />
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight mb-1">
            {"Gestión Combustible"}
          </h1>
          <p className="text-xs opacity-40 font-medium mb-5 tracking-widest uppercase">
            {tenant.name}
          </p>

          <div className="inline-flex items-center gap-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/10">
            <Store
              size={15}
              style={{ color: tenantTheme?.accentColor || "#10b981" }}
            />
            <span className="truncate max-w-[200px]">{unidadNombre}</span>
          </div>
        </div>

        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />

        {/* NAVEGACIÓN: Bloques con ICONOS y compactos */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <div className="space-y-1">
            {menuStructure.map((item) => {
              if (!hasAccess(item.roles)) return null;

              if (item.submenu) {
                const filteredSub = item.submenu.filter((s) =>
                  hasAccess(s.roles, s.permission)
                );
                if (filteredSub.length === 0) return null;
                const isOpen = !!openMenus[item.label];

                return (
                  <div key={item.label} className="menu-group">
                    <button
                      onClick={() => handleMenuClick(item.label)}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-2 transition-all hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="opacity-70">{item.icon}</span>
                        <span className="text-[15px] font-semibold tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isOpen ? "rotate-180" : "opacity-40"
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="space-y-0.5 py-1 pl-4">
                        {" "}
                        {/* Menos indentación para que entren los iconos */}
                        {filteredSub.map((sub) => {
                          const active = isActive(sub.path);
                          return (
                            <button
                              key={sub.path}
                              onClick={() => sub.path && navigate(sub.path)}
                              className={`flex w-full items-center gap-3 rounded-lg py-1.5 px-4 text-left transition-all ${
                                active
                                  ? "bg-white/10 text-white shadow-sm"
                                  : "text-white/60 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <span
                                className={
                                  active ? "opacity-100" : "opacity-50"
                                }
                              >
                                {sub.icon}
                              </span>
                              <span className="text-[14px] font-medium">
                                {sub.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => item.path && navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2 transition-all ${
                    active
                      ? "bg-white/15 shadow-sm"
                      : "hover:bg-white/5 opacity-80 hover:opacity-100"
                  }`}
                  style={
                    active
                      ? {
                          borderLeft: `4px solid ${
                            tenantTheme?.accentColor || "#10b981"
                          }`,
                        }
                      : {}
                  }
                >
                  {item.icon}
                  <span className="text-[15px] font-semibold tracking-wide">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* FOOTER */}
        <div className="shrink-0 p-6">
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5">
                  Estado del Sistema
                </span>
                <span className="text-sm font-semibold text-white/90">
                  Operativo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">
                  Online
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-between items-center px-2">
            <span className="text-[11px] text-white/30 font-semibold tracking-wide">
              GOODAPPS
            </span>
            <span className="text-[11px] text-white/20 font-medium px-2 py-0.5 rounded-full bg-white/5">
              v1.0 • 2025
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
