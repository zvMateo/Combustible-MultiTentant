import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  Fuel,
  LayoutDashboard,
  LogOut,
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
import { useAuthStore } from "@/stores/auth.store";

const DRAWER_WIDTH = 260;

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
      {
        label: "Unidades de Negocio",
        icon: <Store size={18} />,
        path: "/dashboard/business-units",
        roles: ["superadmin", "admin"],
        permission: "unidades:gestionar",
      },
      {
        label: "Usuarios",
        icon: <Users size={18} />,
        path: "/dashboard/users",
        roles: ["superadmin", "admin", "supervisor"],
        permission: "usuarios:gestionar",
      },
    ],
  },
  {
    label: "Flota",
    icon: <Truck size={22} />,
    roles: ["superadmin", "admin", "supervisor"],
    submenu: [
      {
        label: "Vehículos",
        icon: <Truck size={18} />,
        path: "/dashboard/vehicles",
        roles: ["superadmin", "admin", "supervisor"],
        permission: "vehiculos:gestionar",
      },
      {
        label: "Choferes",
        icon: <User size={18} />,
        path: "/dashboard/drivers",
        roles: ["superadmin", "admin", "supervisor"],
        permission: "choferes:gestionar",
      },
    ],
  },
  {
    label: "Combustible",
    icon: <Fuel size={22} />,
    roles: ["superadmin", "admin", "supervisor", "operador", "auditor"],
    submenu: [
      {
        label: "Cargas",
        icon: <Fuel size={18} />,
        path: "/dashboard/fuel",
        roles: ["superadmin", "admin", "supervisor", "operador", "auditor"],
        permission: "eventos:ver",
      },
      {
        label: "Recursos",
        icon: <Fuel size={18} />,
        path: "/dashboard/resources",
        roles: ["superadmin", "admin", "supervisor", "operador"],
        permission: "recursos:gestionar",
      },
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
  const { hasRole, can } = usePermissions();
  const { logout } = useAuthStore();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Administración: true,
    Flota: true,
    Combustible: true,
  });

  const isAdmin = tenant.role === "admin" || tenant.role === "superadmin";
  const isAdminAssigned =
    tenant.role === "admin" &&
    typeof tenant.idBusinessUnit === "number" &&
    tenant.idBusinessUnit > 0;
  // Variable usada para mostrar nombre de unidad activa
  const _unidadNombre = isAdmin
    ? tenant.idBusinessUnit
      ? unidadActiva?.nombre ?? "Mi Unidad"
      : unidadActiva?.nombre ?? "Global"
    : unidadActiva?.nombre ?? unidades[0]?.nombre ?? "Mi Unidad";
  void _unidadNombre; // Evitar warning de variable no usada

  const handleMenuClick = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path?: string) =>
    path ? location.pathname === path : false;

  const hasAccess = (roles: UserRole[], permission?: Permission) => {
    if (!hasRole(roles)) return false;
    if (isAdminAssigned) {
      if (
        permission === "unidades:gestionar" ||
        permission === "configuracion:editar"
      ) {
        return false;
      }
    }
    return permission ? can(permission) : true;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="shrink-0" style={{ width: DRAWER_WIDTH }}>
      <aside
        className="fixed left-0 top-0 flex h-screen flex-col bg-sidebar text-sidebar-foreground"
        style={{ width: DRAWER_WIDTH }}
      >
        {/* Logo y Marca */}
        <div className="shrink-0 px-6 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Fuel size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                {tenant.name || "Combustible"}
              </h1>
            </div>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 overflow-y-auto px-4 py-2">
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
                  <div key={item.label}>
                    <button
                      onClick={() => handleMenuClick(item.label)}
                      className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-white/70 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-60" : "max-h-0"
                      }`}
                    >
                      <div className="space-y-1 py-1 pl-4">
                        {filteredSub.map((sub) => {
                          const active = isActive(sub.path);
                          return (
                            <button
                              key={sub.path}
                              onClick={() => sub.path && navigate(sub.path)}
                              className={`flex w-full items-center gap-3 rounded-xl py-2.5 px-4 text-left transition-all ${
                                active
                                  ? "bg-white text-sidebar font-semibold"
                                  : "text-white/60 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              {sub.icon}
                              <span className="text-sm">{sub.label}</span>
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
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                    active
                      ? "bg-white text-sidebar font-semibold"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Card Upgrade PRO - Estilo Figma */}
        {/* <div className="shrink-0 px-4 pb-4">
          <div className="rounded-3xl bg-gradient-to-br from-sky-100 to-sky-50 p-5 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-sky-600" />
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                  Unidad Activa
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">
                {unidadNombre}
              </p>
              <p className="text-xs text-slate-500">
                {isAdmin ? "Acceso administrativo" : "Acceso operativo"}
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sky-200/50 rounded-full" />
            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-sky-300/30 rounded-full" />
          </div>
        </div> */}

        {/* Logout */}
        <div className="shrink-0 px-4 pb-6">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-white/60 transition-all hover:bg-white/5 hover:text-white"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
