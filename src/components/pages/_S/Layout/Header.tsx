// src/components/pages/_S/Layout/Header.tsx
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Chip,
  Divider,
  Select,
  FormControl,
} from "@mui/material";
import { useState } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import SettingsIcon from "@mui/icons-material/Settings";
import StoreIcon from "@mui/icons-material/Store";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useUnidadStore } from "@/stores/unidad.store";
import { useNavigate } from "react-router-dom";
import type { UserRole, UnidadNegocioResumen } from "@/types";

export default function Header() {
  const { user, logout } = useAuthStore();
  const { tenantConfig } = useTenantStore();
  const { unidades, unidadActiva, setUnidadActiva } = useUnidadStore();
  const tenantName = tenantConfig?.name;
  const tenantTheme = tenantConfig?.theme;
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Determinar si el usuario puede cambiar de unidad (solo admin)
  const isAdmin = user?.role === "admin";
  const canSwitchUnidad = isAdmin && unidades.length > 1;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate("/s/login");
  };

  const handleUnidadChange = (unidadId: number | "all") => {
    if (unidadId === "all") {
      setUnidadActiva(null);
    } else {
      const unidad = unidades.find((u) => u.id === unidadId);
      if (unidad) {
        setUnidadActiva(unidad);
      }
    }
  };

  const getAvatarColor = (): string => {
    return tenantTheme?.primaryColor || "#3b82f6";
  };

  const getRolColor = (
    rol: UserRole | undefined
  ): { bg: string; color: string } => {
    const colors: Record<UserRole, { bg: string; color: string }> = {
      superadmin: { bg: "#8b5cf615", color: "#8b5cf6" },
      admin: { bg: "#3b82f615", color: "#3b82f6" },
      supervisor: { bg: "#10b98115", color: "#10b981" },
      operador: { bg: "#f59e0b15", color: "#f59e0b" },
      auditor: { bg: "#6b728015", color: "#6b7280" },
    };
    return rol ? colors[rol] : { bg: "#99999915", color: "#999" };
  };

  const getRolLabel = (rol: UserRole | undefined): string => {
    const labels: Record<UserRole, string> = {
      superadmin: "SuperAdmin",
      admin: "Administrador",
      supervisor: "Supervisor",
      operador: "Operador",
      auditor: "Auditor",
    };
    return rol ? labels[rol] : "Usuario";
  };

  const commonIconButtonStyle = {
    bgcolor: "rgba(255, 255, 255, 0.8)",
    width: 46,
    height: 46,
    border: "1px solid rgba(180, 195, 205, 0.6)",
    "&:hover": {
      bgcolor: "rgba(255, 255, 255, 1)",
      transform: "scale(1.05)",
      transition: "all 0.2s",
      borderColor: tenantTheme?.primaryColor || "#94a3b8",
    },
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid rgba(226, 232, 240, 0.6)`,
        zIndex: (theme) => theme.zIndex.drawer - 1,
        boxShadow: `0 2px 8px rgba(0, 0, 0, 0.08)`,
      }}
    >
      <Toolbar sx={{ minHeight: "72px !important", px: 4 }}>
        {/* Lado Izquierdo - Info Usuario + Selector de Unidad */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              ml: 3,
              fontSize: 12,
              letterSpacing: "0.5px",
              color: "#64748b",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Bienvenido de nuevo
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontSize: 20,
                lineHeight: 1,
                fontWeight: 600,
                color: tenantTheme?.primaryColor || "#1e293b",
                letterSpacing: "-0.3px",
              }}
            >
              {user?.name}
            </Typography>
            
            <Chip
              label={getRolLabel(user?.role)}
              size="small"
              sx={{
                bgcolor: getRolColor(user?.role).bg,
                color: getRolColor(user?.role).color,
                fontWeight: 700,
                height: 26,
                fontSize: 11,
                borderRadius: 2,
                letterSpacing: "0.3px",
              }}
            />

            {/* Separador visual */}
            {canSwitchUnidad && (
              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 1.5, borderColor: "rgba(0,0,0,0.1)" }}
              />
            )}

            {/* Selector de Unidad - Solo para Admin con múltiples unidades */}
            {canSwitchUnidad && (
              <FormControl size="small">
                <Select
                  value={unidadActiva?.id ?? "all"}
                  onChange={(e) =>
                    handleUnidadChange(e.target.value === "all" ? "all" : Number(e.target.value))
                  }
                  IconComponent={KeyboardArrowDownIcon}
                  sx={{
                    minWidth: 200,
                    bgcolor: "rgba(59, 130, 246, 0.08)",
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: tenantTheme?.primaryColor || "#3b82f6",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: tenantTheme?.primaryColor || "#3b82f6",
                    },
                    "& .MuiSelect-select": {
                      py: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    },
                  }}
                  renderValue={(value) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <StoreIcon
                        sx={{
                          fontSize: 18,
                          color: tenantTheme?.primaryColor || "#3b82f6",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: tenantTheme?.primaryColor || "#1e293b",
                        }}
                      >
                        {value === "all"
                          ? "Todas las unidades"
                          : unidadActiva?.nombre}
                      </Typography>
                    </Box>
                  )}
                >
                  <MenuItem value="all">
                    <StoreIcon sx={{ fontSize: 18, mr: 1, color: "#64748b" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                      Todas las unidades
                    </Typography>
                  </MenuItem>
                  
                  <Divider sx={{ my: 0.5 }} />
                  
                  {unidades.map((unidad) => (
                    <MenuItem key={unidad.id} value={unidad.id}>
                      <StoreIcon sx={{ fontSize: 18, mr: 1, color: "#64748b" }} />
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                          {unidad.nombre}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11, color: "#94a3b8", lineHeight: 1 }}
                        >
                          {unidad.codigo}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Mostrar unidad fija para supervisor/auditor */}
            {!isAdmin && unidadActiva && (
              <Chip
                icon={<StoreIcon sx={{ fontSize: 14 }} />}
                label={unidadActiva.nombre}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "rgba(0,0,0,0.1)",
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />
            )}
          </Box>
        </Box>

        {/* Lado Derecho */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          {/* Notificaciones */}
          <IconButton sx={commonIconButtonStyle}>
            <Badge
              badgeContent={3}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: 10,
                  height: 19,
                  minWidth: 19,
                  fontWeight: 700,
                  bgcolor: tenantTheme?.secondaryColor || "#ef4444",
                  boxShadow: `0 2px 8px rgba(16, 185, 129, 0.4)`,
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 22, color: "#475569" }} />
            </Badge>
          </IconButton>

          {/* Avatar */}
          <IconButton
            onClick={handleMenu}
            sx={{
              p: 0,
              "&:hover": {
                transform: "scale(1.08)",
                transition: "all 0.2s",
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: getAvatarColor(),
                width: 46,
                height: 46,
                fontWeight: 700,
                fontSize: 17,
                border: "3px solid rgba(255,255,255,0.9)",
                boxShadow: `0 4px 14px rgba(0,0,0,0.12)`,
                cursor: "pointer",
              }}
            >
              {user?.name?.charAt(0)}
              {user?.name?.split(" ")[1]?.charAt(0) || ""}
            </Avatar>
          </IconButton>
        </Box>

        {/* Menú de Perfil */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              minWidth: 320,
              mt: 2,
              borderRadius: 3,
              border: "1px solid rgba(226, 232, 240, 0.6)",
              overflow: "visible",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)",
              "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 18,
                width: 12,
                height: 12,
                bgcolor: "rgba(255, 255, 255, 0.98)",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
                border: "1px solid rgba(226, 232, 240, 0.6)",
                borderBottom: "none",
                borderRight: "none",
              },
              "& .MuiMenuItem-root": {
                borderRadius: 2,
                mx: 1.5,
                my: 0.5,
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {/* Info Usuario */}
          <Box sx={{ px: 3, py: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 2.5 }}
            >
              <Avatar
                sx={{
                  bgcolor: getAvatarColor(),
                  width: 60,
                  height: 60,
                  fontWeight: 700,
                  fontSize: 22,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                {user?.name?.charAt(0)}
                {user?.name?.split(" ")[1]?.charAt(0) || ""}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 0.8,
                    fontWeight: 700,
                    fontSize: 16,
                    color: tenantTheme?.primaryColor || "#1e293b",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {user?.name}
                </Typography>
                <Chip
                  label={getRolLabel(user?.role)}
                  size="small"
                  sx={{
                    bgcolor: getRolColor(user?.role).bg,
                    color: getRolColor(user?.role).color,
                    fontWeight: 700,
                    height: 24,
                    fontSize: 11,
                    letterSpacing: "0.3px",
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <PersonIcon sx={{ fontSize: 19, color: "#94a3b8" }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 14,
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  {user?.email}
                </Typography>
              </Box>
              {tenantName && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <BusinessIcon sx={{ fontSize: 19, color: "#94a3b8" }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: 14,
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    {tenantName}
                  </Typography>
                </Box>
              )}
              {unidadActiva && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <StoreIcon sx={{ fontSize: 19, color: "#94a3b8" }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: 14,
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    {unidadActiva.nombre}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: "rgba(226, 232, 240, 0.6)" }} />

          <Box sx={{ p: 1.5 }}>
            <MenuItem
              onClick={handleClose}
              sx={{ fontWeight: 600, fontSize: 14, py: 1.2, color: "#334155" }}
            >
              <PersonIcon fontSize="small" sx={{ mr: 2, color: "#64748b" }} />
              Mi Perfil
            </MenuItem>

            {user?.role === "admin" && (
              <MenuItem
                onClick={() => {
                  handleClose();
                  navigate("/s/configuracion");
                }}
                sx={{ fontWeight: 600, fontSize: 14, py: 1.2, color: "#334155" }}
              >
                <SettingsIcon fontSize="small" sx={{ mr: 2, color: "#64748b" }} />
                Configuración
              </MenuItem>
            )}
          </Box>

          <Divider sx={{ borderColor: "rgba(226, 232, 240, 0.6)" }} />

          <MenuItem
            onClick={handleLogout}
            sx={{
              color: "#ef4444",
              fontWeight: 700,
              py: 1.8,
              fontSize: 14,
              letterSpacing: "0.2px",
              "&:hover": {
                bgcolor: "#fee2e2",
              },
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
