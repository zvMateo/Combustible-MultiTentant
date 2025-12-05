// src/components/pages/_A/Layout/AdminLayout.tsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  alpha,
  Drawer,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// Theme colors
const theme = {
  primary: "#284057",
  secondary: "#66FF99",
  primaryHover: "#2391CB",
  background: "#F8FAFB",
  surface: "#FFFFFF",
  textPrimary: "#284057",
  textSecondary: "#5A6B7D",
  border: "#E8EDF2",
};

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/a" },
  { label: "Empresas", icon: <BusinessIcon />, path: "/a/empresas" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate("/a/login");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.primary,
        color: theme.surface,
      }}
    >
      {/* Logo Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 64,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(theme.secondary, 0.2),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ color: theme.secondary }}
            >
              G
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              GoodApps
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 10 }}>
              Panel Admin
            </Typography>
          </Box>
        </Box>
        {!isMobile && (
          <IconButton sx={{ color: theme.surface, opacity: 0.7 }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: alpha(theme.surface, 0.1) }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  bgcolor: isActive
                    ? alpha(theme.secondary, 0.15)
                    : "transparent",
                  color: isActive ? theme.secondary : alpha(theme.surface, 0.8),
                  "&:hover": {
                    bgcolor: alpha(theme.secondary, 0.1),
                    color: theme.secondary,
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Section */}
      <Divider sx={{ borderColor: alpha(theme.surface, 0.1) }} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: alpha(theme.secondary, 0.2),
              color: theme.secondary,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() ||
              user?.email?.charAt(0).toUpperCase() ||
              "A"}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name || user?.email?.split("@")[0] || "Admin"}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              Super Admin
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { md: "none" },
          bgcolor: theme.primary,
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            GoodApps Admin
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(theme.secondary, 0.2),
                color: theme.secondary,
                fontSize: 12,
              }}
            >
              {user?.name?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase() ||
                "A"}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Sidebar - usando Box en lugar de Drawer */}
      <Box
        component="nav"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: DRAWER_WIDTH,
            height: "100vh",
            position: "fixed",
            top: 0,
            left: 0,
          }}
        >
          {drawerContent}
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: theme.background,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Desktop Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            display: { xs: "none", md: "flex" },
            bgcolor: theme.surface,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <Toolbar sx={{ justifyContent: "flex-end" }}>
            <Tooltip title="Configuración" arrow>
              <IconButton sx={{ color: theme.textSecondary }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: alpha(theme.primary, 0.1),
                  color: theme.primary,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "A"}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Mobile Toolbar spacer */}
        <Toolbar sx={{ display: { md: "none" } }} />

        {/* Page Content */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </Box>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: `0 4px 20px ${alpha(theme.primary, 0.15)}`,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {user?.name || user?.email?.split("@")[0] || "Admin"}
          </Typography>
          <Typography variant="caption" color={theme.textSecondary}>
            {user?.email || "admin@goodapps.com"}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Mi Perfil
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Configuración
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: theme.textSecondary }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: "inherit" }} />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>
    </Box>
  );
}
