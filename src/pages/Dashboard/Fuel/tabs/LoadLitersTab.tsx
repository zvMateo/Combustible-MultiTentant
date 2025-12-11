// src/pages/Dashboard/Fuel/tabs/LoadLitersTab.tsx
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  useLoadLiters,
  useCreateLoadLiters,
  useUpdateLoadLiters,
} from "@/hooks/queries";
import { useResources, useFuelTypes } from "@/hooks/queries";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type {
  LoadLiters,
  CreateLoadLitersRequest,
  UpdateLoadLitersRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

export default function LoadLitersTab() {
  const {
    showCreateButtons,
    showExportButtons,
    isReadOnly,
    companyIdFilter,
    unidadIdsFilter,
    isSupervisor,
    isAuditor,
  } = useRoleLogic();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingLoad, setEditingLoad] = useState<LoadLiters | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CreateLoadLitersRequest>({
    idResource: 0,
    loadDate: new Date().toISOString().split("T")[0],
    initialLiters: 0,
    finalLiters: 0,
    totalLiters: 0,
    detail: "",
    idFuelType: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: loads = [], isLoading } = useLoadLiters();
  const { data: resources = [] } = useResources();
  const { data: fuelTypes = [] } = useFuelTypes();
  const createMutation = useCreateLoadLiters();
  const updateMutation = useUpdateLoadLiters();

  // Filtrar cargas por empresa, unidad y búsqueda según el rol
  const filteredLoads = useMemo(() => {
    let filtered = loads;

    // 1. Filtrar por empresa (a través del recurso)
    if (companyIdFilter && companyIdFilter > 0) {
      filtered = filtered.filter(
        (l) => l.resource?.idCompany === companyIdFilter
      );
    }

    // 2. Filtrar por unidad de negocio (Supervisor y Auditor solo ven cargas de su(s) unidad(es))
    if (
      (isSupervisor || isAuditor) &&
      unidadIdsFilter &&
      unidadIdsFilter.length > 0
    ) {
      filtered = filtered.filter((l) => {
        // Si el recurso tiene unidad asignada, verificar que esté en las unidades del usuario
        if (l.resource?.idBusinessUnit) {
          return unidadIdsFilter.includes(l.resource.idBusinessUnit);
        }
        // Si no tiene unidad asignada, no mostrarlo para supervisor/auditor
        return false;
      });
    }

    // 3. Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.nameResource && l.nameResource.toLowerCase().includes(term)) ||
          (l.resource?.name && l.resource.name.toLowerCase().includes(term)) ||
          (l.resource?.identifier &&
            l.resource.identifier.toLowerCase().includes(term)) ||
          (l.detail && l.detail.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [
    loads,
    searchTerm,
    companyIdFilter,
    isSupervisor,
    isAuditor,
    unidadIdsFilter,
  ]);

  const handleNew = () => {
    setEditingLoad(null);
    setFormData({
      idResource: resources[0]?.id || 0,
      loadDate: new Date().toISOString().split("T")[0],
      initialLiters: 0,
      finalLiters: 0,
      totalLiters: 0,
      detail: "",
      idFuelType: fuelTypes[0]?.id || 0,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (load: LoadLiters) => {
    setEditingLoad(load);
    setFormData({
      idResource: load.idResource,
      loadDate: load.loadDate.split("T")[0],
      initialLiters: load.initialLiters,
      finalLiters: load.finalLiters,
      totalLiters: load.totalLiters,
      detail: load.detail || "",
      idFuelType: load.idFuelType,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.idResource || formData.idResource === 0) {
      newErrors.idResource = "Debe seleccionar un recurso";
    }
    if (!formData.loadDate) {
      newErrors.loadDate = "La fecha es obligatoria";
    }
    if (formData.initialLiters < 0) {
      newErrors.initialLiters = "Los litros iniciales no pueden ser negativos";
    }
    if (formData.finalLiters < 0) {
      newErrors.finalLiters = "Los litros finales no pueden ser negativos";
    }
    if (formData.finalLiters < formData.initialLiters) {
      newErrors.finalLiters =
        "Los litros finales deben ser mayores a los iniciales";
    }
    if (!formData.idFuelType || formData.idFuelType === 0) {
      newErrors.idFuelType = "Debe seleccionar un tipo de combustible";
    }

    // Calcular total automáticamente
    if (formData.initialLiters >= 0 && formData.finalLiters >= 0) {
      setFormData((prev) => ({
        ...prev,
        totalLiters: formData.finalLiters - formData.initialLiters,
      }));
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingLoad) {
        const updateData: UpdateLoadLitersRequest = {
          id: editingLoad.id,
          idResource: formData.idResource,
          loadDate: new Date(formData.loadDate).toISOString(),
          initialLiters: formData.initialLiters,
          finalLiters: formData.finalLiters,
          totalLiters: formData.totalLiters,
          detail: formData.detail,
          idFuelType: formData.idFuelType,
        };
        await updateMutation.mutateAsync({
          id: editingLoad.id,
          data: updateData,
        });
      } else {
        const createData: CreateLoadLitersRequest = {
          ...formData,
          loadDate: new Date(formData.loadDate).toISOString(),
        };
        await createMutation.mutateAsync(createData);
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = filteredLoads.map((l) => ({
      Fecha: l.loadDate.split("T")[0],
      Recurso: l.nameResource || l.resource?.name || "",
      Identificador: l.resource?.identifier || "",
      "Litros Iniciales": l.initialLiters,
      "Litros Finales": l.finalLiters,
      "Total Litros": l.totalLiters,
      "Tipo Combustible": l.nameFuelType || l.fuelType?.name || "",
      Detalle: l.detail || "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cargas");
    XLSX.writeFile(
      wb,
      `cargas_litros_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Archivo exportado correctamente");
  };

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
              Cargas de Litros
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredLoads.length}{" "}
              {filteredLoads.length === 1
                ? "carga registrada"
                : "cargas registradas"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {showExportButtons && (
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                disabled={filteredLoads.length === 0}
                size="small"
              >
                Exportar
              </Button>
            )}
            {showCreateButtons && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNew}
                disabled={createMutation.isPending || isReadOnly}
                size="small"
              >
                Nueva Carga
              </Button>
            )}
          </Box>
        </Box>

        {/* Buscador */}
        <TextField
          placeholder="Buscar por recurso o detalle..."
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
                <TableCell sx={{ fontWeight: 700 }}>Recurso</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  L. Iniciales
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  L. Finales
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Total
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Combustible</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLoads.map((load) => (
                <TableRow key={load.id} hover>
                  <TableCell>
                    {new Date(load.loadDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {load.nameResource || load.resource?.name || "-"}
                  </TableCell>
                  <TableCell align="right">{load.initialLiters} L</TableCell>
                  <TableCell align="right">{load.finalLiters} L</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${load.totalLiters} L`}
                      size="small"
                      sx={{
                        bgcolor: "#10b98115",
                        color: "#10b981",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {load.nameFuelType || load.fuelType?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(load)}
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

        {filteredLoads.length === 0 && !isLoading && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <LocalGasStationIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay cargas registradas
            </Typography>
          </Box>
        )}
      </Box>

      {/* Dialog Crear/Editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingLoad ? "Editar Carga" : "Nueva Carga de Litros"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" error={!!errors.idResource}>
                  <InputLabel>Recurso *</InputLabel>
                  <Select
                    value={formData.idResource}
                    label="Recurso *"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idResource: Number(e.target.value),
                      })
                    }
                  >
                    {resources.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name} ({r.identifier})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.idResource && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.idResource}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Carga"
                  type="date"
                  value={formData.loadDate}
                  onChange={(e) =>
                    setFormData({ ...formData, loadDate: e.target.value })
                  }
                  error={!!errors.loadDate}
                  helperText={errors.loadDate}
                  required
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Litros Iniciales"
                  type="number"
                  value={formData.initialLiters}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialLiters: Number(e.target.value),
                    })
                  }
                  error={!!errors.initialLiters}
                  helperText={errors.initialLiters}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">L</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Litros Finales"
                  type="number"
                  value={formData.finalLiters}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      finalLiters: Number(e.target.value),
                    })
                  }
                  error={!!errors.finalLiters}
                  helperText={errors.finalLiters}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">L</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Total Litros"
                  type="number"
                  value={formData.totalLiters}
                  disabled
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">L</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" error={!!errors.idFuelType}>
                  <InputLabel>Tipo de Combustible *</InputLabel>
                  <Select
                    value={formData.idFuelType}
                    label="Tipo de Combustible *"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idFuelType: Number(e.target.value),
                      })
                    }
                  >
                    {fuelTypes.map((ft) => (
                      <MenuItem key={ft.id} value={ft.id}>
                        {ft.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.idFuelType && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.idFuelType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Detalle (opcional)"
                  value={formData.detail || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, detail: e.target.value })
                  }
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
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
              : editingLoad
              ? "Guardar Cambios"
              : "Crear Carga"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
