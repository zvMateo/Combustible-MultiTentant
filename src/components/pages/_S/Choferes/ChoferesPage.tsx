// src/components/pages/_S/Choferes/ChoferesPage.tsx
import { useState, useMemo } from "react";
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
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import BadgeIcon from "@mui/icons-material/Badge";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Hooks y stores
import { useTenantStore } from "@/stores/tenant.store";
import { useUnidadStore } from "@/stores/unidad.store";
import {
  useChoferes,
  useCreateChofer,
  useUpdateChofer,
  useDeleteChofer,
  useVehiculos,
} from "@/hooks/queries";

// Types
import type {
  Chofer,
  ChoferFormData,
  EstadoChofer,
  TipoLicencia,
} from "@/types";
import { ESTADOS_CHOFER, TIPOS_LICENCIA } from "@/types";

// Colores para avatares
const getAvatarColor = (nombre: string): string => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];
  return colors[nombre.charCodeAt(0) % colors.length];
};

// Obtener iniciales
const getInitials = (nombre: string, apellido: string): string => {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
};

// Estado inicial del formulario
const getInitialFormData = (): ChoferFormData => ({
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  email: "",
  whatsappNumber: "",
  licenciaTipo: undefined,
  licenciaVencimiento: "",
  estado: "activo",
  vehiculoAsignadoId: undefined,
  unidadId: undefined,
  observaciones: "",
  activo: true,
});

interface FormErrors {
  [key: string]: string;
}

