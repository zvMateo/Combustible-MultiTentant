// src/components/pages/_S/Usuarios/UsuariosPage.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Typography,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import StoreIcon from "@mui/icons-material/Store";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useUnidadStore } from "@/stores/unidad.store";
import type { UserRole as AppUserRole } from "@/types";
import * as XLSX from "xlsx";

// Tipos locales
type UserRole = "admin" | "supervisor" | "operador" | "auditor";

interface Usuario {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  whatsapp?: string;
  rol: UserRole;
  activo: boolean;
  empresaId: number;
  empresaNombre?: string;
  unidadId?: number;
  unidadNombre?: string;
}

interface UsuarioFormData {
  nombre: string;
  apellido: string;
  email: string;
  whatsapp: string;
  rol: UserRole;
  activo: boolean;
  unidadId: number | null;
}

interface FormErrors {
  [key: string]: string;
}

// Roles disponibles según el rol del usuario actual
const ROLES_BY_CURRENT_USER: Record<AppUserRole, UserRole[]> = {
  superadmin: ["admin", "supervisor", "operador", "auditor"],
  admin: ["admin", "supervisor", "operador", "auditor"],
  supervisor: ["operador", "auditor"], // Supervisor solo puede crear operadores y auditores
  operador: [],
  auditor: [],
};

// Helpers
const getInitials = (nombre: string, apellido?: string): string => {
  const first = nombre?.charAt(0) ?? "";
  const second = apellido?.charAt(0) ?? "";
  return (first + second).toUpperCase();
};

const getAvatarColor = (name: string): string => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index] ?? "#999";
};

const getRolColor = (rol: UserRole): { bg: string; color: string } => {
  const colors: Record<UserRole, { bg: string; color: string }> = {
    admin: { bg: "#3b82f615", color: "#3b82f6" },
    supervisor: { bg: "#10b98115", color: "#10b981" },
    operador: { bg: "#f59e0b15", color: "#f59e0b" },
    auditor: { bg: "#6b728015", color: "#6b7280" },
  };
  return colors[rol] || { bg: "#99999915", color: "#999" };
};

const getRolLabel = (rol: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: "Administrador",
    supervisor: "Supervisor",
    operador: "Operador",
    auditor: "Auditor",
  };
  return labels[rol] || rol;
};

// Mock data con unidades
const mockUsuarios: Usuario[] = [
  {
    id: 1,
    nombre: "Carlos",
    apellido: "Rodríguez",
    email: "carlos.rodriguez@empresa.com",
    whatsapp: "+5493512345678",
    rol: "admin",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
    unidadId: undefined, // Admin ve todas
    unidadNombre: undefined,
  },
  {
    id: 2,
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan.perez@empresa.com",
    whatsapp: "+5493519876543",
    rol: "supervisor",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
    unidadId: 1,
    unidadNombre: "Campo Norte",
  },
  {
    id: 3,
    nombre: "María",
    apellido: "García",
    email: "maria.garcia@empresa.com",
    whatsapp: "+5493581234567",
    rol: "supervisor",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
    unidadId: 2,
    unidadNombre: "Campo Sur",
  },
  {
    id: 4,
    nombre: "Pedro",
    apellido: "López",
    email: "pedro.lopez@empresa.com",
    whatsapp: "+5493514567890",
    rol: "operador",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
    unidadId: 1,
    unidadNombre: "Campo Norte",
  },
  {
    id: 5,
    nombre: "Ana",
    apellido: "Martínez",
    email: "ana.martinez@empresa.com",
    rol: "auditor",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
    unidadId: 1,
    unidadNombre: "Campo Norte",
  },
];

