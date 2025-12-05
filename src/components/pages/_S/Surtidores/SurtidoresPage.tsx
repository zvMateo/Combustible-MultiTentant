// src/components/pages/_S/Surtidores/SurtidoresPage.tsx
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
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SpeedIcon from "@mui/icons-material/Speed";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Hooks y stores
import { useTenantStore } from "@/stores/tenant.store";
import { useUnidadStore } from "@/stores/unidad.store";
import {
  useSurtidores,
  useCreateSurtidor,
  useUpdateSurtidor,
  useDeleteSurtidor,
} from "@/hooks/queries";

// Types
import type {
  Surtidor,
  SurtidorFormData,
  TipoSurtidor,
  EstadoSurtidor,
} from "@/types";
import { TIPOS_SURTIDOR, ESTADOS_SURTIDOR } from "@/types";

// Colores por tipo de surtidor
const getColorByTipo = (tipo: TipoSurtidor): string => {
  const colors: Record<TipoSurtidor, string> = {
    fijo: "#10b981",
    movil: "#3b82f6",
    tanque_propio: "#f59e0b",
  };
  return colors[tipo] || "#667eea";
};

// Estado inicial del formulario
const getInitialFormData = (): SurtidorFormData => ({
  nombre: "",
  codigo: "",
  tipo: "fijo",
  ubicacion: "",
  latitud: undefined,
  longitud: undefined,
  capacidad: undefined,
  stockActual: undefined,
  estado: "activo",
  proveedor: "",
  observaciones: "",
  unidadId: undefined,
  activo: true,
});

interface FormErrors {
  [key: string]: string;
}

