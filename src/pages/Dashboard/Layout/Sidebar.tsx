// Asegúrate de tener estos imports al inicio del archivo
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
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

const DRAWER_WIDTH = 340; // Aumentado para más espacio

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  roles: UserRole[];
  permission?: Permission;
  submenu?: MenuItem[];
  badge?: number;
}

const menuStructure: MenuItem[] = [
  // ============================================
  // DASHBOARD - TODOS
  // ============================================
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-[24px] w-[24px]" />,
    path: "/dashboard",
    roles: ["admin", "supervisor", "operador", "auditor"],
  },

  // ============================================
  // ADMINISTRACIÓN - Admin y Supervisor
  // ============================================
  {
    label: "Administración",
    icon: <Shield className="h-[24px] w-[24px]" />,
    roles: ["admin", "supervisor"],
    submenu: [
      {
        label: "Unidades de Negocio",
        icon: <Store className="h-[22px] w-[22px]" />,
        path: "/dashboard/business-units",
        roles: ["admin"],
        permission: "unidades:gestionar",
      },
      {
        label: "Usuarios",
        icon: <Users className="h-[22px] w-[22px]" />,
        path: "/dashboard/users",
        roles: ["admin", "supervisor"],
        permission: "usuarios:gestionar",
      },
    ],
  },

  // ============================================
  // FLOTA - Admin y Supervisor
  // ============================================
  {
    label: "Flota",
    icon: <Truck className="h-[24px] w-[24px]" />,
    roles: ["admin", "supervisor"],
    submenu: [
      {
        label: "Vehículos",
        icon: <Truck className="h-[22px] w-[22px]" />,
        path: "/dashboard/vehicles",
        roles: ["admin", "supervisor"],
        permission: "vehiculos:gestionar",
      },
      {
        label: "Choferes",
        icon: <User className="h-[22px] w-[22px]" />,
        path: "/dashboard/drivers",
        roles: ["admin", "supervisor"],
        permission: "choferes:gestionar",
      },
    ],
  },

  // ============================================
  // COMBUSTIBLE
  // ============================================
  {
    label: "Combustible",
    icon: <Fuel className="h-[24px] w-[24px]" />,
    roles: ["admin", "supervisor", "operador", "auditor"],
    submenu: [
      // CARGAS - TODOS
      {
        label: "Cargas",
        icon: <Fuel className="h-[22px] w-[22px]" />,
        path: "/dashboard/fuel",
        roles: ["admin", "supervisor", "operador", "auditor"],
        permission: "eventos:ver",
      },

      // RECURSOS - Admin, Supervisor y Operador
      {
        label: "Recursos",
        icon: <Fuel className="h-[22px] w-[22px]" />,
        path: "/dashboard/resources",
        roles: ["admin", "supervisor", "operador"],
        permission: "recursos:gestionar",
      },
    ],
  },

  // ============================================
  // REPORTES - Admin, Supervisor y Auditor
  // ============================================
  {
    label: "Reportes",
    icon: <BarChart3 className="h-[24px] w-[24px]" />,
    path: "/dashboard/reports",
    roles: ["admin", "supervisor", "auditor"],
    permission: "reportes:ver",
  },

  // ============================================
  // CONFIGURACIÓN - Solo Admin
  // ============================================
  {
    label: "Configuración",
    icon: <Settings className="h-[24px] w-[24px]" />,
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

  // ✅ Aplicar tema cuando cambie
  useEffect(() => {
    if (tenantTheme) {
      console.log("🎨 [Sidebar] Aplicando tema:", tenantTheme);
    }
  }, [tenantTheme]);

  const handleMenuClick = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  /**
   * Verifica si el usuario tiene acceso a un item del menú
   * Valida tanto roles como permisos específicos
   */
  const hasAccess = (roles: UserRole[], permission?: Permission): boolean => {
    // Primero verificar rol
    if (!hasRole(roles)) return false;

    // Si hay un permiso específico, validarlo también
    if (permission) {
      return can(permission);
    }

    return true;
  };

  // Nombre de la unidad activa para mostrar
  const unidadNombre = isAdmin
    ? unidadActiva?.nombre ?? "Todas las unidades"
    : unidadActiva?.nombre ?? unidades[0]?.nombre ?? "Mi Unidad";

  return (
    <div className="shrink-0" style={{ width: DRAWER_WIDTH }}>
      <aside
        className="fixed left-0 top-0 flex h-screen flex-col border-r sidebar-container"
        style={{
          width: DRAWER_WIDTH,
          backgroundColor: tenantTheme?.sidebarBg || "#1E2C56",
          color: tenantTheme?.sidebarText || "#ffffff",
          borderRightColor: "rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* ================= HEADER (bloque fijo arriba) ================= */}
        <div className="shrink-0 px-6 pb-6 pt-8 text-center">
          <div className="mb-8 flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full logo-container"
              style={{
                backgroundColor: tenantTheme?.accentColor
                  ? `${tenantTheme.accentColor}20`
                  : "rgba(16, 185, 129, 0.15)",
                border: `3px solid ${tenantTheme?.accentColor || "#10b981"}40`,
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.25)",
              }}
            >
              <Fuel
                className="h-10 w-10"
                style={{
                  color: tenantTheme?.accentColor || "#10b981",
                }}
              />
            </div>
          </div>

          <div
            className="mb-3 text-[24px] font-bold tracking-tight company-name"
            style={{ 
              color: tenantTheme?.sidebarText || "#ffffff",
              textShadow: "0 2px 6px rgba(0,0,0,0.3)"
            }}
          >
            {tenant.empresaNombre || "Gestión Combustibles"}
          </div>

          <div
            className="text-[16px] font-medium opacity-85 user-name"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
          >
            {tenant.name || ""}
          </div>

          <div
            className="mt-6 inline-flex h-12 items-center gap-3 rounded-xl px-5 text-sm font-medium unit-badge"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: tenantTheme?.sidebarText || "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Store
              className="h-[20px] w-[20px]"
              style={{ color: tenantTheme?.accentColor || "#10b981" }}
            />
            <span className="truncate max-w-[190px] text-[15px] font-semibold">
              {unidadNombre}
            </span>
          </div>
        </div>

        {/* ================= SEPARADOR ================= */}
        <div
          className="mx-8 h-[2px] mb-4 section-divider"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.12)" }}
        />

        {/* ================= MENU NAVEGACIÓN (bloque que ocupa todo el espacio) ================= */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col justify-between h-full">
            <div className="space-y-1">
            {menuStructure.map((item) => {
              if (!hasAccess(item.roles)) return null;

              if (item.submenu) {
                const filteredSubmenu = item.submenu.filter((subItem) =>
                  hasAccess(subItem.roles, subItem.permission)
                );

                if (filteredSubmenu.length === 0) return null;

                const isOpen = !!openMenus[item.label];

                return (
                  <div key={item.label} className="mb-4 menu-group">
                    {/* BOTÓN DE MENÚ DESPLEGABLE */}
                    <button
                      type="button"
                      onClick={() => handleMenuClick(item.label)}
                      className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-all duration-250 menu-button"
                      style={{
                        backgroundColor: "transparent",
                        color: tenantTheme?.sidebarText || "#ffffff",
                        marginBottom: "6px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <span 
                          className="inline-flex w-10 justify-center opacity-90 transition-transform duration-250 menu-icon"
                          style={{
                            transform: isOpen ? "rotate(5deg)" : "rotate(0)"
                          }}
                        >
                          {item.icon}
                        </span>
                        <span className="text-[16px] font-semibold tracking-wide menu-label">
                          {item.label}
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-[20px] w-[20px] opacity-70" />
                      ) : (
                        <ChevronDown className="h-[20px] w-[20px] opacity-70" />
                      )}
                    </button>

                    {/* SUBMENÚ ANIMADO */}
                    <div
                      className="overflow-hidden transition-all duration-300 ease-out submenu-container"
                      style={{
                        maxHeight: isOpen ? 500 : 0,
                        opacity: isOpen ? 1 : 0.7,
                      }}
                    >
                      <div className="space-y-2 pl-7 pt-3">
                        {filteredSubmenu.map((subItem) => {
                          const active = isActive(subItem.path);

                          return (
                            <button
                              key={subItem.path}
                              type="button"
                              onClick={() =>
                                subItem.path && navigate(subItem.path)
                              }
                              className="flex w-full items-center gap-3 rounded-xl py-3.5 pl-6 pr-4 text-left transition-all duration-250 submenu-item"
                              style={{
                                backgroundColor: active
                                  ? "rgba(255, 255, 255, 0.15)"
                                  : "transparent",
                                color: tenantTheme?.sidebarText || "#ffffff",
                                borderLeft: active
                                  ? `4px solid ${tenantTheme?.accentColor || "#10b981"}`
                                  : "4px solid transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (!active) {
                                  e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.08)";
                                  e.currentTarget.style.paddingLeft = "1.75rem";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!active) {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                  e.currentTarget.style.paddingLeft = "1.5rem";
                                }
                              }}
                            >
                              <span
                                className="inline-flex w-9 justify-center transition-colors duration-250 submenu-icon"
                                style={{
                                  opacity: active ? 1 : 0.75,
                                  color: active
                                    ? tenantTheme?.accentColor || "#10b981"
                                    : tenantTheme?.sidebarText || "#ffffff",
                                }}
                              >
                                {subItem.icon}
                              </span>

                              <span
                                className="flex-1 text-[15px] font-medium tracking-wide submenu-label"
                                style={{
                                  fontWeight: active ? 600 : 400,
                                  color: active
                                    ? tenantTheme?.accentColor || "#10b981"
                                    : "rgba(255, 255, 255, 0.9)",
                                }}
                              >
                                {subItem.label}
                              </span>

                              {subItem.badge !== undefined &&
                                subItem.badge > 0 && (
                                  <span
                                    className="ml-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[12px] font-bold badge"
                                    style={{
                                      backgroundColor:
                                        tenantTheme?.accentColor || "#10b981",
                                      color:
                                        tenantTheme?.sidebarBg || "#1E2C56",
                                      boxShadow: "0 3px 10px rgba(16, 185, 129, 0.3)",
                                    }}
                                  >
                                    {subItem.badge}
                                  </span>
                                )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              // ================= ITEMS SIMPLES (sin submenú) =================
              const active = isActive(item.path);

              return (
                <div key={item.path} className="mb-3">
                  <button
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-250 menu-item"
                    style={{
                      backgroundColor: active
                        ? "rgba(255, 255, 255, 0.15)"
                        : "transparent",
                      color: tenantTheme?.sidebarText || "#ffffff",
                      borderLeft: active
                        ? `5px solid ${tenantTheme?.accentColor || "#10b981"}`
                        : "5px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.transform = "translateX(0)";
                      }
                    }}
                  >
                    <span
                      className="inline-flex w-10 justify-center transition-all duration-250 item-icon"
                      style={{
                        opacity: active ? 1 : 0.85,
                        color: active
                          ? tenantTheme?.accentColor || "#10b981"
                          : tenantTheme?.sidebarText || "#ffffff",
                        transform: active ? "scale(1.1)" : "scale(1)",
                      }}
                    >
                      {item.icon}
                    </span>

                    <span
                      className="text-[16px] font-semibold tracking-wide item-label"
                      style={{
                        fontWeight: active ? 700 : 500,
                        color: active
                          ? tenantTheme?.accentColor || "#10b981"
                          : "rgba(255, 255, 255, 0.95)",
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                </div>
              );
            })}
            </div>

            {/* ================= SOPORTE (parte inferior del nav) ================= */}
            <div className="mt-auto pt-6">
              <div
                className="rounded-xl px-4 py-4 text-sm transition-all duration-200 hover:scale-[1.01] support-card"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                }}
              >
                <div className="font-semibold mb-1 text-[14px]">Soporte técnico</div>
                <div className="text-[12px] opacity-70">
                  Contacta con nuestro equipo
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* ================= FOOTER (bloque fijo abajo) ================= */}
        <div
          className="shrink-0 px-6 py-4 sidebar-footer"
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="text-xs footer-text"
              style={{ color: "rgba(255, 255, 255, 0.45)" }}
            >
              <div className="font-semibold text-[14px] mb-1.5">v1.0.0 MVP</div>
              <div className="opacity-70">© 2024 GoodApps</div>
            </div>
            <div className="flex items-center gap-2 status-indicator">
              <div
                className="h-3 w-3 rounded-full animate-pulse status-dot"
                style={{ 
                  backgroundColor: "#10b981",
                  boxShadow: "0 0 10px #10b981"
                }}
              />
              <div className="text-[13px] font-semibold opacity-85">Online</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}