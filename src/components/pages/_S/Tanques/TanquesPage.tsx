// src/components/pages/_S/Tanques/TanquesPage.tsx
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
import PropaneTankIcon from "@mui/icons-material/PropaneTank";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarningIcon from "@mui/icons-material/Warning";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Hooks y stores
import { useTenantStore } from "@/stores/tenant.store";
import { useUnidadStore } from "@/stores/unidad.store";
import {
  useTanques,
  useCreateTanque,
  useUpdateTanque,
  useDeleteTanque,
} from "@/hooks/queries";

// Types
import type {
  Tanque,
  TanqueFormData,
  TipoTanque,
  EstadoTanque,
} from "@/types";
import {
  TIPOS_TANQUE,
  ESTADOS_TANQUE,
  calcularPorcentajeStock,
  getNivelAlerta,
  getColorNivelAlerta,
} from "@/types";

// Colores por tipo de tanque
const getColorByTipo = (tipo: TipoTanque): string => {
  const colors: Record<TipoTanque, string> = {
    principal: "#10b981",
    auxiliar: "#3b82f6",
    reserva: "#f59e0b",
    movil: "#8b5cf6",
  };
  return colors[tipo] || "#667eea";
};

// Estado inicial del formulario
const getInitialFormData = (): TanqueFormData => ({
  nombre: "",
  codigo: "",
  tipo: "principal",
  capacidad: 0,
  stockActual: 0,
  stockMinimo: 0,
  ubicacion: "",
  latitud: undefined,
  longitud: undefined,
  estado: "operativo",
  proveedor: "",
  observaciones: "",
  unidadId: undefined,
  activo: true,
});

interface FormErrors {
  [key: string]: string;
}

