// src/components/pages/_S/UnidadesNegocio/UnidadesNegocioPage.tsx
import { useState } from "react";
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
  Chip,
  IconButton,
  Skeleton,
  Fade,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  alpha,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import StoreIcon from "@mui/icons-material/Store";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  useUnidades,
  useCreateUnidad,
  useUpdateUnidad,
  useDeleteUnidad,
  useToggleUnidadStatus,
} from "@/hooks/queries";
import type {
  UnidadNegocio,
  UnidadNegocioFormData,
  TipoUnidadNegocio,
  UnidadNegocioStatus,
} from "@/types";
import { TIPO_UNIDAD_LABELS, STATUS_UNIDAD_COLORS } from "@/types";
import * as XLSX from "xlsx";

// Colores por tipo de unidad
const TIPO_COLORS: Record<TipoUnidadNegocio, string> = {
  campo: "#10b981",
  sucursal: "#3b82f6",
  planta: "#8b5cf6",
  deposito: "#f59e0b",
  oficina: "#6b7280",
  otro: "#94a3b8",
};

const initialFormData: UnidadNegocioFormData = {
  nombre: "",
  codigo: "",
  tipo: "campo",
  descripcion: "",
  direccion: "",
  localidad: "",
  provincia: "",
  responsable: "",
  telefono: "",
  email: "",
  status: "activa",
};

