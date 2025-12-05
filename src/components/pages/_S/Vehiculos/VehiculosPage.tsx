// src/components/pages/_S/Vehiculos/VehiculosPage.tsx
import { useState, useMemo } from "react";
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
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SpeedIcon from "@mui/icons-material/Speed";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Hooks y stores
import { useTenantStore } from "@/stores/tenant.store";
import { useUnidadStore } from "@/stores/unidad.store";
import {
  useVehiculos,
  useCreateVehiculo,
  useUpdateVehiculo,
  useDeleteVehiculo,
} from "@/hooks/queries";

// Types
import type {
  VehiculoConStats,
  VehiculoFormData,
  TipoVehiculo,
  TipoCombustible,
  EstadoVehiculo,
} from "@/types";
import {
  TIPOS_VEHICULO,
  TIPOS_COMBUSTIBLE,
  ESTADOS_VEHICULO,
} from "@/types";

// Colores por tipo de vehículo
const getColorByTipo = (tipo: TipoVehiculo): string => {
  const colors: Record<TipoVehiculo, string> = {
    camion: "#3b82f6",
    tractor: "#10b981",
    sembradora: "#f59e0b",
    cosechadora: "#8b5cf6",
    pulverizadora: "#ec4899",
    pickup: "#06b6d4",
    automovil: "#6366f1",
    utilitario: "#14b8a6",
    maquinaria: "#f97316",
    otro: "#667eea",
  };
  return colors[tipo] || "#667eea";
};

// Estado inicial del formulario
const getInitialFormData = (): VehiculoFormData => ({
  patente: "",
  marca: "",
  modelo: "",
  anio: new Date().getFullYear(),
  tipo: "camion",
  tipoCombustible: "diesel",
  capacidadTanque: 0,
  kmActual: 0,
  horasActual: 0,
  estado: "activo",
  choferAsignadoId: undefined,
  centroCostoId: undefined,
  unidadId: undefined,
  observaciones: "",
  activo: true,
});

interface FormErrors {
  [key: string]: string;
}