export default function SurtidoresPage() {
  // Stores
  const { user, hasPermission } = useTenantStore();
  const { unidades } = useUnidadStore();
  const canManage = hasPermission("surtidores:gestionar");

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingSurtidor, setEditingSurtidor] = useState<Surtidor | null>(null);
  const [deleteSurtidor, setDeleteSurtidor] = useState<Surtidor | null>(null);

  // Formulario
  const [formData, setFormData] = useState<SurtidorFormData>(
    getInitialFormData()
  );
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const {
    data: surtidoresData,
    isLoading,
    error,
  } = useSurtidores({
    search: searchTerm || undefined,
    tipo: filterTipo !== "todos" ? (filterTipo as TipoSurtidor) : undefined,
    estado:
      filterEstado !== "todos" ? (filterEstado as EstadoSurtidor) : undefined,
  });

  const createMutation = useCreateSurtidor();
  const updateMutation = useUpdateSurtidor();
  const deleteMutation = useDeleteSurtidor();

  // Surtidores filtrados
  const surtidores = useMemo(() => {
    return surtidoresData?.data || [];
  }, [surtidoresData]);

  // Handlers
  const handleNew = () => {
    setEditingSurtidor(null);
    setFormData(getInitialFormData());
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (surtidor: Surtidor) => {
    setEditingSurtidor(surtidor);
    setFormData({
      nombre: surtidor.nombre,
      codigo: surtidor.codigo || "",
      tipo: surtidor.tipo,
      ubicacion: surtidor.ubicacion,
      latitud: surtidor.latitud,
      longitud: surtidor.longitud,
      capacidad: surtidor.capacidad,
      stockActual: surtidor.stockActual,
      estado: surtidor.estado,
      proveedor: surtidor.proveedor || "",
      observaciones: surtidor.observaciones || "",
      unidadId: surtidor.unidadId,
      activo: surtidor.activo,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (surtidor: Surtidor) => {
    setDeleteSurtidor(surtidor);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }
    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = "La ubicación es obligatoria";
    }
    if (!formData.tipo) {
      newErrors.tipo = "El tipo es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingSurtidor) {
        await updateMutation.mutateAsync({
          id: editingSurtidor.id,
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
    if (!deleteSurtidor) return;

    try {
      await deleteMutation.mutateAsync(deleteSurtidor.id);
      setOpenDeleteDialog(false);
      setDeleteSurtidor(null);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = surtidores.map((s) => ({
      Código: s.codigo || "",
      Nombre: s.nombre,
      Tipo: TIPOS_SURTIDOR.find((t) => t.value === s.tipo)?.label || s.tipo,
      Ubicación: s.ubicacion,
      "Capacidad (L)": s.capacidad || "",
      "Stock Actual (L)": s.stockActual || "",
      Estado:
        ESTADOS_SURTIDOR.find((e) => e.value === s.estado)?.label || s.estado,
      Proveedor: s.proveedor || "",
      ...(user?.role === "admin" && {
        "Unidad de Negocio": s.unidadNombre || "Sin asignar",
      }),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Surtidores");
    XLSX.writeFile(
      wb,
      `Surtidores_${new Date().toISOString().split("T")[0]}.xlsx`
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
          Error al cargar surtidores: {error.message}
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
            Gestión de Surtidores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {surtidores.length}{" "}
            {surtidores.length === 1 ? "surtidor" : "surtidores"} registrados
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={surtidores.length === 0}
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
              Nuevo Surtidor
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
          placeholder="Buscar por código, nombre o ubicación..."
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
          {TIPOS_SURTIDOR.map((tipo) => (
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
          {ESTADOS_SURTIDOR.map((estado) => (
            <MenuItem key={estado.value} value={estado.value}>
              {estado.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Grid de surtidores */}
      <Grid container spacing={3}>
        {surtidores.map((surtidor) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={surtidor.id}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.25s ease",
                "&:hover": {
                  boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                  transform: "translateY(-3px)",
                  borderColor: getColorByTipo(surtidor.tipo),
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
                {/* Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${getColorByTipo(surtidor.tipo)}15`,
                      color: getColorByTipo(surtidor.tipo),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LocalGasStationIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Chip
                    label={
                      TIPOS_SURTIDOR.find((t) => t.value === surtidor.tipo)
                        ?.label || surtidor.tipo
                    }
                    size="small"
                    sx={{
                      bgcolor: `${getColorByTipo(surtidor.tipo)}15`,
                      color: getColorByTipo(surtidor.tipo),
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {/* Info principal */}
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  {surtidor.codigo || surtidor.nombre}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  {surtidor.codigo ? surtidor.nombre : ""}
                </Typography>

                {/* Ubicación */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1.5,
                  }}
                >
                  <LocationOnIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                  <Typography variant="caption" color="text.secondary">
                    {surtidor.ubicacion}
                  </Typography>
                </Box>

                {/* Stats */}
                {(surtidor.capacidad || surtidor.stockActual) && (
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    {surtidor.capacidad && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <SpeedIcon sx={{ fontSize: 14, color: "#6b7280" }} />
                        <Typography variant="caption" color="text.secondary">
                          Cap: {surtidor.capacidad.toLocaleString()}L
                        </Typography>
                      </Box>
                    )}
                    {surtidor.stockActual !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        Stock: {surtidor.stockActual.toLocaleString()}L
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Estado */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <Chip
                    label={
                      ESTADOS_SURTIDOR.find((e) => e.value === surtidor.estado)
                        ?.label || surtidor.estado
                    }
                    size="small"
                    sx={{
                      bgcolor:
                        surtidor.estado === "activo"
                          ? "#10b98115"
                          : "#f59e0b15",
                      color:
                        surtidor.estado === "activo" ? "#10b981" : "#f59e0b",
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {/* Unidad (solo admin) */}
                {user?.role === "admin" && surtidor.unidadNombre && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    📍 {surtidor.unidadNombre}
                  </Typography>
                )}

                {/* Acciones */}
                {canManage && (
                  <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(surtidor)}
                      sx={{
                        bgcolor: "#f3f4f6",
                        "&:hover": { bgcolor: "#e5e7eb" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(surtidor)}
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
      {surtidores.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <LocalGasStationIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay surtidores registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {canManage
              ? "Haz clic en 'Nuevo Surtidor' para agregar uno"
              : "No tienes surtidores asignados"}
          </Typography>
        </Box>
      )}

      {/* Diálogo de crear/editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSurtidor ? "Editar Surtidor" : "Nuevo Surtidor"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Código"
                  value={formData.codigo || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      codigo: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="SUR-001"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Tipo"
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo: e.target.value as TipoSurtidor,
                    })
                  }
                  error={!!errors.tipo}
                  helperText={errors.tipo}
                  required
                  fullWidth
                >
                  {TIPOS_SURTIDOR.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  error={!!errors.nombre}
                  helperText={errors.nombre}
                  required
                  placeholder="Surtidor Principal"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Ubicación"
                  value={formData.ubicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, ubicacion: e.target.value })
                  }
                  error={!!errors.ubicacion}
                  helperText={errors.ubicacion}
                  required
                  placeholder="Estación Central, Lote 45, etc."
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Capacidad (Litros)"
                  type="number"
                  value={formData.capacidad || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacidad: parseFloat(e.target.value) || undefined,
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Stock Actual (Litros)"
                  type="number"
                  value={formData.stockActual || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stockActual: parseFloat(e.target.value) || undefined,
                    })
                  }
                  fullWidth
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
                      estado: e.target.value as EstadoSurtidor,
                    })
                  }
                  fullWidth
                >
                  {ESTADOS_SURTIDOR.map((estado) => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Proveedor"
                  value={formData.proveedor || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, proveedor: e.target.value })
                  }
                  fullWidth
                />
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
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  multiline
                  rows={2}
                  fullWidth
                />
              </Grid>
            </Grid>
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
              : editingSurtidor
              ? "Guardar Cambios"
              : "Crear Surtidor"}
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
            ¿Estás seguro de eliminar el surtidor{" "}
            <strong>{deleteSurtidor?.codigo || deleteSurtidor?.nombre}</strong>?
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
