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
  Chip,
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
  useResources,
} from "@/hooks/queries";
import type {
  Trip,
  CreateTripRequest,
  UpdateTripRequest,
} from "@/types/api.types";

export default function TripsTab() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<CreateTripRequest>({
    idDriver: 0,
    idVehicle: 0,
    startDate: new Date().toISOString().slice(0, 16),
    origin: "",
    destination: "",
    distance: 0,
    notes: "",
  });
  const [errors, setErrors] = useState({
    idDriver: "",
    idVehicle: "",
    origin: "",
    destination: "",
  });

  // React Query hooks
  const { data: trips = [], isLoading, error } = useTrips();
  const { data: drivers = [] } = useDrivers();
  const { data: resources = [] } = useResources();
  const createMutation = useCreateTrip();
  const updateMutation = useUpdateTrip();

  // Filtrar solo vehículos
  const vehicles = resources.filter((r) => r.resourceType === "Vehicle");

  const handleNew = () => {
    setEditingTrip(null);
    setFormData({
      idDriver: 0,
      idVehicle: 0,
      startDate: new Date().toISOString().slice(0, 16),
      origin: "",
      destination: "",
      distance: 0,
      notes: "",
    });
    setErrors({ idDriver: "", idVehicle: "", origin: "", destination: "" });
    setOpenDialog(true);
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      idDriver: trip.idDriver,
      idVehicle: trip.idVehicle,
      startDate: new Date(trip.startDate).toISOString().slice(0, 16),
      origin: trip.origin,
      destination: trip.destination,
      distance: trip.distance || 0,
      notes: trip.notes || "",
    });
    setErrors({ idDriver: "", idVehicle: "", origin: "", destination: "" });
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors = {
      idDriver: "",
      idVehicle: "",
      origin: "",
      destination: "",
    };

    if (!formData.idDriver) newErrors.idDriver = "El conductor es obligatorio";
    if (!formData.idVehicle) newErrors.idVehicle = "El vehículo es obligatorio";
    if (!formData.origin.trim()) newErrors.origin = "El origen es obligatorio";
    if (!formData.destination.trim())
      newErrors.destination = "El destino es obligatorio";

    setErrors(newErrors);
    return !Object.values(newErrors).some((err) => err);
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingTrip) {
        const updateData: UpdateTripRequest = {
          id: editingTrip.id,
          ...formData,
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
            disabled={createMutation.isPending}
            size="small"
          >
            Nuevo Viaje
          </Button>
        </Box>

        {/* Tabla */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Conductor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ruta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Distancia (km)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id} hover>
                  <TableCell>{trip.id}</TableCell>
                  <TableCell>
                    {drivers.find((d) => d.id === trip.idDriver)?.fullName ||
                      `Driver #${trip.idDriver}`}
                  </TableCell>
                  <TableCell>
                    {vehicles.find((v) => v.id === trip.idVehicle)?.name ||
                      `Vehicle #${trip.idVehicle}`}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {trip.origin}
                      </Typography>
                      <DirectionsCarIcon sx={{ fontSize: 16, color: "#3b82f6" }} />
                      <Typography variant="body2" fontWeight={600}>
                        {trip.destination}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(trip.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{trip.distance || "-"}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(trip)}
                      disabled={updateMutation.isPending}
                      sx={{
                        bgcolor: "#f3f4f6",
                        "&:hover": { bgcolor: "#e5e7eb" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
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
              {drivers.map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.fullName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Vehículo *"
              value={formData.idVehicle}
              onChange={(e) =>
                setFormData({ ...formData, idVehicle: Number(e.target.value) })
              }
              error={!!errors.idVehicle}
              helperText={errors.idVehicle}
              fullWidth
              size="small"
            >
              <MenuItem value={0}>Seleccionar vehículo</MenuItem>
              {vehicles.map((vehicle) => (
                <MenuItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
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