export default function VehiculosPage() {
  // Stores
  const { user, hasPermission } = useTenantStore();
  const { unidades } = useUnidadStore();
  const canManage = hasPermission("vehiculos:gestionar");

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoConStats | null>(null);
  const [deleteVehiculo, setDeleteVehiculo] = useState<VehiculoConStats | null>(null);

  // Formulario
  const [formData, setFormData] = useState<VehiculoFormData>(getInitialFormData());
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  // React Query hooks
  const { data: vehiculosData, isLoading, error } = useVehiculos({
    search: searchTerm || undefined,
    tipo: filterTipo !== "todos" ? (filterTipo as TipoVehiculo) : undefined,
    estado: filterEstado !== "todos" ? (filterEstado as EstadoVehiculo) : undefined,
  });

  const createMutation = useCreateVehiculo();
  const updateMutation = useUpdateVehiculo();
  const deleteMutation = useDeleteVehiculo();

  // Vehículos filtrados (ya vienen filtrados por unidad desde el hook)
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
    setEditingVehiculo(null);
    setFormData(getInitialFormData());
    setImageFile(null);
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (vehiculo: VehiculoConStats) => {
    setEditingVehiculo(vehiculo);
    setFormData({
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      tipo: vehiculo.tipo,
      tipoCombustible: vehiculo.tipoCombustible,
      capacidadTanque: vehiculo.capacidadTanque,
      kmActual: vehiculo.kmActual,
      horasActual: vehiculo.horasActual,
      estado: vehiculo.estado,
      choferAsignadoId: vehiculo.choferAsignadoId,
      centroCostoId: vehiculo.centroCostoId,
      unidadId: vehiculo.unidadId,
      observaciones: vehiculo.observaciones,
      activo: vehiculo.activo,
    });
    setImageFile(null);
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (vehiculo: VehiculoConStats) => {
    setDeleteVehiculo(vehiculo);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.patente.trim()) {
      newErrors.patente = "La patente es obligatoria";
    }
    if (!formData.marca.trim()) {
      newErrors.marca = "La marca es obligatoria";
    }
    if (!formData.modelo.trim()) {
      newErrors.modelo = "El modelo es obligatorio";
    }
    if (!formData.tipo) {
      newErrors.tipo = "El tipo es obligatorio";
    }
    if (!formData.tipoCombustible) {
      newErrors.tipoCombustible = "El tipo de combustible es obligatorio";
    }
    if (formData.capacidadTanque <= 0) {
      newErrors.capacidadTanque = "La capacidad debe ser mayor a 0";
    }
    if (formData.anio && (formData.anio < 1900 || formData.anio > new Date().getFullYear() + 1)) {
      newErrors.anio = "Año inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingVehiculo) {
        await updateMutation.mutateAsync({
          id: editingVehiculo.id,
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
    if (!deleteVehiculo) return;

    try {
      await deleteMutation.mutateAsync(deleteVehiculo.id);
      setOpenDeleteDialog(false);
      setDeleteVehiculo(null);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = vehiculos.map((v) => ({
      Patente: v.patente,
      Tipo: TIPOS_VEHICULO.find((t) => t.value === v.tipo)?.label || v.tipo,
      Marca: v.marca,
      Modelo: v.modelo,
      Año: v.anio || "",
      Combustible: TIPOS_COMBUSTIBLE.find((t) => t.value === v.tipoCombustible)?.label || v.tipoCombustible,
      "Capacidad Tanque (L)": v.capacidadTanque,
      Estado: ESTADOS_VEHICULO.find((e) => e.value === v.estado)?.label || v.estado,
      "Litros Consumidos": v.stats?.totalLitros || 0,
      "Costo Total": v.stats?.totalCosto || 0,
      ...(user?.role === "admin" && { "Unidad de Negocio": v.unidadNombre || "Sin asignar" }),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehículos");
    XLSX.writeFile(wb, `Vehiculos_${new Date().toISOString().split("T")[0]}.xlsx`);
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
          Error al cargar vehículos: {error.message}
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
            Gestión de Vehículos y Maquinaria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {vehiculos.length} {vehiculos.length === 1 ? "vehículo" : "vehículos"} registrados
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={vehiculos.length === 0}
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
              Nuevo Vehículo
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
          placeholder="Buscar por patente, marca o modelo..."
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
          label="Tipo"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="todos">Todos los tipos</MenuItem>
          {TIPOS_VEHICULO.map((tipo) => (
            <MenuItem key={tipo.value} value={tipo.value}>
              {tipo.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Estado"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="todos">Todos los estados</MenuItem>
          {ESTADOS_VEHICULO.map((estado) => (
            <MenuItem key={estado.value} value={estado.value}>
              {estado.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Grid de vehículos */}
      <Grid container spacing={3}>
        {vehiculos.map((vehiculo) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={vehiculo.id}>
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
                  borderColor: getColorByTipo(vehiculo.tipo),
                },
              }}
            >
              <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Header de la tarjeta */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: `${getColorByTipo(vehiculo.tipo)}15`,
                      color: getColorByTipo(vehiculo.tipo),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DirectionsCarIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Chip
                    label={TIPOS_VEHICULO.find((t) => t.value === vehiculo.tipo)?.label || vehiculo.tipo}
                    size="small"
                    sx={{
                      bgcolor: `${getColorByTipo(vehiculo.tipo)}15`,
                      color: getColorByTipo(vehiculo.tipo),
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {/* Info principal */}
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  {vehiculo.patente}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio && `(${vehiculo.anio})`}
                </Typography>

                {/* Stats */}
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <LocalGasStationIcon sx={{ fontSize: 16, color: "#6b7280" }} />
                    <Typography variant="caption" color="text.secondary">
                      {vehiculo.capacidadTanque}L
                    </Typography>
                  </Box>
                  {vehiculo.stats && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <SpeedIcon sx={{ fontSize: 16, color: "#6b7280" }} />
                      <Typography variant="caption" color="text.secondary">
                        {vehiculo.stats.totalLitros.toLocaleString()}L usados
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Chips de estado y unidad */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <Chip
                    label={ESTADOS_VEHICULO.find((e) => e.value === vehiculo.estado)?.label || vehiculo.estado}
                    size="small"
                    sx={{
                      bgcolor: vehiculo.estado === "activo" ? "#10b98115" : "#f59e0b15",
                      color: vehiculo.estado === "activo" ? "#10b981" : "#f59e0b",
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={TIPOS_COMBUSTIBLE.find((c) => c.value === vehiculo.tipoCombustible)?.label || vehiculo.tipoCombustible}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>

                {/* Unidad de negocio (solo admin) */}
                {user?.role === "admin" && vehiculo.unidadNombre && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    📍 {vehiculo.unidadNombre}
                  </Typography>
                )}

                {/* Acciones */}
                {canManage && (
                  <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(vehiculo)}
                      sx={{
                        bgcolor: "#f3f4f6",
                        "&:hover": { bgcolor: "#e5e7eb" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(vehiculo)}
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
      {vehiculos.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <DirectionsCarIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay vehículos registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {canManage ? "Haz clic en 'Nuevo Vehículo' para agregar uno" : "No tienes vehículos asignados"}
          </Typography>
        </Box>
      )}

      {/* Diálogo de crear/editar */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 3, pt: 2 }}>
            {/* Formulario */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Patente"
                    value={formData.patente}
                    onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                    error={!!errors.patente}
                    helperText={errors.patente}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoVehiculo })}
                    error={!!errors.tipo}
                    helperText={errors.tipo}
                    required
                    fullWidth
                  >
                    {TIPOS_VEHICULO.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Marca"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    error={!!errors.marca}
                    helperText={errors.marca}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    error={!!errors.modelo}
                    helperText={errors.modelo}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Año"
                    type="number"
                    value={formData.anio || ""}
                    onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value, 10) || undefined })}
                    error={!!errors.anio}
                    helperText={errors.anio}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    select
                    label="Combustible"
                    value={formData.tipoCombustible}
                    onChange={(e) => setFormData({ ...formData, tipoCombustible: e.target.value as TipoCombustible })}
                    error={!!errors.tipoCombustible}
                    helperText={errors.tipoCombustible}
                    required
                    fullWidth
                  >
                    {TIPOS_COMBUSTIBLE.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Capacidad Tanque (L)"
                    type="number"
                    value={formData.capacidadTanque || ""}
                    onChange={(e) => setFormData({ ...formData, capacidadTanque: parseFloat(e.target.value) || 0 })}
                    error={!!errors.capacidadTanque}
                    helperText={errors.capacidadTanque}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Km Actual"
                    type="number"
                    value={formData.kmActual || ""}
                    onChange={(e) => setFormData({ ...formData, kmActual: parseInt(e.target.value, 10) || 0 })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Horas Motor"
                    type="number"
                    value={formData.horasActual || ""}
                    onChange={(e) => setFormData({ ...formData, horasActual: parseInt(e.target.value, 10) || 0 })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="Estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoVehiculo })}
                    fullWidth
                  >
                    {ESTADOS_VEHICULO.map((estado) => (
                      <MenuItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Selector de unidad (solo admin con múltiples unidades) */}
                {user?.role === "admin" && unidades.length > 0 && (
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Unidad de Negocio</InputLabel>
                      <Select
                        value={formData.unidadId || ""}
                        onChange={(e) => setFormData({ ...formData, unidadId: e.target.value ? Number(e.target.value) : undefined })}
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
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    multiline
                    rows={2}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Dropzone para imagen */}
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
              <input {...(getInputProps() as React.InputHTMLAttributes<HTMLInputElement>)} />
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
                  <DirectionsCarIcon sx={{ fontSize: 40, color: "#9ca3af", mb: 1 }} />
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
              : editingVehiculo
              ? "Guardar Cambios"
              : "Crear Vehículo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar el vehículo <strong>{deleteVehiculo?.patente}</strong>?
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