export default function TanquesPage() {
  // Stores
  const { user, hasPermission } = useTenantStore();
  const { unidades } = useUnidadStore();
  const canManage = hasPermission("tanques:gestionar");

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingTanque, setEditingTanque] = useState<Tanque | null>(null);
  const [deleteTanque, setDeleteTanque] = useState<Tanque | null>(null);

  // Formulario
  const [formData, setFormData] = useState<TanqueFormData>(getInitialFormData());
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: tanquesData, isLoading, error } = useTanques({
    search: searchTerm || undefined,
    tipo: filterTipo !== "todos" ? (filterTipo as TipoTanque) : undefined,
    estado: filterEstado !== "todos" ? (filterEstado as EstadoTanque) : undefined,
  });

  const createMutation = useCreateTanque();
  const updateMutation = useUpdateTanque();
  const deleteMutation = useDeleteTanque();

  // Tanques filtrados
  const tanques = useMemo(() => {
    return tanquesData?.data || [];
  }, [tanquesData]);

  // Handlers
  const handleNew = () => {
    setEditingTanque(null);
    setFormData(getInitialFormData());
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (tanque: Tanque) => {
    setEditingTanque(tanque);
    setFormData({
      nombre: tanque.nombre,
      codigo: tanque.codigo || "",
      tipo: tanque.tipo,
      capacidad: tanque.capacidad,
      stockActual: tanque.stockActual,
      stockMinimo: tanque.stockMinimo,
      ubicacion: tanque.ubicacion,
      latitud: tanque.latitud,
      longitud: tanque.longitud,
      estado: tanque.estado,
      proveedor: tanque.proveedor || "",
      observaciones: tanque.observaciones || "",
      unidadId: tanque.unidadId,
      activo: tanque.activo,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (tanque: Tanque) => {
    setDeleteTanque(tanque);
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
    if (formData.capacidad <= 0) {
      newErrors.capacidad = "La capacidad debe ser mayor a 0";
    }
    if (formData.stockActual < 0) {
      newErrors.stockActual = "El stock no puede ser negativo";
    }
    if (formData.stockActual > formData.capacidad) {
      newErrors.stockActual = "El stock no puede superar la capacidad";
    }
    if (formData.stockMinimo < 0) {
      newErrors.stockMinimo = "El stock mínimo no puede ser negativo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingTanque) {
        await updateMutation.mutateAsync({
          id: editingTanque.id,
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
    if (!deleteTanque) return;

    try {
      await deleteMutation.mutateAsync(deleteTanque.id);
      setOpenDeleteDialog(false);
      setDeleteTanque(null);
    } catch (error) {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = tanques.map((t) => {
      const porcentaje = calcularPorcentajeStock(t);
      return {
        Código: t.codigo || "",
        Nombre: t.nombre,
        Tipo: TIPOS_TANQUE.find((tipo) => tipo.value === t.tipo)?.label || t.tipo,
        Ubicación: t.ubicacion,
        "Capacidad (L)": t.capacidad,
        "Stock Actual (L)": t.stockActual,
        "Stock Mínimo (L)": t.stockMinimo,
        "Nivel (%)": porcentaje,
        "Disponible (L)": t.capacidad - t.stockActual,
        Estado: ESTADOS_TANQUE.find((e) => e.value === t.estado)?.label || t.estado,
        ...(user?.role === "admin" && { "Unidad de Negocio": t.unidadNombre || "Sin asignar" }),
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tanques");
    XLSX.writeFile(wb, `Tanques_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Archivo exportado correctamente");
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={280} />
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
          Error al cargar tanques: {error.message}
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
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1, mb: 0.5 }}>
            Gestión de Tanques
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tanques.length} {tanques.length === 1 ? "tanque" : "tanques"} registrados
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={tanques.length === 0}
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
              Nuevo Tanque
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
          {TIPOS_TANQUE.map((tipo) => (
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
          {ESTADOS_TANQUE.map((estado) => (
            <MenuItem key={estado.value} value={estado.value}>
              {estado.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Grid de tanques */}
      <Grid container spacing={3}>
        {tanques.map((tanque) => {
          const porcentaje = calcularPorcentajeStock(tanque);
          const nivelAlerta = getNivelAlerta(tanque);
          const colorAlerta = getColorNivelAlerta(nivelAlerta);

          return (
            <Grid item xs={12} sm={6} md={4} key={tanque.id}>
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
                    borderColor: getColorByTipo(tanque.tipo),
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Header */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: `${getColorByTipo(tanque.tipo)}15`,
                        color: getColorByTipo(tanque.tipo),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PropaneTankIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Chip
                      label={TIPOS_TANQUE.find((t) => t.value === tanque.tipo)?.label || tanque.tipo}
                      size="small"
                      sx={{
                        bgcolor: `${getColorByTipo(tanque.tipo)}15`,
                        color: getColorByTipo(tanque.tipo),
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* Info principal */}
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                    {tanque.codigo || tanque.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {tanque.codigo ? tanque.nombre : ""}
                  </Typography>

                  {/* Ubicación */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                    <Typography variant="caption" color="text.secondary">
                      {tanque.ubicacion}
                    </Typography>
                  </Box>

                  {/* Nivel del tanque */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Nivel actual
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {(nivelAlerta === "bajo" || nivelAlerta === "critico" || nivelAlerta === "vacio") && (
                          <WarningIcon sx={{ fontSize: 16, color: colorAlerta }} />
                        )}
                        <Typography variant="caption" fontWeight={600} sx={{ color: colorAlerta }}>
                          {porcentaje}%
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={porcentaje}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        mb: 0.5,
                        backgroundColor: "#e5e7eb",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: colorAlerta,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {tanque.stockActual.toLocaleString()} / {tanque.capacidad.toLocaleString()} L
                    </Typography>
                  </Box>

                  {/* Stats */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        Capacidad
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {tanque.capacidad.toLocaleString()} L
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        Disponible
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="#10b981">
                        {(tanque.capacidad - tanque.stockActual).toLocaleString()} L
                      </Typography>
                    </Box>
                  </Box>

                  {/* Estado */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    <Chip
                      label={ESTADOS_TANQUE.find((e) => e.value === tanque.estado)?.label || tanque.estado}
                      size="small"
                      sx={{
                        bgcolor: tanque.estado === "operativo" ? "#10b98115" : "#f59e0b15",
                        color: tanque.estado === "operativo" ? "#10b981" : "#f59e0b",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* Unidad (solo admin) */}
                  {user?.role === "admin" && tanque.unidadNombre && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                      📍 {tanque.unidadNombre}
                    </Typography>
                  )}

                  {/* Acciones */}
                  {canManage && (
                    <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(tanque)}
                        sx={{
                          bgcolor: "#f3f4f6",
                          "&:hover": { bgcolor: "#e5e7eb" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(tanque)}
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
          );
        })}
      </Grid>

      {/* Empty state */}
      {tanques.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <PropaneTankIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay tanques registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {canManage ? "Haz clic en 'Nuevo Tanque' para agregar uno" : "No tienes tanques asignados"}
          </Typography>
        </Box>
      )}

      {/* Diálogo de crear/editar */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTanque ? "Editar Tanque" : "Nuevo Tanque"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Código"
                  value={formData.codigo || ""}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="TNQ-001"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoTanque })}
                  error={!!errors.tipo}
                  helperText={errors.tipo}
                  required
                  fullWidth
                >
                  {TIPOS_TANQUE.map((tipo) => (
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
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  error={!!errors.nombre}
                  helperText={errors.nombre}
                  required
                  placeholder="Tanque Principal"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Ubicación"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  error={!!errors.ubicacion}
                  helperText={errors.ubicacion}
                  required
                  placeholder="Estación Central, Lote 45, etc."
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Capacidad (L)"
                  type="number"
                  value={formData.capacidad || ""}
                  onChange={(e) => setFormData({ ...formData, capacidad: parseFloat(e.target.value) || 0 })}
                  error={!!errors.capacidad}
                  helperText={errors.capacidad}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Stock Actual (L)"
                  type="number"
                  value={formData.stockActual || ""}
                  onChange={(e) => setFormData({ ...formData, stockActual: parseFloat(e.target.value) || 0 })}
                  error={!!errors.stockActual}
                  helperText={errors.stockActual}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Stock Mínimo (L)"
                  type="number"
                  value={formData.stockMinimo || ""}
                  onChange={(e) => setFormData({ ...formData, stockMinimo: parseFloat(e.target.value) || 0 })}
                  error={!!errors.stockMinimo}
                  helperText={errors.stockMinimo || "Alerta de nivel bajo"}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoTanque })}
                  fullWidth
                >
                  {ESTADOS_TANQUE.map((estado) => (
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
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
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
              : editingTanque
              ? "Guardar Cambios"
              : "Crear Tanque"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar el tanque <strong>{deleteTanque?.codigo || deleteTanque?.nombre}</strong>?
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