export default function UnidadesNegocioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState<UnidadNegocio | null>(
    null
  );
  const [deleteUnidad, setDeleteUnidad] = useState<UnidadNegocio | null>(null);
  const [formData, setFormData] =
    useState<UnidadNegocioFormData>(initialFormData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof UnidadNegocioFormData, string>>
  >({});

  // React Query hooks
  const { data: unidadesData, isLoading } = useUnidades({ search: searchTerm });
  const createMutation = useCreateUnidad();
  const updateMutation = useUpdateUnidad();
  const deleteMutation = useDeleteUnidad();
  const toggleStatusMutation = useToggleUnidadStatus();

  const unidades = unidadesData?.data ?? [];

  // Handlers
  const handleNew = () => {
    setEditingUnidad(null);
    setFormData(initialFormData);
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (unidad: UnidadNegocio) => {
    setEditingUnidad(unidad);
    setFormData({
      nombre: unidad.nombre,
      codigo: unidad.codigo,
      tipo: unidad.tipo,
      descripcion: unidad.descripcion || "",
      direccion: unidad.direccion || "",
      localidad: unidad.localidad || "",
      provincia: unidad.provincia || "",
      responsable: unidad.responsable || "",
      telefono: unidad.telefono || "",
      email: unidad.email || "",
      status: unidad.status,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDelete = (unidad: UnidadNegocio) => {
    setDeleteUnidad(unidad);
    setOpenDeleteDialog(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UnidadNegocioFormData, string>> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.codigo.trim()) {
      newErrors.codigo = "El código es requerido";
    } else if (formData.codigo.length > 10) {
      newErrors.codigo = "El código no puede tener más de 10 caracteres";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (editingUnidad) {
      await updateMutation.mutateAsync({
        id: editingUnidad.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setOpenDialog(false);
  };

  const handleConfirmDelete = async () => {
    if (deleteUnidad) {
      await deleteMutation.mutateAsync(deleteUnidad.id);
      setOpenDeleteDialog(false);
      setDeleteUnidad(null);
    }
  };

  const handleToggleStatus = async (unidad: UnidadNegocio) => {
    await toggleStatusMutation.mutateAsync(unidad.id);
  };

  const handleExport = () => {
    const exportData = unidades.map((u) => ({
      Código: u.codigo,
      Nombre: u.nombre,
      Tipo: TIPO_UNIDAD_LABELS[u.tipo],
      Estado: u.status,
      Responsable: u.responsable || "-",
      Teléfono: u.telefono || "-",
      Email: u.email || "-",
      Dirección: u.direccion || "-",
      Localidad: u.localidad || "-",
      Provincia: u.provincia || "-",
      Vehículos: u.totalVehiculos || 0,
      Choferes: u.totalChoferes || 0,
      "Eventos/Mes": u.totalEventosMes || 0,
      "Consumo Mes (L)": u.consumoMesLitros || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Unidades");
    XLSX.writeFile(
      wb,
      `unidades_negocio_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Stats cards
  const stats = {
    total: unidades.length,
    activas: unidades.filter((u) => u.status === "activa").length,
    totalVehiculos: unidades.reduce(
      (acc, u) => acc + (u.totalVehiculos || 0),
      0
    ),
    totalConsumo: unidades.reduce(
      (acc, u) => acc + (u.consumoMesLitros || 0),
      0
    ),
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ color: "#1e293b", mb: 1 }}
        >
          Unidades de Negocio
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Gestiona las sucursales, campos y divisiones de tu empresa
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
          mb: 4,
        }}
      >
        {[
          {
            label: "Total Unidades",
            value: stats.total,
            icon: <StoreIcon />,
            color: "#3b82f6",
          },
          {
            label: "Activas",
            value: stats.activas,
            icon: <StoreIcon />,
            color: "#10b981",
          },
          {
            label: "Total Vehículos",
            value: stats.totalVehiculos,
            icon: <DirectionsCarIcon />,
            color: "#8b5cf6",
          },
          {
            label: "Consumo Mes (L)",
            value: stats.totalConsumo.toLocaleString(),
            icon: <LocalGasStationIcon />,
            color: "#f59e0b",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            sx={{
              borderRadius: 3,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{ color: "#1e293b" }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Buscar unidades..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#94a3b8" }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            sx={{ borderRadius: 2 }}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
            sx={{
              borderRadius: 2,
              bgcolor: "#3b82f6",
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            Nueva Unidad
          </Button>
        </Box>
      </Box>

      {/* Grid de Unidades */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: 3,
        }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={280}
                sx={{ borderRadius: 3 }}
              />
            ))
          : unidades.map((unidad, index) => (
              <Fade in timeout={300 + index * 100} key={unidad.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    },
                    opacity: unidad.status === "inactiva" ? 0.7 : 1,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header de la card */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(TIPO_COLORS[unidad.tipo], 0.1),
                          }}
                        >
                          <StoreIcon
                            sx={{
                              fontSize: 28,
                              color: TIPO_COLORS[unidad.tipo],
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ color: "#1e293b", mb: 0.5 }}
                          >
                            {unidad.nombre}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Chip
                              label={unidad.codigo}
                              size="small"
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: "#f1f5f9",
                                color: "#475569",
                              }}
                            />
                            <Chip
                              label={TIPO_UNIDAD_LABELS[unidad.tipo]}
                              size="small"
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: alpha(TIPO_COLORS[unidad.tipo], 0.1),
                                color: TIPO_COLORS[unidad.tipo],
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Chip
                        label={unidad.status}
                        size="small"
                        sx={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          bgcolor: alpha(
                            STATUS_UNIDAD_COLORS[unidad.status],
                            0.1
                          ),
                          color: STATUS_UNIDAD_COLORS[unidad.status],
                        }}
                      />
                    </Box>

                    {/* Info de la unidad */}
                    <Box sx={{ mb: 2 }}>
                      {unidad.responsable && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                          <Typography variant="body2" sx={{ color: "#64748b" }}>
                            {unidad.responsable}
                          </Typography>
                        </Box>
                      )}
                      {unidad.direccion && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <LocationOnIcon
                            sx={{ fontSize: 16, color: "#94a3b8" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: "#64748b", fontSize: 13 }}
                          >
                            {unidad.direccion}
                            {unidad.localidad && `, ${unidad.localidad}`}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Métricas */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ color: "#1e293b" }}
                        >
                          {unidad.totalVehiculos || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          Vehículos
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ color: "#1e293b" }}
                        >
                          {unidad.totalChoferes || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          Choferes
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ color: "#1e293b" }}
                        >
                          {((unidad.consumoMesLitros || 0) / 1000).toFixed(1)}k
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          L/mes
                        </Typography>
                      </Box>
                    </Box>

                    {/* Acciones */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                        pt: 1,
                      }}
                    >
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(unidad)}
                          sx={{
                            bgcolor: "#f1f5f9",
                            "&:hover": { bgcolor: "#e2e8f0" },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18, color: "#3b82f6" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(unidad)}
                          sx={{
                            bgcolor: "#fef2f2",
                            "&:hover": { bgcolor: "#fee2e2" },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ))}
      </Box>

      {/* Empty State */}
      {!isLoading && unidades.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            bgcolor: "#f8fafc",
            borderRadius: 3,
          }}
        >
          <StoreIcon sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
            No hay unidades de negocio
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
            Crea tu primera unidad para comenzar a organizar tu empresa
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
            sx={{ borderRadius: 2 }}
          >
            Crear Primera Unidad
          </Button>
        </Box>
      )}

      {/* Dialog Crear/Editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingUnidad
            ? "Editar Unidad de Negocio"
            : "Nueva Unidad de Negocio"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Nombre y Código */}
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label="Nombre"
                  fullWidth
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  error={!!errors.nombre}
                  helperText={errors.nombre}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Código"
                  fullWidth
                  required
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      codigo: e.target.value.toUpperCase(),
                    })
                  }
                  error={!!errors.codigo}
                  helperText={errors.codigo || "Ej: CN, CS, DC"}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>

              {/* Tipo */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.tipo}
                    label="Tipo"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipo: e.target.value as TipoUnidadNegocio,
                      })
                    }
                  >
                    {Object.entries(TIPO_UNIDAD_LABELS).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Estado */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.status === "activa"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.checked ? "activa" : "inactiva",
                        })
                      }
                    />
                  }
                  label="Unidad Activa"
                />
              </Grid>

              {/* Descripción */}
              <Grid size={12}>
                <TextField
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Ubicación
                  </Typography>
                </Divider>
              </Grid>

              {/* Dirección */}
              <Grid size={12}>
                <TextField
                  label="Dirección"
                  fullWidth
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Localidad"
                  fullWidth
                  value={formData.localidad}
                  onChange={(e) =>
                    setFormData({ ...formData, localidad: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Provincia"
                  fullWidth
                  value={formData.provincia}
                  onChange={(e) =>
                    setFormData({ ...formData, provincia: e.target.value })
                  }
                />
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Contacto
                  </Typography>
                </Divider>
              </Grid>

              {/* Responsable */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Responsable"
                  fullWidth
                  value={formData.responsable}
                  onChange={(e) =>
                    setFormData({ ...formData, responsable: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            {editingUnidad ? "Guardar Cambios" : "Crear Unidad"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Eliminar Unidad</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar la unidad{" "}
            <strong>{deleteUnidad?.nombre}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ color: "#ef4444", mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