export default function ChoferesPage() {
  // Stores
  const { user, hasPermission } = useTenantStore();
  const { unidades } = useUnidadStore();
  const canManage = hasPermission("choferes:gestionar");

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingChofer, setEditingChofer] = useState<Chofer | null>(null);
  const [deleteChofer, setDeleteChofer] = useState<Chofer | null>(null);

  // Formulario
  const [formData, setFormData] = useState<ChoferFormData>(
    getInitialFormData()
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  // React Query hooks
  const {
    data: choferesData,
    isLoading,
    error,
  } = useChoferes({
    search: searchTerm || undefined,
    estado:
      filterEstado !== "todos" ? (filterEstado as EstadoChofer) : undefined,
  });

  // Vehículos disponibles para asignar
  const { data: vehiculosData } = useVehiculos();

  const createMutation = useCreateChofer();
  const updateMutation = useUpdateChofer();
  const deleteMutation = useDeleteChofer();

  // Choferes filtrados
  const choferes = useMemo(() => {
    return choferesData?.data || [];
  }, [choferesData]);

  // Vehículos disponibles
  const vehiculos = useMemo(() => {
    return vehiculosData?.data || [];
  }, [vehiculosData]);

  // Dropzone para imagen
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setImageFile(acceptedFiles[0]);
      }
    },
    accept: { "image/*": [] },
    multiple: false,
  });

  // Handlers
  const handleNew = () => {
    setEditingChofer(null);
    setFormData(getInitialFormData());
    setImageFile(null);
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (chofer: Chofer) => {
    setEditingChofer(chofer);
    setFormData({
      nombre: chofer.nombre,
      apellido: chofer.apellido,
      dni: chofer.dni,
      telefono: chofer.telefono || "",
      email: chofer.email || "",
      whatsappNumber: chofer.whatsappNumber || "",
      licenciaTipo: chofer.licenciaTipo,
      licenciaVencimiento: chofer.licenciaVencimiento || "",
      estado: chofer.estado,
      vehiculoAsignadoId: chofer.vehiculoAsignadoId,
      unidadId: chofer.unidadId,
      observaciones: chofer.observaciones,
      activo: chofer.activo,
    });
    setImageFile(null);
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (chofer: Chofer) => {
    setDeleteChofer(chofer);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }
    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es obligatorio";
    }
    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es obligatorio";
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = "DNI inválido (7-8 dígitos)";
    }
    if (
      formData.whatsappNumber &&
      !/^\+?\d{10,15}$/.test(formData.whatsappNumber.replace(/\s/g, ""))
    ) {
      newErrors.whatsappNumber = "Formato inválido (ej: +5493512345678)";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingChofer) {
        await updateMutation.mutateAsync({
          id: editingChofer.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setOpenDialog(false);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteChofer) return;

    try {
      await deleteMutation.mutateAsync(deleteChofer.id);
      setOpenDeleteDialog(false);
      setDeleteChofer(null);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = choferes.map((c) => ({
      Nombre: c.nombre,
      Apellido: c.apellido,
      DNI: c.dni,
      Teléfono: c.telefono || "",
      WhatsApp: c.whatsappNumber || "",
      Email: c.email || "",
      "Tipo Licencia": c.licenciaTipo
        ? TIPOS_LICENCIA.find((t) => t.value === c.licenciaTipo)?.label
        : "",
      Estado:
        ESTADOS_CHOFER.find((e) => e.value === c.estado)?.label || c.estado,
      ...(user?.role === "admin" && {
        "Unidad de Negocio": c.unidadNombre || "Sin asignar",
      }),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Choferes");
    XLSX.writeFile(
      wb,
      `Choferes_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Archivo exportado correctamente");
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
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
          Error al cargar choferes: {error.message}
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
          alignItems: "center",
          mb: 1.5,
          mt: -3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, lineHeight: 1.1, mb: 0.5 }}
          >
            Gestión de Choferes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {choferes.length} {choferes.length === 1 ? "chofer" : "choferes"}{" "}
            registrados
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={choferes.length === 0}
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
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
              sx={{
                bgcolor: "#1E2C56",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#16213E" },
              }}
            >
              Nuevo Chofer
            </Button>
          )}
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
          placeholder="Buscar por nombre, apellido o DNI..."
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
          label="Estado"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="todos">Todos los estados</MenuItem>
          {ESTADOS_CHOFER.map((estado) => (
            <MenuItem key={estado.value} value={estado.value}>
              {estado.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Grid de choferes */}
      <Grid container spacing={3}>
        {choferes.map((chofer) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={chofer.id}>
            <Card
              elevation={0}
              sx={{
                background: "white",
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.25s ease",
                "&:hover": {
                  boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                  transform: "translateY(-3px)",
                  borderColor: "#10b981",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2.5,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header con avatar */}
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      bgcolor: getAvatarColor(chofer.nombre),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    {getInitials(chofer.nombre, chofer.apellido)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {chofer.nombre} {chofer.apellido}
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <BadgeIcon sx={{ fontSize: 14, color: "#6b7280" }} />
                      <Typography variant="body2" color="text.secondary">
                        {chofer.dni}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Info de contacto */}
                {chofer.whatsappNumber && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 1,
                    }}
                  >
                    <PhoneAndroidIcon sx={{ fontSize: 16, color: "#10b981" }} />
                    <Typography variant="body2">
                      {chofer.whatsappNumber}
                    </Typography>
                  </Box>
                )}

                {/* Licencia */}
                {chofer.licenciaTipo && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Licencia:{" "}
                      {TIPOS_LICENCIA.find(
                        (t) => t.value === chofer.licenciaTipo
                      )?.label || chofer.licenciaTipo}
                    </Typography>
                  </Box>
                )}

                {/* Vehículo asignado */}
                {chofer.vehiculoAsignadoId && (
                  <Box sx={{ mb: 1.5 }}>
                    <Chip
                      icon={<DirectionsCarIcon sx={{ fontSize: 16 }} />}
                      label={
                        vehiculos.find(
                          (v) => v.id === chofer.vehiculoAsignadoId
                        )?.patente || "Vehículo asignado"
                      }
                      size="small"
                      sx={{ bgcolor: "#3b82f615", color: "#3b82f6" }}
                    />
                  </Box>
                )}

                {/* Chips de estado */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <Chip
                    label={
                      ESTADOS_CHOFER.find((e) => e.value === chofer.estado)
                        ?.label || chofer.estado
                    }
                    size="small"
                    sx={{
                      bgcolor:
                        chofer.estado === "activo" ? "#10b98115" : "#f59e0b15",
                      color: chofer.estado === "activo" ? "#10b981" : "#f59e0b",
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {/* Unidad de negocio (solo admin) */}
                {user?.role === "admin" && chofer.unidadNombre && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    📍 {chofer.unidadNombre}
                  </Typography>
                )}

                {/* Acciones */}
                {canManage && (
                  <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(chofer)}
                      sx={{
                        bgcolor: "#f3f4f6",
                        "&:hover": { bgcolor: "#e5e7eb" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(chofer)}
                      sx={{
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        "&:hover": { bgcolor: "#fecaca" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty state */}
      {choferes.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <PersonIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay choferes registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {canManage
              ? "Haz clic en 'Nuevo Chofer' para agregar uno"
              : "No tienes choferes asignados"}
          </Typography>
        </Box>
      )}

      {/* Diálogo de crear/editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingChofer ? "Editar Chofer" : "Nuevo Chofer"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 3, pt: 2 }}>
            {/* Formulario */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    error={!!errors.nombre}
                    helperText={errors.nombre}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Apellido"
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido: e.target.value })
                    }
                    error={!!errors.apellido}
                    helperText={errors.apellido}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="DNI"
                    value={formData.dni}
                    onChange={(e) =>
                      setFormData({ ...formData, dni: e.target.value })
                    }
                    error={!!errors.dni}
                    helperText={errors.dni}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Teléfono"
                    value={formData.telefono || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="WhatsApp"
                    value={formData.whatsappNumber || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappNumber: e.target.value,
                      })
                    }
                    error={!!errors.whatsappNumber}
                    helperText={
                      errors.whatsappNumber || "Formato: +54 9 351 234 5678"
                    }
                    placeholder="+54 9 11 1234-5678"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneAndroidIcon sx={{ color: "#9ca3af" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    error={!!errors.email}
                    helperText={errors.email}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Tipo de Licencia"
                    value={formData.licenciaTipo || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenciaTipo:
                          (e.target.value as TipoLicencia) || undefined,
                      })
                    }
                    fullWidth
                  >
                    <MenuItem value="">Sin especificar</MenuItem>
                    {TIPOS_LICENCIA.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Vencimiento Licencia"
                    type="date"
                    value={formData.licenciaVencimiento || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenciaVencimiento: e.target.value,
                      })
                    }
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Estado"
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado: e.target.value as EstadoChofer,
                      })
                    }
                    fullWidth
                  >
                    {ESTADOS_CHOFER.map((estado) => (
                      <MenuItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Vehículo Asignado"
                    value={formData.vehiculoAsignadoId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehiculoAsignadoId: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    fullWidth
                  >
                    <MenuItem value="">Sin asignar</MenuItem>
                    {vehiculos.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.patente} - {v.marca} {v.modelo}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Selector de unidad (solo admin) */}
                {user?.role === "admin" && unidades.length > 0 && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Unidad de Negocio</InputLabel>
                      <Select
                        value={formData.unidadId || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unidadId: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        label="Unidad de Negocio"
                      >
                        <MenuItem value="">Sin asignar</MenuItem>
                        {unidades.map((unidad) => (
                          <MenuItem key={unidad.id} value={unidad.id}>
                            {unidad.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    label="Observaciones"
                    value={formData.observaciones || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        observaciones: e.target.value,
                      })
                    }
                    multiline
                    rows={2}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Dropzone para foto */}
            <Box
              {...getRootProps()}
              sx={{
                width: 180,
                minHeight: 180,
                borderRadius: 2,
                bgcolor: isDragActive ? "#d1fae5" : "#f3f4f6",
                border: "2px dashed #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                "&:hover": { bgcolor: "#d1fae5" },
              }}
            >
              <input
                {...(getInputProps() as React.InputHTMLAttributes<HTMLInputElement>)}
              />
              {imageFile ? (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <PersonIcon sx={{ fontSize: 40, color: "#9ca3af", mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Arrastrá o clickeá para subir foto
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{ bgcolor: "#1E2C56", "&:hover": { bgcolor: "#16213E" } }}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : editingChofer
              ? "Guardar Cambios"
              : "Crear Chofer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar al chofer{" "}
            <strong>
              {deleteChofer?.nombre} {deleteChofer?.apellido}
            </strong>
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
