// Asegúrate de tener estos imports al inicio del archivo
import { useState, useEffect } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  Box,
  Typography,
  Divider,
  Collapse,
  Chip,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PropaneTankIcon from "@mui/icons-material/PropaneTank";
import StoreIcon from "@mui/icons-material/Store";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadStore } from "@/stores/unidad.store";
import type { UserRole, Permission } from "@/types";
import { useTheme } from "@/components/providers/theme/use-theme";

const DRAWER_WIDTH = 260;

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
    icon: <DashboardIcon />,
    path: "/dashboard",
    roles: ["admin", "supervisor", "operador", "auditor"],
  },

  // ============================================
  // ADMINISTRACIÓN - Solo Admin
  // ============================================
  {
    label: "Administración",
    icon: <AdminPanelSettingsIcon />,
    roles: ["admin"],
    submenu: [
      {
        label: "Unidades de Negocio",
        icon: <StoreIcon />,
        path: "/dashboard/business-units",
        roles: ["admin"],
        permission: "unidades:gestionar",
      },
      {
        label: "Usuarios",
        icon: <PeopleIcon />,
        path: "/dashboard/users",
        roles: ["admin"],
        permission: "usuarios:gestionar",
      },
      {
        label: "Centros de Costo",
        icon: <AccountTreeIcon />,
        path: "/dashboard/cost-centers",
        roles: ["admin"],
        permission: "centros-costo:gestionar",
      },
    ],
  },

  // ============================================
  // FLOTA - Solo Admin
  // ============================================
  {
    label: "Flota",
    icon: <LocalShippingIcon />,
    roles: ["admin"],
    submenu: [
      {
        label: "Vehículos",
        icon: <DirectionsCarIcon />,
        path: "/dashboard/vehicles",
        roles: ["admin"],
        permission: "vehiculos:gestionar",
      },
      {
        label: "Choferes",
        icon: <PersonIcon />,
        path: "/dashboard/drivers",
        roles: ["admin"],
        permission: "choferes:gestionar",
      },
    ],
  },

  // ============================================
  // COMBUSTIBLE
  // ============================================
  {
    label: "Combustible",
    icon: <LocalGasStationIcon />,
    roles: ["admin", "supervisor", "operador", "auditor"],
    submenu: [
      // CARGAS - TODOS
      {
        label: "Cargas",
        icon: <LocalGasStationIcon />,
        path: "/dashboard/fuel",
        roles: ["admin", "supervisor", "operador", "auditor"],
        permission: "eventos:ver",
      },


      // RECURSOS - Admin y Operador
      {
        label: "Recursos",
        icon: <PropaneTankIcon />,
        path: "/dashboard/resources",
        roles: ["admin", "operador"],
        permission: "recursos:gestionar",
      },
    ],
  },

  // ============================================
  // REPORTES - Admin y Auditor
  // ============================================
  {
    label: "Reportes",
    icon: <AssessmentIcon />,
    path: "/dashboard/reports",
    roles: ["admin", "auditor"],
    permission: "reportes:ver",
  },

  // ============================================
  // CONFIGURACIÓN - Solo Admin
  // ============================================
  {
    label: "Configuración",
    icon: <SettingsIcon />,
    path: "/dashboard/settings",
    roles: ["admin"],
    permission: "configuracion:editar",
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole, user } = useAuthStore();
  const { unidadActiva, unidades } = useUnidadStore();
  const { tenantTheme } = useTheme();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Administración: true,
    Flota: true,
    Combustible: true,
  });

  const isAdmin = user?.role === "admin";

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

  const hasAccess = (roles: UserRole[]) => {
    return hasRole(roles);
  };

  // Nombre de la unidad activa para mostrar
  const unidadNombre = isAdmin
    ? unidadActiva?.nombre ?? "Todas las unidades"
    : unidadActiva?.nombre ?? unidades[0]?.nombre ?? "Mi Unidad";

  return (
    <Drawer
      variant="permanent"
      className="tenant-sidebar"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          bgcolor: tenantTheme?.sidebarBg || "#1E2C56",
          color: tenantTheme?.sidebarText || "#ffffff",
          position: "fixed",
          height: "100vh",
          overflowY: "auto",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        },
      }}
    >
      {/* Header del Sidebar */}
      <Box sx={{ p: 3, textAlign: "center" }}>
        <LocalGasStationIcon
          sx={{
            fontSize: 40,
            color: tenantTheme?.accentColor || "#10b981",
            mb: 1,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          }}
        />

        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ color: tenantTheme?.sidebarText || "#ffffff", mb: 0.5 }}
        >
          {user?.empresaNombre || "Gestión Combustibles"}
        </Typography>

        {/* Indicador de Unidad Activa */}
        <Chip
          icon={
            <StoreIcon sx={{ fontSize: 14, color: "inherit !important" }} />
          }
          label={unidadNombre}
          size="small"
          sx={{
            mt: 1,
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: tenantTheme?.sidebarText || "#ffffff",
            fontSize: 11,
            height: 24,
            "& .MuiChip-icon": {
              color: tenantTheme?.accentColor || "#10b981",
            },
          }}
        />
      </Box>

      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />

      {/* Lista de Menú */}
      <List sx={{ px: 2, py: 1 }}>
        {menuStructure.map((item) => {
          // Verificar acceso por roles
          if (!hasAccess(item.roles)) return null;

          // Renderizar items con submenu
          if (item.submenu) {
            const filteredSubmenu = item.submenu.filter((subItem) =>
              hasAccess(subItem.roles)
            );

            if (filteredSubmenu.length === 0) return null;

            return (
              <Box key={item.label}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleMenuClick(item.label)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: "transparent",
                      color: tenantTheme?.sidebarText || "#ffffff",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                        transform: "translateX(4px)",
                        transition: "all 0.2s",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: tenantTheme?.sidebarText || "#ffffff",
                        minWidth: 40,
                        opacity: 0.9,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                    />

                    {openMenus[item.label] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>

                <Collapse
                  in={openMenus[item.label]}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {filteredSubmenu.map((subItem) => (
                      <ListItem
                        key={subItem.path}
                        disablePadding
                        sx={{ pl: 2, mb: 0.5 }}
                      >
                        <ListItemButton
                          onClick={() => subItem.path && navigate(subItem.path)}
                          sx={{
                            borderRadius: 2,
                            bgcolor: isActive(subItem.path)
                              ? "rgba(255, 255, 255, 0.15)"
                              : "transparent",
                            color: tenantTheme?.sidebarText || "#ffffff",
                            borderLeft: isActive(subItem.path)
                              ? `3px solid ${
                                  tenantTheme?.accentColor || "#10b981"
                                }`
                              : "3px solid transparent",
                            "&:hover": {
                              bgcolor: isActive(subItem.path)
                                ? "rgba(255, 255, 255, 0.2)"
                                : "rgba(255, 255, 255, 0.08)",
                              transform: "translateX(4px)",
                              transition: "all 0.2s",
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: isActive(subItem.path)
                                ? tenantTheme?.accentColor || "#10b981"
                                : tenantTheme?.sidebarText || "#ffffff",
                              minWidth: 36,
                              opacity: isActive(subItem.path) ? 1 : 0.8,
                            }}
                          >
                            {subItem.icon}
                          </ListItemIcon>

                          <ListItemText
                            primary={subItem.label}
                            primaryTypographyProps={{
                              fontSize: 13,
                              fontWeight: isActive(subItem.path) ? 600 : 400,
                            }}
                          />

                          {/* Badge opcional */}
                          {subItem.badge !== undefined && subItem.badge > 0 && (
                            <Chip
                              label={subItem.badge}
                              size="small"
                              sx={{
                                height: 20,
                                minWidth: 20,
                                fontSize: 10,
                                bgcolor: tenantTheme?.accentColor || "#10b981",
                                color: tenantTheme?.sidebarBg || "#1E2C56",
                                fontWeight: 700,
                              }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // Renderizar items sin submenu
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => item.path && navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive(item.path)
                    ? "rgba(255, 255, 255, 0.15)"
                    : "transparent",
                  color: tenantTheme?.sidebarText || "#ffffff",
                  borderLeft: isActive(item.path)
                    ? `3px solid ${tenantTheme?.accentColor || "#10b981"}`
                    : "3px solid transparent",
                  "&:hover": {
                    bgcolor: isActive(item.path)
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(255, 255, 255, 0.08)",
                    transform: "translateX(4px)",
                    transition: "all 0.2s",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path)
                      ? tenantTheme?.accentColor || "#10b981"
                      : tenantTheme?.sidebarText || "#ffffff",
                    minWidth: 40,
                    opacity: isActive(item.path) ? 1 : 0.9,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer con versión */}
      <Box
        sx={{
          mt: "auto",
          p: 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255, 255, 255, 0.4)",
            display: "block",
            textAlign: "center",
          }}
        >
          v1.0.0 MVP
        </Typography>
      </Box>
    </Drawer>
  );
}