export default function UsuariosPage() {
  const { user } = useAuthStore();
  const { tenantConfig } = useTenantStore();
  const { unidades, unidadActiva } = useUnidadStore();
  const tenantName = tenantConfig?.name;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteUsuario, setDeleteUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRol, setFilterRol] = useState<string>("Todos");
  const [formData, setFormData] = useState<UsuarioFormData>({
    nombre: "",
    apellido: "",
    email: "",
    whatsapp: "",
    rol: "operador",
    activo: true,
    unidadId: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Determinar si el usuario actual es admin o supervisor
  const isAdmin = user?.role === "admin";
  const isSupervisor = user?.role === "supervisor";
  const currentUserUnidades = user?.unidadesAsignadas ?? [];

  // Roles que puede crear el usuario actual
  const availableRoles = useMemo(() => {
    return ROLES_BY_CURRENT_USER[user?.role ?? "operador"] ?? [];
  }, [user?.role]);

  // Unidades disponibles para asignar
  const unidadesDisponibles = useMemo(() => {
    if (isAdmin) {
      return unidades; // Admin puede asignar a cualquier unidad
    }
    // Supervisor solo puede asignar a sus unidades
    return unidades.filter((u) => currentUserUnidades.includes(u.id));
  }, [isAdmin, unidades, currentUserUnidades]);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filtrar usuarios según el rol del usuario actual
      let filteredData = [...mockUsuarios];

      if (isSupervisor) {
        // Supervisor solo ve usuarios de su(s) unidad(es)
        filteredData = filteredData.filter(
          (u) => u.unidadId && currentUserUnidades.includes(u.unidadId)
        );
      }

      setUsuarios(filteredData);
      setLoading(false);
    };
    fetchData();
  }, [isSupervisor, currentUserUnidades]);

  // Filtrar usuarios por búsqueda, rol y unidad activa
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        u.nombre.toLowerCase().includes(term) ||
        (u.apellido && u.apellido.toLowerCase().includes(term)) ||
        u.email.toLowerCase().includes(term);
      const matchRol = filterRol === "Todos" || u.rol === filterRol;

      // Filtrar por unidad activa (solo si está seleccionada)
      const matchUnidad =
        !unidadActiva || u.unidadId === unidadActiva.id || !u.unidadId;

      return matchSearch && matchRol && matchUnidad;
    });
  }, [usuarios, searchTerm, filterRol, unidadActiva]);

  const handleExport = (): void => {
    const dataToExport = filteredUsuarios.map((u) => ({
      Nombre: u.nombre,
      Apellido: u.apellido || "",
      Email: u.email,
      WhatsApp: u.whatsapp || "Sin WhatsApp",
      Rol: getRolLabel(u.rol),
      Unidad: u.unidadNombre || "Todas",
      Estado: u.activo ? "Activo" : "Inactivo",
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(
      wb,
      `Usuarios_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleNew = (): void => {
    setEditingUsuario(null);

    // Auto-asignar unidad si es supervisor
    const defaultUnidadId = isSupervisor
      ? currentUserUnidades[0] ?? null
      : null;

    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      whatsapp: "",
      rol: "operador",
      activo: true,
      unidadId: defaultUnidadId,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (usuario: Usuario): void => {
    // Supervisor no puede editar usuarios fuera de su unidad
    if (isSupervisor && usuario.unidadId && !currentUserUnidades.includes(usuario.unidadId)) {
      return;
    }

    // Supervisor no puede editar admins o supervisores
    if (isSupervisor && (usuario.rol === "admin" || usuario.rol === "supervisor")) {
      return;
    }

    setEditingUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido || "",
      email: usuario.email,
      whatsapp: usuario.whatsapp || "",
      rol: usuario.rol,
      activo: usuario.activo,
      unidadId: usuario.unidadId ?? null,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.apellido.trim())
      newErrors.apellido = "El apellido es obligatorio";
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (
      formData.whatsapp &&
      !/^\+?\d{10,15}$/.test(formData.whatsapp.replace(/\s/g, ""))
    ) {
      newErrors.whatsapp = "Formato inválido (ej: +5493512345678)";
    }
    if (!formData.rol) newErrors.rol = "El rol es obligatorio";

    // Validar que se seleccione unidad para roles que lo requieren
    if (formData.rol !== "admin" && !formData.unidadId) {
      newErrors.unidadId = "Debe seleccionar una unidad";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (): Promise<void> => {
    if (!validate()) return;

    try {
      const unidadSeleccionada = unidades.find((u) => u.id === formData.unidadId);

      if (editingUsuario) {
        setUsuarios(
          usuarios.map((u) =>
            u.id === editingUsuario.id
              ? {
                  ...editingUsuario,
                  ...formData,
                  unidadNombre: unidadSeleccionada?.nombre,
                }
              : u
          )
        );
      } else {
        const newUsuario: Usuario = {
          id: Math.max(...usuarios.map((u) => u.id), 0) + 1,
          ...formData,
          empresaId: user?.empresaId ?? 1,
          empresaNombre: tenantName,
          unidadNombre: unidadSeleccionada?.nombre,
        };
        setUsuarios([...usuarios, newUsuario]);
      }
      setOpenDialog(false);
    } catch (error) {
      console.error("Error saving usuario:", error);
    }
  };

  const handleDeleteClick = (usuario: Usuario): void => {
    // Supervisor no puede eliminar usuarios fuera de su unidad
    if (isSupervisor && usuario.unidadId && !currentUserUnidades.includes(usuario.unidadId)) {
      return;
    }

    // Supervisor no puede eliminar admins o supervisores
    if (isSupervisor && (usuario.rol === "admin" || usuario.rol === "supervisor")) {
      return;
    }

    setDeleteUsuario(usuario);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async (): Promise<void> => {
    if (deleteUsuario) {
      setUsuarios(usuarios.filter((u) => u.id !== deleteUsuario.id));
    }
    setOpenDeleteDialog(false);
    setDeleteUsuario(null);
  };

  // Verificar si puede editar/eliminar un usuario
  const canModifyUser = (usuario: Usuario): boolean => {
    if (isAdmin) return true;
    if (isSupervisor) {
      // No puede modificar admins o supervisores
      if (usuario.rol === "admin" || usuario.rol === "supervisor") return false;
      // Solo puede modificar usuarios de su unidad
      if (usuario.unidadId && !currentUserUnidades.includes(usuario.unidadId)) return false;
      return true;
    }
    return false;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <LinearProgress sx={{ width: "50%" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mt: -3,
          mb: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
              mb: 0.5,
            }}
          >
            Gestión de Usuarios
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            {filteredUsuarios.length}{" "}
            {filteredUsuarios.length === 1 ? "usuario" : "usuarios"}
            {isSupervisor && (
              <Chip
                icon={<StoreIcon sx={{ fontSize: 14 }} />}
                label="Solo tu unidad"
                size="small"
                sx={{ ml: 1, fontSize: 11, height: 22 }}
              />
            )}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={filteredUsuarios.length === 0}
            sx={{
              borderColor: "#10b981",
              color: "#10b981",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { borderColor: "#059669", bgcolor: "#10b98110" },
            }}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
            sx={{
              bgcolor: "#3b82f6",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            Nuevo usuario
          </Button>
        </Box>
      </Box>

      {/* Info para supervisor */}
      {isSupervisor && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          Como supervisor, puedes crear <strong>operadores</strong> y{" "}
          <strong>auditores</strong> para tu unidad de negocio.
        </Alert>
      )}

      {/* Filtros */}
      <Box
        sx={{
          mb: 3,
          background: "white",
          borderRadius: 2,
          border: "1px solid #e2e8f0",
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Buscar por nombre, apellido o email..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          label="Rol"
          value={filterRol}
          onChange={(e) => setFilterRol(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="Todos">Todos los roles</MenuItem>
          {availableRoles.map((rol) => (
            <MenuItem key={rol} value={rol}>
              {getRolLabel(rol)}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Grid usuarios */}
      <Grid container spacing={3}>
        {filteredUsuarios.map((usuario) => (
          <Grid item component="div" xs={12} sm={6} md={4} key={usuario.id}>
            <Card
              elevation={0}
              sx={{
                background: "white",
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                height: "100%",
                transition: "all 0.25s ease",
                opacity: canModifyUser(usuario) ? 1 : 0.7,
                "&:hover": {
                  boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                  transform: canModifyUser(usuario) ? "translateY(-3px)" : "none",
                  borderColor: "#cbd5f5",
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header usuario */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    mb: 2.5,
                    gap: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: getAvatarColor(usuario.nombre),
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(usuario.nombre, usuario.apellido)}
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {usuario.nombre} {usuario.apellido || ""}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      <Chip
                        label={getRolLabel(usuario.rol)}
                        size="small"
                        sx={{
                          bgcolor: getRolColor(usuario.rol).bg,
                          color: getRolColor(usuario.rol).color,
                          fontWeight: 600,
                          height: 22,
                          fontSize: 11,
                        }}
                      />
                      <Chip
                        label={usuario.activo ? "Activo" : "Inactivo"}
                        size="small"
                        sx={{
                          bgcolor: usuario.activo ? "#10b98115" : "#e5e7eb",
                          color: usuario.activo ? "#10b981" : "#6b7280",
                          fontWeight: 600,
                          height: 22,
                          fontSize: 11,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Acciones */}
                  {canModifyUser(usuario) && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        ml: 0.5,
                      }}
                    >
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(usuario)}
                          sx={{
                            bgcolor: "#eef2ff",
                            color: "#1d4ed8",
                            "&:hover": { bgcolor: "#e0e7ff" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(usuario)}
                          sx={{
                            bgcolor: "#fee2e2",
                            color: "#dc2626",
                            "&:hover": { bgcolor: "#fecaca" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                {/* Detalles */}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.3 }}
                    >
                      Email
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ wordBreak: "break-word" }}
                    >
                      {usuario.email}
                    </Typography>
                  </Box>

                  {usuario.whatsapp && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.3 }}
                      >
                        WhatsApp
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <PhoneAndroidIcon
                          sx={{ fontSize: 18, color: "#10b981" }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {usuario.whatsapp}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Mostrar unidad */}
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.3 }}
                    >
                      Unidad de Negocio
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <StoreIcon sx={{ fontSize: 18, color: "#64748b" }} />
                      <Typography variant="body2" fontWeight={500}>
                        {usuario.unidadNombre || "Todas las unidades"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {filteredUsuarios.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8, width: "100%" }}>
            <PersonIcon sx={{ fontSize: 64, color: "#e5e7eb", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay usuarios registrados
            </Typography>
          </Box>
        )}
      </Grid>

      {/* Dialog crear / editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                error={!!errors.nombre}
                helperText={errors.nombre}
                required
              />
              <TextField
                fullWidth
                label="Apellido"
                value={formData.apellido}
                onChange={(e) =>
                  setFormData({ ...formData, apellido: e.target.value })
                }
                error={!!errors.apellido}
                helperText={errors.apellido}
                required
              />
            </Box>

            <TextField
              fullWidth
              type="email"
              label="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={!!errors.email}
              helperText={errors.email}
              required
            />

            <TextField
              fullWidth
              label="Número WhatsApp (opcional)"
              placeholder="+5493512345678"
              value={formData.whatsapp}
              onChange={(e) =>
                setFormData({ ...formData, whatsapp: e.target.value })
              }
              error={!!errors.whatsapp}
              helperText={
                errors.whatsapp || "Para recibir notificaciones vía WhatsApp"
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneAndroidIcon sx={{ color: "#999" }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth error={!!errors.rol}>
                <InputLabel>Rol *</InputLabel>
                <Select
                  value={formData.rol}
                  label="Rol *"
                  onChange={(e) =>
                    setFormData({ ...formData, rol: e.target.value as UserRole })
                  }
                >
                  {availableRoles.map((rol) => (
                    <MenuItem key={rol} value={rol}>
                      {getRolLabel(rol)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.rol && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.rol}
                  </Typography>
                )}
              </FormControl>

              {/* Selector de unidad - oculto para admins en ciertos casos */}
              {formData.rol !== "admin" && (
                <FormControl fullWidth error={!!errors.unidadId}>
                  <InputLabel>Unidad *</InputLabel>
                  <Select
                    value={formData.unidadId ?? ""}
                    label="Unidad *"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unidadId: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    disabled={isSupervisor && unidadesDisponibles.length === 1}
                  >
                    {unidadesDisponibles.map((unidad) => (
                      <MenuItem key={unidad.id} value={unidad.id}>
                        {unidad.nombre} ({unidad.codigo})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.unidadId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.unidadId}
                    </Typography>
                  )}
                </FormControl>
              )}
            </Box>

            {/* Info de ayuda según el rol */}
            {formData.rol && (
              <Alert
                severity="info"
                sx={{
                  bgcolor: alpha(getRolColor(formData.rol).color, 0.08),
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2">
                  {formData.rol === "admin" &&
                    "El administrador tiene acceso completo a todas las unidades de negocio."}
                  {formData.rol === "supervisor" &&
                    "El supervisor gestiona la flota, usuarios y valida eventos de su unidad."}
                  {formData.rol === "operador" &&
                    "El operador registra cargas de combustible vía WhatsApp."}
                  {formData.rol === "auditor" &&
                    "El auditor solo tiene acceso de lectura para auditorías."}
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2">Estado:</Typography>
              <Chip
                label={formData.activo ? "Activo" : "Inactivo"}
                onClick={() =>
                  setFormData({ ...formData, activo: !formData.activo })
                }
                sx={{
                  bgcolor: formData.activo ? "#10b98115" : "#e5e7eb",
                  color: formData.activo ? "#10b981" : "#6b7280",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ borderRadius: 2, bgcolor: "#3b82f6" }}
          >
            {editingUsuario ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog eliminar */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar al usuario{" "}
            <strong>
              {deleteUsuario?.nombre} {deleteUsuario?.apellido || ""}
            </strong>
            ?
          </Typography>
          <Typography variant="body2" sx={{ color: "#ef4444", mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ borderRadius: 2 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
