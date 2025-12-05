// src/components/pages/_S/Layout/Sidebar.tsx
import { useState } from "react";
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
import BusinessIcon from "@mui/icons-material/Business";
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
import { useTenantStore } from "@/stores/tenant.store";
import { useUnidadStore } from "@/stores/unidad.store";
import type { UserRole, Permission } from "@/types";

const DRAWER_WIDTH = 260;

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  // Roles que pueden ver este item
  roles: UserRole[];
  // Permiso requerido (alternativa a roles)
  permission?: Permission;
  // Sub-items
  submenu?: MenuItem[];
  // Badge para mostrar contadores
  badge?: number;
}

/**
 * Estructura del menú según el modelo de negocio:
 * - Admin: Ve todo, incluyendo gestión de unidades y usuarios
 * - Supervisor: Ve solo su unidad, gestiona flota, usuarios de su unidad y valida eventos
 * - Auditor: Solo lectura de su unidad
 * - Operador: Solo WhatsApp (acceso mínimo web)
 */
const menuStructure: MenuItem[] = [
  // Dashboard - todos
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    path: "/s/dashboard",
    roles: ["admin", "supervisor", "auditor"],
  },

  // Administración - Admin y Supervisor (con diferentes alcances)
  {
    label: "Administración",
    icon: <AdminPanelSettingsIcon />,
    roles: ["admin", "supervisor"],
    submenu: [
      {
        label: "Unidades de Negocio",
        icon: <StoreIcon />,
        path: "/s/unidades",
        roles: ["admin"], // Solo admin gestiona unidades
        permission: "unidades:gestionar",
      },
      {
        label: "Usuarios",
        icon: <PeopleIcon />,
        path: "/s/usuarios",
        roles: ["admin", "supervisor"], // Supervisor puede crear usuarios de su unidad
        permission: "usuarios:gestionar",
      },
      {
        label: "Centros de Costo",
        icon: <AccountTreeIcon />,
        path: "/s/centro-costo",
        roles: ["admin", "supervisor"],
        permission: "centros-costo:gestionar",
      },
    ],
  },

  // Flota - Admin y Supervisor (de su unidad)
  {
    label: "Flota",
    icon: <LocalShippingIcon />,
    roles: ["admin", "supervisor"],
    submenu: [
      {
        label: "Vehículos",
        icon: <DirectionsCarIcon />,
        path: "/s/vehiculos",
        roles: ["admin", "supervisor"],
        permission: "vehiculos:gestionar",
      },
      {
        label: "Choferes",
        icon: <PersonIcon />,
        path: "/s/choferes",
        roles: ["admin", "supervisor"],
        permission: "choferes:gestionar",
      },
    ],
  },

  // Combustible - Admin, Supervisor y vista lectura para Auditor
  {
    label: "Combustible",
    icon: <LocalGasStationIcon />,
    roles: ["admin", "supervisor", "auditor"],
    submenu: [
      {
        label: "Eventos",
        icon: <LocalGasStationIcon />,
        path: "/s/eventos",
        roles: ["admin", "supervisor", "auditor"],
        permission: "eventos:ver",
      },
      {
        label: "Validación",
        icon: <CheckCircleIcon />,
        path: "/s/validacion",
        roles: ["admin", "supervisor"],
        permission: "eventos:validar",
      },
      {
        label: "Surtidores",
        icon: <LocalGasStationIcon />,
        path: "/s/surtidores",
        roles: ["admin"],
        permission: "surtidores:gestionar",
      },
      {
        label: "Tanques",
        icon: <PropaneTankIcon />,
        path: "/s/tanques",
        roles: ["admin"],
        permission: "tanques:gestionar",
      },
    ],
  },

  // Reportes - Admin, Supervisor y Auditor
  {
    label: "Reportes",
    icon: <AssessmentIcon />,
    path: "/s/reportes",
    roles: ["admin", "supervisor", "auditor"],
    permission: "reportes:ver",
  },

  // Configuración - solo Admin
  {
    label: "Configuración",
    icon: <SettingsIcon />,
    path: "/s/configuracion",
    roles: ["admin"],
    permission: "configuracion:editar",
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole, user } = useAuthStore();
  const { tenantConfig } = useTenantStore();
  const { unidadActiva, unidades } = useUnidadStore();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Administración: true,
    Flota: true,
    Combustible: true,
  });

  const tenantName = tenantConfig?.name;
  const isAdmin = user?.role === "admin";

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
          bgcolor: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
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
            color: "var(--accent-color)",
            mb: 1,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          }}
        />

        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ color: "var(--sidebar-text)", mb: 0.5 }}
        >
          {tenantName || "Gestión Combustibles"}
        </Typography>

        {/* Indicador de Unidad Activa (solo si no es admin o hay unidad seleccionada) */}
        <Chip
          icon={<StoreIcon sx={{ fontSize: 14, color: "inherit !important" }} />}
          label={unidadNombre}
          size="small"
          sx={{
            mt: 1,
            bgcolor: "rgba(255, 255, 255, 0.1)",
            color: "var(--sidebar-text)",
            fontSize: 11,
            height: 24,
            "& .MuiChip-icon": {
              color: "var(--accent-color)",
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
                      color: "var(--sidebar-text)",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.08)",
                        transform: "translateX(4px)",
                        transition: "all 0.2s",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "var(--sidebar-text)",
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
                            color: "var(--sidebar-text)",
                            borderLeft: isActive(subItem.path)
                              ? "3px solid var(--accent-color)"
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
                                ? "var(--accent-color)"
                                : "var(--sidebar-text)",
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
                                bgcolor: "var(--accent-color)",
                                color: "var(--sidebar-bg)",
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
                  color: "var(--sidebar-text)",
                  borderLeft: isActive(item.path)
                    ? "3px solid var(--accent-color)"
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
                      ? "var(--accent-color)"
                      : "var(--sidebar-text)",
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
