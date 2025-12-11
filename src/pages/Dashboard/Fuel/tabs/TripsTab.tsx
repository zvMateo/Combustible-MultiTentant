// src/pages/Dashboard/Fuel/tabs/TripsTab.tsx
import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  TextField,
  LinearProgress,
  Alert,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import {
  useTrips,
  useCreateTrip,
  useUpdateTrip,
  useDrivers,
} from "@/hooks/queries";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type {
  Trip,
  CreateTripRequest,
  UpdateTripRequest,
} from "@/types/api.types";

// Tipo local para el formulario (incluye campos adicionales del UI)
interface TripFormData {
  idDriver: number;
  startDate: string;
  origin: string;
  destination: string;
  distance: number;
  notes: string;
}

export default function TripsTab() {
  const { canEdit, showCreateButtons, showEditButtons, isReadOnly } =
    useRoleLogic();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<TripFormData>({
    idDriver: 0,
    startDate: new Date().toISOString().slice(0, 16),
    origin: "",
    destination: "",
    distance: 0,
    notes: "",
  });
  const [errors, setErrors] = useState({
    idDriver: "",
    origin: "",
    destination: "",
  });

  // React Query hooks
  const { data: trips = [], isLoading, error } = useTrips();
  const { data: drivers = [] } = useDrivers();
  const createMutation = useCreateTrip();
  const updateMutation = useUpdateTrip();

  const handleNew = () => {
    setEditingTrip(null);
    setFormData({
      idDriver: 0,
      startDate: new Date().toISOString().slice(0, 16),
      origin: "",
      destination: "",
      distance: 0,
      notes: "",
    });
    setErrors({ idDriver: "", origin: "", destination: "" });
    setOpenDialog(true);
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      idDriver: trip.idDriver,
      startDate: trip.startDate
        ? new Date(trip.startDate).toISOString().slice(0, 16)
        : trip.createdAt
        ? new Date(trip.createdAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      origin: trip.origin || trip.initialLocation || "",
      destination: trip.destination || trip.finalLocation || "",
      distance: trip.distance || trip.totalKm || 0,
      notes: trip.notes || "",
    });
    setErrors({ idDriver: "", origin: "", destination: "" });
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors = {
      idDriver: "",
      origin: "",
      destination: "",
    };

    if (!formData.idDriver || formData.idDriver === 0)
      newErrors.idDriver = "El conductor es obligatorio";
    if (!formData.origin?.trim()) newErrors.origin = "El origen es obligatorio";
    if (!formData.destination?.trim())
      newErrors.destination = "El destino es obligatorio";

    setErrors(newErrors);
    return !Object.values(newErrors).some((err) => err);
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      // Preparar datos para la API (mapear campos del formulario a la estructura de la API)
      const apiData: CreateTripRequest = {
        idDriver: formData.idDriver,
        initialLocation: formData.origin || "",
        finalLocation: formData.destination || "",
        totalKm: formData.distance || 0,
      };

      if (editingTrip) {
        const updateData: UpdateTripRequest = {
          id: editingTrip.id,
          ...apiData,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(apiData);
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  if (isLoading) {
    return (
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Box sx={{ p: 3 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Cargando viajes...</Typography>
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Error al cargar viajes:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </Alert>
        </Box>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Viajes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de viajes y recorridos
            </Typography>
          </Box>
          {showCreateButtons && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
              disabled={createMutation.isPending || isReadOnly}
              size="small"
            >
              Nuevo Viaje
            </Button>
          )}
        </Box>

        {/* Tabla */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Conductor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Origen</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Destino</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Distancia (km)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id} hover>
                  <TableCell>{trip.id}</TableCell>
                  <TableCell>
                    {trip.nameDriver ||
                      drivers.find((d) => d.id === trip.idDriver)?.name ||
                      `Driver #${trip.idDriver}`}
                  </TableCell>
                  <TableCell>{trip.initialLocation || "-"}</TableCell>
                  <TableCell>{trip.finalLocation || "-"}</TableCell>
                  <TableCell>{trip.totalKm || "-"}</TableCell>
                  <TableCell>
                    {!isReadOnly && showEditButtons && (
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(trip)}
                        disabled={updateMutation.isPending || !canEdit}
                        sx={{
                          bgcolor: "#f3f4f6",
                          "&:hover": { bgcolor: "#e5e7eb" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {trips.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <DirectionsCarIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay viajes registrados
            </Typography>
          </Box>
        )}
      </Box>

      {/* Dialog Crear/Editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTrip ? "Editar Viaje" : "Nuevo Viaje"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Conductor *"
              value={formData.idDriver}
              onChange={(e) =>
                setFormData({ ...formData, idDriver: Number(e.target.value) })
              }
              error={!!errors.idDriver}
              helperText={errors.idDriver}
              fullWidth
              size="small"
            >
              <MenuItem value={0}>Seleccionar conductor</MenuItem>
              {drivers
                .filter((driver) => driver.isActive !== false)
                .map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.name} {driver.dni ? `(${driver.dni})` : ""}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              label="Origen *"
              value={formData.origin}
              onChange={(e) =>
                setFormData({ ...formData, origin: e.target.value })
              }
              error={!!errors.origin}
              helperText={errors.origin}
              fullWidth
              size="small"
            />

            <TextField
              label="Destino *"
              value={formData.destination}
              onChange={(e) =>
                setFormData({ ...formData, destination: e.target.value })
              }
              error={!!errors.destination}
              helperText={errors.destination}
              fullWidth
              size="small"
            />

            <TextField
              label="Fecha de Inicio"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              fullWidth
              size="small"
            />

            <TextField
              label="Distancia (km)"
              type="number"
              value={formData.distance}
              onChange={(e) =>
                setFormData({ ...formData, distance: Number(e.target.value) })
              }
              fullWidth
              size="small"
            />

            <TextField
              label="Notas"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              multiline
              rows={2}
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : editingTrip
              ? "Guardar Cambios"
              : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
