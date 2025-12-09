// src/pages/Dashboard/Vehicles/VehiclesPage.tsx
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
  MenuItem,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import {
  useVehicles,
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
} from "@/hooks/queries";
import { useCompanies, useBusinessUnits } from "@/hooks/queries";
import { useResourceTypes } from "@/hooks/queries";
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
} from "@/types/api.types";
import { RESOURCE_TYPES } from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

export default function VehiclesPage() {
  const { user } = useAuthStore();
  const idCompany = user?.idCompany ?? 0;

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Resource | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<CreateResourceRequest>({
    idType: RESOURCE_TYPES.VEHICLE,
    idCompany: idCompany || 0,
    idBusinessUnit: undefined,
    nativeLiters: undefined,
    name: "",
    identifier: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: vehicles = [], isLoading, error } = useVehicles();
  const { data: companies = [] } = useCompanies();
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: resourceTypes = [] } = useResourceTypes();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deactivateMutation = useDeactivateResource();

  // Filtrar vehículos por búsqueda y empresa
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Filtrar por empresa si no es superadmin
    if (user?.role !== "superadmin" && idCompany) {
      filtered = filtered.filter((v) => v.idCompany === idCompany);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.identifier.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [vehicles, searchTerm, idCompany, user?.role]);

  // Handlers
  const handleNew = () => {
    setEditingVehicle(null);
    setFormData({
      idType: RESOURCE_TYPES.VEHICLE,
      idCompany: idCompany || companies[0]?.id || 0,
      idBusinessUnit: undefined,
      nativeLiters: undefined,
      name: "",
      identifier: "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (vehicle: Resource) => {
    setEditingVehicle(vehicle);
    setFormData({
      idType: vehicle.idType,
      idCompany: vehicle.idCompany,
      idBusinessUnit: vehicle.idBusinessUnit,
      nativeLiters: vehicle.nativeLiters,
      name: vehicle.name,
      identifier: vehicle.identifier,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (vehicle: Resource) => {
    setDeleteVehicle(vehicle);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }
    if (!formData.identifier.trim()) {
      newErrors.identifier = "El identificador (patente) es obligatorio";
    }
    if (!formData.idCompany || formData.idCompany === 0) {
      newErrors.idCompany = "Debe seleccionar una empresa";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingVehicle) {
        const updateData: UpdateResourceRequest = {
          id: editingVehicle.id,
          idType: formData.idType,
          idCompany: formData.idCompany,
          idBusinessUnit: formData.idBusinessUnit,
          nativeLiters: formData.nativeLiters,
          name: formData.name,
          identifier: formData.identifier,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(formData);
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteVehicle) return;

    try {
      await deactivateMutation.mutateAsync(deleteVehicle.id);
      setOpenDeleteDialog(false);
      setDeleteVehicle(null);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = filteredVehicles.map((v) => {
      const company = companies.find((c) => c.id === v.idCompany);
      const businessUnit = businessUnits.find((bu) => bu.id === v.idBusinessUnit);
      return {
        Nombre: v.name,
        Identificador: v.identifier,
        "Capacidad (L)": v.nativeLiters || 0,
        Empresa: company?.name || "",
        "Unidad de Negocio": businessUnit?.name || "",
        Estado: v.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
    XLSX.writeFile(
      wb,
      `vehicles_${new Date().toISOString().split("T")[0]}.xlsx`
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
            // @ts-expect-error - MUI v7 Grid type incompatibility
            <Grid xs={12} sm={6} md={4} lg={3} key={i}>
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
          Error al cargar vehículos:{" "}
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
            Vehicle Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredVehicles.length}{" "}
            {filteredVehicles.length === 1 ? "vehicle" : "vehicles"} registrados
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={filteredVehicles.length === 0}
            sx={{
              borderColor: "#10b981",
              color: "#10b981",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { borderColor: "#059669", bgcolor: "#10b98110" },
            }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
            disabled={createMutation.isPending}
            sx={{
              bgcolor: "#1E2C56",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#16213E" },
            }}
          >
            New Vehicle
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
          placeholder="Buscar por nombre o identificador..."
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

      {/* Grid de vehículos */}
      <Grid container spacing={3}>
        {filteredVehicles.map((vehicle) => {
          const company = companies.find((c) => c.id === vehicle.idCompany);
          const businessUnit = businessUnits.find(
            (bu) => bu.id === vehicle.idBusinessUnit
          );
          return (
            // @ts-expect-error - MUI v7 Grid type incompatibility
            <Grid xs={12} sm={6} md={4} lg={3} key={vehicle.id}>
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
                  opacity: vehicle.isActive !== false ? 1 : 0.7,
                  "&:hover": {
                    boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                    transform: "translateY(-3px)",
                    borderColor: "#3b82f6",
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
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "#3b82f615",
                        color: "#3b82f6",
                      }}
                    >
                      <DirectionsCarIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {vehicle.name}
                      </Typography>
                      <Chip
                        label={vehicle.identifier}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                          fontWeight: 600,
                          fontSize: 11,
                          mt: 0.5,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Info */}
                  {vehicle.nativeLiters && (
                    <Box sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <LocalGasStationIcon
                          sx={{ fontSize: 16, color: "#10b981" }}
                        />
                        <Typography variant="body2">
                          {vehicle.nativeLiters} L
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Empresa y Unidad */}
                  {company && (
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={company.name}
                        size="small"
                        sx={{ bgcolor: "#3b82f615", color: "#3b82f6" }}
                      />
                    </Box>
                  )}

                  {businessUnit && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {businessUnit.name}
                      </Typography>
                    </Box>
                  )}

                  {/* Estado */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    <Chip
                      label={vehicle.isActive !== false ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        bgcolor:
                          vehicle.isActive !== false ? "#10b98115" : "#f59e0b15",
                        color: vehicle.isActive !== false ? "#10b981" : "#f59e0b",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* Acciones */}
                  <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(vehicle)}
                      disabled={updateMutation.isPending}
                      sx={{
                        bgcolor: "#f3f4f6",
                        "&:hover": { bgcolor: "#e5e7eb" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(vehicle)}
                      disabled={deactivateMutation.isPending}
                      sx={{
                        bgcolor: "#fee2e2",
                        color: "#dc2626",
                        "&:hover": { bgcolor: "#fecaca" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty state */}
      {filteredVehicles.length === 0 && !isLoading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <DirectionsCarIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay vehículos registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Haz clic en 'Nuevo Vehículo' para agregar uno
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
          {editingVehicle ? "Editar Vehículo" : "Nuevo Vehículo"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            {/* Empresa (solo si es superadmin o hay múltiples empresas) */}
            {(user?.role === "superadmin" || companies.length > 1) && (
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
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.idCompany}
                  </Typography>
                )}
              </FormControl>
            )}

            {/* Unidad de Negocio */}
            <FormControl fullWidth>
              <InputLabel>Unidad de Negocio (opcional)</InputLabel>
              <Select
                value={formData.idBusinessUnit || ""}
                label="Unidad de Negocio (opcional)"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idBusinessUnit: e.target.value ? Number(e.target.value) : undefined,
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

            <TextField
              label="Nombre del Vehículo"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
            />

            <TextField
              label="Identificador (Patente)"
              value={formData.identifier}
              onChange={(e) =>
                setFormData({ ...formData, identifier: e.target.value.toUpperCase() })
              }
              error={!!errors.identifier}
              helperText={errors.identifier || "Ej: ABC123"}
              required
              fullWidth
            />

            <TextField
              label="Capacidad de Tanque (Litros)"
              type="number"
              value={formData.nativeLiters || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nativeLiters: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">L</InputAdornment>,
              }}
            />
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
              : editingVehicle
              ? "Guardar Cambios"
              : "Crear Vehículo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de desactivar el vehículo{" "}
            <strong>{deleteVehicle?.name}</strong>?
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
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
