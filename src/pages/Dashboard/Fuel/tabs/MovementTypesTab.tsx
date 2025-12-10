// src/pages/Dashboard/Fuel/tabs/MovementTypesTab.tsx
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import {
  useMovementTypes,
  useCreateMovementType,
  useUpdateMovementType,
  useDeactivateMovementType,
} from "@/hooks/queries";
import type {
  MovementType,
  CreateMovementTypeRequest,
  UpdateMovementTypeRequest,
} from "@/types/api.types";

export default function MovementTypesTab() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState<MovementType | null>(null);
  const [formData, setFormData] = useState<CreateMovementTypeRequest>({
    name: "",
  });
  const [errors, setErrors] = useState({ name: "" });

  // React Query hooks
  const { data: movementTypes = [], isLoading, error } = useMovementTypes();
  const createMutation = useCreateMovementType();
  const updateMutation = useUpdateMovementType();
  const deactivateMutation = useDeactivateMovementType();

  const handleNew = () => {
    setEditingType(null);
    setFormData({ name: "" });
    setErrors({ name: "" });
    setOpenDialog(true);
  };

  const handleEdit = (type: MovementType) => {
    setEditingType(type);
    setFormData({ name: type.name });
    setErrors({ name: "" });
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors = { name: "" };

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    setErrors(newErrors);
    return !newErrors.name;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingType) {
        const updateData: UpdateMovementTypeRequest = {
          id: editingType.id,
          name: formData.name,
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

  const handleToggleActive = async (id: number) => {
    try {
      await deactivateMutation.mutateAsync(id);
    } catch {
      // Error manejado por el mutation
    }
  };

  if (isLoading) {
    return (
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Box sx={{ p: 3 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Cargando tipos de movimiento...</Typography>
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Error al cargar tipos de movimiento:{" "}
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
              Tipos de Movimiento
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maestro de tipos de movimiento de stock
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
            disabled={createMutation.isPending}
            size="small"
          >
            Nuevo Tipo
          </Button>
        </Box>

        {/* Tabla */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movementTypes.map((type) => (
                <TableRow key={type.id} hover>
                  <TableCell>{type.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SwapVertIcon sx={{ fontSize: 20, color: "#3b82f6" }} />
                      <Typography fontWeight={600}>{type.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={type.active ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        bgcolor: type.active ? "#10b98115" : "#f3f4f6",
                        color: type.active ? "#10b981" : "#6b7280",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(type)}
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
                        onClick={() => handleToggleActive(type.id)}
                        disabled={deactivateMutation.isPending}
                        sx={{
                          bgcolor: type.active ? "#fee2e2" : "#dcfce7",
                          color: type.active ? "#dc2626" : "#10b981",
                          "&:hover": {
                            bgcolor: type.active ? "#fecaca" : "#bbf7d0",
                          },
                        }}
                      >
                        {type.active ? (
                          <ToggleOffIcon fontSize="small" />
                        ) : (
                          <ToggleOnIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {movementTypes.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <SwapVertIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay tipos de movimiento configurados
            </Typography>
          </Box>
        )}
      </Box>

      {/* Dialog Crear/Editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingType ? "Editar Tipo de Movimiento" : "Nuevo Tipo de Movimiento"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Nombre *"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              size="small"
              placeholder="Ej: Carga, Consumo, Transferencia"
              autoFocus
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
              : editingType
              ? "Guardar Cambios"
              : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
