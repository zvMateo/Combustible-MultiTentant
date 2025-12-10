import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import StoreIcon from "@mui/icons-material/Store";
import * as XLSX from "xlsx";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/queries";
import { useRoles, useUserRoles, useAddUserRole } from "@/hooks/queries";
import { useCompanies, useBusinessUnits } from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import type {
  ApiUser,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

// Helpers
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0) ?? "";
  const second = lastName?.charAt(0) ?? "";
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
  return colors[name.charCodeAt(0) % colors.length] || "#999";
};

// 🆕 Componente para mostrar roles de un usuario
function UserRoleChips({ userId }: { userId: string }) {
  const { data: userRoles = [] } = useUserRoles(userId);

  if (userRoles.length === 0) return null;

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5 }}
      >
        Roles
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {userRoles.map((role) => (
          <Chip
            key={role.id}
            label={role.name}
            size="small"
            sx={{
              bgcolor: "#8b5cf615",
              color: "#8b5cf6",
              fontWeight: 600,
              height: 20,
              fontSize: 11,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default function UsersPage() {
  const { user } = useAuthStore();
  const idCompany = user?.idCompany ?? 0;

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<ApiUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CreateUserRequest>({
    firstName: "",
    lastName: "",
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
    idCompany: idCompany || 0,
    idBusinessUnit: undefined,
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  // React Query hooks
  const { data: users = [], isLoading, error } = useUsers();
  const { data: roles = [] } = useRoles();
  const { data: companies = [] } = useCompanies();
  const { data: businessUnits = [] } = useBusinessUnits();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const addRoleMutation = useAddUserRole();

  // Obtener roles del usuario editado
  const { data: userRoles = [] } = useUserRoles(editingUser?.id || "");

  // ✅ Setear rol actual cuando se cargan los roles del usuario editado
  useEffect(() => {
    if (editingUser && userRoles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(userRoles[0]?.id || "");
    }
  }, [editingUser, userRoles, selectedRoleId]);

  // Filtrar usuarios por búsqueda y empresa
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filtrar por empresa si no es superadmin
    if (user?.role !== "superadmin" && idCompany) {
      filtered = filtered.filter((u) => u.idCompany === idCompany);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.userName.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [users, searchTerm, idCompany, user?.role]);

  const handleNew = () => {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      userName: "",
      password: "",
      confirmPassword: "",
      idCompany: 2, // Hardcoded temporalmente
      idBusinessUnit: undefined,
      phoneNumber: "",
    });
    setSelectedRoleId("");
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (userToEdit: ApiUser) => {
    setEditingUser(userToEdit);
    setFormData({
      firstName: userToEdit.firstName || "",
      lastName: userToEdit.lastName || "",
      email: userToEdit.email,
      userName: userToEdit.userName,
      password: "",
      confirmPassword: "",
      idCompany: userToEdit.idCompany || idCompany || 0,
      idBusinessUnit: userToEdit.idBusinessUnit,
      phoneNumber: userToEdit.phoneNumber || "",
    });
    setSelectedRoleId(""); // Se seteará automáticamente en el useEffect
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (userToDelete: ApiUser) => {
    setDeleteUser(userToDelete);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es obligatorio";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es obligatorio";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.userName.trim()) {
      newErrors.userName = "El nombre de usuario es obligatorio";
    }
    if (!editingUser && !formData.password.trim()) {
      newErrors.password = "La contraseña es obligatoria";
    }
    if (!editingUser && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingUser) {
        // 1️⃣ Actualizar datos del usuario
        const updateData: UpdateUserRequest = {
          id: editingUser.id,
          userName: formData.userName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        };

        await updateMutation.mutateAsync({
          userId: editingUser.id,
          data: updateData,
        });

        // 2️⃣ Solo asignar rol si cambió
        const currentRoleId = userRoles[0]?.id;
        if (selectedRoleId && selectedRoleId !== currentRoleId) {
          await addRoleMutation.mutateAsync({
            userId: editingUser.id,
            roleData: { roleId: selectedRoleId },
          });
        }
      } else {
        // Crear nuevo usuario
        const dataToSend = {
          ...formData,
          idCompany: 2, // Hardcoded temporalmente
        };

        const newUser = await createMutation.mutateAsync(dataToSend);

        // Asignar rol si se seleccionó uno y tenemos el ID
        if (selectedRoleId && newUser?.id) {
          await addRoleMutation.mutateAsync({
            userId: newUser.id,
            roleData: { roleId: selectedRoleId },
          });
        }
      }
      setOpenDialog(false);
    } catch (error) {
      console.error("❌ Error al guardar:", error);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredUsers.map((u) => {
      const company = companies.find((c) => c.id === u.idCompany);
      const businessUnit = businessUnits.find(
        (bu) => bu.id === u.idBusinessUnit
      );
      return {
        Nombre: u.firstName || "",
        Apellido: u.lastName || "",
        Email: u.email,
        "Nombre Usuario": u.userName,
        Teléfono: u.phoneNumber || "",
        Empresa: company?.name || "",
        "Unidad de Negocio": businessUnit?.name || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `users_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            // @ts-expect-error - MUI v7 Grid type incompatibility
            <Grid xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error al cargar usuarios:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </Alert>
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
            Usuarios
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            {filteredUsers.length}{" "}
            {filteredUsers.length === 1 ? "user" : "Usuarios"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={filteredUsers.length === 0}
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
            disabled={createMutation.isPending}
            sx={{
              bgcolor: "#3b82f6",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

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
      </Box>

      {/* Grid users */}
      <Grid container spacing={3}>
        {filteredUsers.map((userItem) => {
          const company = companies.find((c) => c.id === userItem.idCompany);
          const businessUnit = businessUnits.find(
            (bu) => bu.id === userItem.idBusinessUnit
          );
          return (
            // @ts-expect-error - MUI v7 Grid type incompatibility
            <Grid xs={12} sm={6} md={4} key={userItem.id}>
              <Card
                elevation={0}
                sx={{
                  background: "white",
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  height: "100%",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                    transform: "translateY(-3px)",
                    borderColor: "#cbd5f5",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header user */}
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
                        bgcolor: getAvatarColor(userItem.userName),
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(userItem.firstName, userItem.lastName)}
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
                        {userItem.firstName} {userItem.lastName || ""}
                      </Typography>

                      <Box
                        sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}
                      >
                        <Chip
                          label={userItem.userName}
                          size="small"
                          sx={{
                            bgcolor: "#f1f5f9",
                            color: "#475569",
                            fontWeight: 600,
                            height: 22,
                            fontSize: 11,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Acciones */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        ml: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(userItem)}
                        disabled={updateMutation.isPending}
                        sx={{
                          bgcolor: "#eef2ff",
                          color: "#1d4ed8",
                          "&:hover": { bgcolor: "#e0e7ff" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
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
                        {userItem.email}
                      </Typography>
                    </Box>

                    {userItem.phoneNumber && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.3 }}
                        >
                          Teléfono
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
                            {userItem.phoneNumber}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* 🆕 Mostrar roles del usuario */}
                    <UserRoleChips userId={userItem.id} />

                    {/* Mostrar empresa y unidad */}
                    {company && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.3 }}
                        >
                          Empresa
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                          }}
                        >
                          <StoreIcon sx={{ fontSize: 18, color: "#64748b" }} />
                          <Typography variant="body2" fontWeight={500}>
                            {company.name}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {businessUnit && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.3 }}
                        >
                          Unidad de Negocio
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {businessUnit.name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredUsers.length === 0 && !isLoading && (
        <Box sx={{ textAlign: "center", py: 8, width: "100%" }}>
          <PersonIcon sx={{ fontSize: 64, color: "#e5e7eb", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay usuarios registrados
          </Typography>
        </Box>
      )}

      {/* Dialog crear / editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
          >
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
              <TextField
                fullWidth
                label="Apellido"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                error={!!errors.lastName}
                helperText={errors.lastName}
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
              label="Nombre de Usuario"
              value={formData.userName}
              onChange={(e) =>
                setFormData({ ...formData, userName: e.target.value })
              }
              error={!!errors.userName}
              helperText={errors.userName}
              required
            />

            {!editingUser && (
              <>
                <TextField
                  fullWidth
                  type="password"
                  label="Contraseña"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={!!errors.password}
                  helperText={errors.password}
                  required
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirmar Contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  required
                />
              </>
            )}

            <TextField
              fullWidth
              label="Teléfono (opcional)"
              value={formData.phoneNumber || ""}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneAndroidIcon sx={{ color: "#999" }} />
                  </InputAdornment>
                ),
              }}
            />

            {companies.length > 0 &&
              (user?.role === "superadmin" || companies.length > 1) && (
                <FormControl fullWidth error={!!errors.idCompany}>
                  <InputLabel>Empresa *</InputLabel>
                  <Select
                    value={formData.idCompany}
                    label="Empresa *"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idCompany: Number(e.target.value),
                      })
                    }
                  >
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.idCompany && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.idCompany}
                    </Typography>
                  )}
                </FormControl>
              )}

            <FormControl fullWidth>
              <InputLabel>Unidad de Negocio (opcional)</InputLabel>
              <Select
                value={formData.idBusinessUnit || ""}
                label="Unidad de Negocio (opcional)"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idBusinessUnit: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {businessUnits
                  .filter((bu) => bu.idCompany === formData.idCompany)
                  .map((bu) => (
                    <MenuItem key={bu.id} value={bu.id}>
                      {bu.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={selectedRoleId}
                label="Rol"
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              addRoleMutation.isPending
            }
            sx={{ borderRadius: 2, bgcolor: "#3b82f6" }}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : editingUser
              ? "Guardar Cambios"
              : "Crear Usuario"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
