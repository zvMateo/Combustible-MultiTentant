// src/pages/Dashboard/Fuel/tabs/StockMovementsTab.tsx
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  LinearProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";
import MoveUpIcon from "@mui/icons-material/MoveUp";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  useFuelStockMovements,
  useCreateFuelStockMovement,
  useUpdateFuelStockMovement,
  useResources,
  useFuelTypes,
  useMovementTypes,
} from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import type {
  FuelStockMovement,
  CreateFuelStockMovementRequest,
  UpdateFuelStockMovementRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

export default function StockMovementsTab() {
  const { user } = useAuthStore();
  const idCompany = user?.idCompany ?? 0;
  const idBusinessUnit = user?.idBusinessUnit ?? 0;

  const [openDialog, setOpenDialog] = useState(false);
  const [editingMovement, setEditingMovement] = useState<FuelStockMovement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CreateFuelStockMovementRequest>({
    idFuelType: 0,
    idResource: 0,
    date: new Date().toISOString(),
    idMovementType: 0,
    idCompany: idCompany,
    idBusinessUnit: idBusinessUnit,
    liters: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: movements = [], isLoading, error } = useFuelStockMovements();
  const { data: resources = [] } = useResources();
  const { data: fuelTypes = [] } = useFuelTypes();
  const { data: movementTypes = [] } = useMovementTypes();
  const createMutation = useCreateFuelStockMovement();
  const updateMutation = useUpdateFuelStockMovement();

  // Filtrar movimientos
  const filteredMovements = useMemo(() => {
    let filtered = movements;

    if (user?.role !== "superadmin" && idCompany) {
      filtered = filtered.filter((m) => m.idCompany === idCompany);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.resource?.toLowerCase().includes(term) ||
          m.fuelType?.toLowerCase().includes(term) ||
          m.movement?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [movements, searchTerm, idCompany, user?.role]);

  const handleNew = () => {
    setEditingMovement(null);
    setFormData({
      idFuelType: fuelTypes[0]?.id || 0,
      idResource: resources[0]?.id || 0,
      date: new Date().toISOString(),
      idMovementType: movementTypes[0]?.id || 0,
      idCompany: idCompany,
      idBusinessUnit: idBusinessUnit,
      liters: 0,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (movement: FuelStockMovement) => {
    setEditingMovement(movement);
    setFormData({
      idFuelType: movement.idFuelType,
      idResource: movement.idResource,
      date: movement.date,
      idMovementType: movement.idMovementType,
      idCompany: movement.idCompany,
      idBusinessUnit: movement.idBusinessUnit,
      liters: movement.liters,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.idFuelType || formData.idFuelType === 0) {
      newErrors.idFuelType = "Debe seleccionar un tipo de combustible";
    }
    if (!formData.idResource || formData.idResource === 0) {
      newErrors.idResource = "Debe seleccionar un recurso";
    }
    if (!formData.idMovementType || formData.idMovementType === 0) {
      newErrors.idMovementType = "Debe seleccionar un tipo de movimiento";
    }
    if (formData.liters <= 0) {
      newErrors.liters = "Los litros deben ser mayores a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingMovement) {
        const updateData: UpdateFuelStockMovementRequest = {
          id: editingMovement.id,
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

  const handleExport = () => {
    const dataToExport = filteredMovements.map((m) => ({
      Fecha: new Date(m.date).toLocaleDateString(),
      "Tipo Combustible": m.fuelType,
      Recurso: m.resource,
      Movimiento: m.movement || "-",
      Empresa: m.company,
      "Unidad de Negocio": m.businessUnit,
      Litros: m.liters,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(
      wb,
      `movimientos_stock_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Archivo exportado correctamente");
  };

  if (isLoading) {
    return (
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Box sx={{ p: 3 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Cargando movimientos de stock...</Typography>
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Error al cargar movimientos: {error instanceof Error ? error.message : "Error desconocido"}
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
              Movimientos de Stock
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredMovements.length} {filteredMovements.length === 1 ? "movimiento" : "movimientos"} registrados
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={filteredMovements.length === 0}
              size="small"
            >
              Exportar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
              disabled={createMutation.isPending}
              size="small"
            >
              Nuevo Movimiento
            </Button>
          </Box>
        </Box>

        {/* Buscador */}
        <TextField
          placeholder="Buscar por recurso, combustible o tipo..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Tabla */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Combustible</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Recurso</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo Movimiento</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Empresa</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Litros
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMovements.map((movement) => (
                <TableRow key={movement.id} hover>
                  <TableCell>
                    {new Date(movement.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{movement.fuelType}</TableCell>
                  <TableCell>{movement.resource}</TableCell>
                  <TableCell>
                    <Chip
                      label={movement.movement || "Sin tipo"}
                      size="small"
                      sx={{
                        bgcolor: "#3b82f615",
                        color: "#3b82f6",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>{movement.company}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${movement.liters} L`}
                      size="small"
                      sx={{
                        bgcolor: "#10b98115",
                        color: "#10b981",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(movement)}
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

        {filteredMovements.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <MoveUpIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay movimientos registrados
            </Typography>
          </Box>
        )}
      </Box>

      {/* Dialog Crear/Editar */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMovement ? "Editar Movimiento" : "Nuevo Movimiento de Stock"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" error={!!errors.idFuelType}>
                  <InputLabel>Tipo de Combustible *</InputLabel>
                  <Select
                    value={formData.idFuelType}
                    label="Tipo de Combustible *"
                    onChange={(e) =>
                      setFormData({ ...formData, idFuelType: Number(e.target.value) })
                    }
                  >
                    {fuelTypes.map((ft) => (
                      <MenuItem key={ft.id} value={ft.id}>
                        {ft.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.idFuelType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.idFuelType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" error={!!errors.idResource}>
                  <InputLabel>Recurso *</InputLabel>
                  <Select
                    value={formData.idResource}
                    label="Recurso *"
                    onChange={(e) =>
                      setFormData({ ...formData, idResource: Number(e.target.value) })
                    }
                  >
                    {resources.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name} ({r.identifier})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.idResource && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.idResource}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha"
                  type="datetime-local"
                  value={formData.date.split(".")[0]}
                  onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" error={!!errors.idMovementType}>
                  <InputLabel>Tipo de Movimiento *</InputLabel>
                  <Select
                    value={formData.idMovementType}
                    label="Tipo de Movimiento *"
                    onChange={(e) =>
                      setFormData({ ...formData, idMovementType: Number(e.target.value) })
                    }
                  >
                    {movementTypes.map((mt) => (
                      <MenuItem key={mt.id} value={mt.id}>
                        {mt.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.idMovementType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.idMovementType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Litros *"
                  type="number"
                  value={formData.liters}
                  onChange={(e) =>
                    setFormData({ ...formData, liters: Number(e.target.value) })
                  }
                  error={!!errors.liters}
                  helperText={errors.liters}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">L</InputAdornment>,
                  }}
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
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : editingMovement
              ? "Guardar Cambios"
              : "Crear Movimiento"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
