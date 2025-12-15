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
    roles: ["superadmin", "admin", "supervisor", "operador", "auditor"],
  },
  {
    label: "Administración",
    icon: <Shield size={22} />,
    roles: ["superadmin", "admin", "supervisor"],
    submenu: [
      { label: "Unidades de Negocio", icon: <Store size={18} />, path: "/dashboard/business-units", roles: ["superadmin", "admin"], permission: "unidades:gestionar" },
      { label: "Usuarios", icon: <Users size={18} />, path: "/dashboard/users", roles: ["superadmin", "admin", "supervisor"], permission: "usuarios:gestionar" },
    ],
  },
  {
    label: "Flota",
    icon: <Truck size={22} />,
    roles: ["superadmin", "admin", "supervisor"],
    submenu: [
      { label: "Vehículos", icon: <Truck size={18} />, path: "/dashboard/vehicles", roles: ["superadmin", "admin", "supervisor"], permission: "vehiculos:gestionar" },
      { label: "Choferes", icon: <User size={18} />, path: "/dashboard/drivers", roles: ["superadmin", "admin", "supervisor"], permission: "choferes:gestionar" },
    ],
  },
  {
    label: "Combustible",
    icon: <Fuel size={22} />,
    roles: ["superadmin", "admin", "supervisor", "operador", "auditor"],
    submenu: [
      { label: "Cargas", icon: <Fuel size={18} />, path: "/dashboard/fuel", roles: ["superadmin", "admin", "supervisor", "operador", "auditor"], permission: "eventos:ver" },
      { label: "Recursos", icon: <Fuel size={18} />, path: "/dashboard/resources", roles: ["superadmin", "admin", "supervisor", "operador"], permission: "recursos:gestionar" },
    ],
  },
  {
    label: "Reportes",
    icon: <BarChart3 size={22} />,
    path: "/dashboard/reports",
    roles: ["superadmin", "admin", "supervisor", "auditor"],
    permission: "reportes:ver",
  },
  {
    label: "Configuración",
    icon: <Settings size={22} />,
    path: "/dashboard/settings",
    roles: ["superadmin", "admin"],
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

  const isAdmin = tenant.role === "admin" || tenant.role === "superadmin";
  const isAdminAssigned =
    tenant.role === "admin" &&
    (typeof tenant.idBusinessUnit === "number" && tenant.idBusinessUnit > 0);
  const unidadNombre = isAdmin
    ? (tenant.idBusinessUnit
        ? unidadActiva?.nombre ?? "Mi Unidad"
        : unidadActiva?.nombre ?? "Global")
    : unidadActiva?.nombre ?? unidades[0]?.nombre ?? "Mi Unidad";

  const handleMenuClick = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path?: string) => path ? location.pathname === path : false;

  const hasAccess = (roles: UserRole[], permission?: Permission) => {
    if (!hasRole(roles)) return false;
    if (isAdminAssigned) {
      if (permission === "unidades:gestionar" || permission === "configuracion:editar") {
        return false;
      }
    }
    return permission ? can(permission) : true;
  };

  return (
    <div className="shrink-0" style={{ width: DRAWER_WIDTH }}>
      <aside
        className="fixed left-0 top-0 flex h-screen flex-col border-r shadow-2xl"
        style={{
          width: DRAWER_WIDTH,
          backgroundColor: tenantTheme?.sidebarBg || "#1E2C56",
          color: tenantTheme?.sidebarText || "#ffffff",
          borderRightColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* HEADER GESTIÓN */}
        <div className="shrink-0 px-6 py-6 text-center">
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: `2px solid ${tenantTheme?.accentColor || "#10b981"}40`,
              }}
            >
              <Fuel size={28} style={{ color: tenantTheme?.accentColor || "#10b981" }} />
            </div>
          </div>

          <h1 className="text-lg font-bold tracking-tight mb-0.5">{"Gestion Combustible"}</h1>
          <p className="text-xs opacity-50 font-medium mb-4 tracking-wide uppercase">{tenant.name}</p>

          <div className="inline-flex items-center gap-2 rounded-lg bg-black/20 border border-white/5 px-4 py-1.5 text-[13px] font-medium">
            <Store size={14} style={{ color: tenantTheme?.accentColor || "#10b981" }} />
            <span className="truncate max-w-[220px]">{unidadNombre}</span>
          </div>
        </div>

        <div className="mx-8 h-[1px] bg-white/10 mb-2" />

        {/* NAVEGACIÓN: Bloques con ICONOS y compactos */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <div className="space-y-1">
            {menuStructure.map((item) => {
              if (!hasAccess(item.roles)) return null;

              if (item.submenu) {
                const filteredSub = item.submenu.filter(s => hasAccess(s.roles, s.permission));
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
                        <span className="text-[15px] font-semibold tracking-wide">{item.label}</span>
                      </div>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'opacity-40'}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-0.5 py-1 pl-4"> {/* Menos indentación para que entren los iconos */}
                        {filteredSub.map((sub) => {
                          const active = isActive(sub.path);
                          return (
                            <button
                              key={sub.path}
                              onClick={() => sub.path && navigate(sub.path)}
                              className={`flex w-full items-center gap-3 rounded-lg py-1.5 px-4 text-left transition-all ${
                                active ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <span className={active ? 'opacity-100' : 'opacity-50'}>{sub.icon}</span>
                              <span className="text-[14px] font-medium">{sub.label}</span>
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
                    active ? 'bg-white/15 shadow-sm' : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                  style={active ? { borderLeft: `4px solid ${tenantTheme?.accentColor || "#10b981"}` } : {}}
                >
                  {item.icon}
                  <span className="text-[15px] font-semibold tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* FOOTER */}
        <div className="shrink-0 p-6">
          <div className="rounded-xl bg-white/5 p-3 border border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none mb-1">Status</span>
              <span className="text-[12px] font-semibold opacity-70">Sistema Online</span>
            </div>
            <div className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          </div>
          <div className="mt-4 flex justify-between items-center px-1">
            <span className="text-[10px] text-white/20 font-medium tracking-tight">GOODAPPS V1.0</span>
            <span className="text-[10px] text-white/20 font-medium">2025</span>
          </div>
        </div>
      </aside>
    </div>
  );
}