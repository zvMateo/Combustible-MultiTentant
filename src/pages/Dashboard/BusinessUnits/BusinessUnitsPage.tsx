// src/pages/Dashboard/BusinessUnits/BusinessUnitsPage.tsx
import { useState, useMemo, useEffect } from "react";
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
  LinearProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import StoreIcon from "@mui/icons-material/Store";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  useBusinessUnits,
  useBusinessUnitsByCompany,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeactivateBusinessUnit,
} from "@/hooks/queries";
import { useCompanies } from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import type {
  BusinessUnit,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
} from "@/types/api.types";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const initialFormData: CreateBusinessUnitRequest = {
  idCompany: 0,
  name: "",
  detail: "",
};

export default function BusinessUnitsPage() {
  const { user } = useAuthStore();
  const idCompany = user?.empresaId ?? 0;
  const isSuperAdmin = (user?.role || "").toLowerCase() === "superadmin";

  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] =
    useState<CreateBusinessUnitRequest>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // React Query hooks
  // Si hay idCompany, usar getByCompany; si no, usar getAll
  const {
    data: businessUnitsAll = [],
    isLoading: loadingAll,
    error: errorAll,
  } = useBusinessUnits();
  const {
    data: businessUnitsByCompany = [],
    isLoading: loadingByCompany,
    error: errorByCompany,
  } = useBusinessUnitsByCompany(idCompany);

  const businessUnits = idCompany ? businessUnitsByCompany : businessUnitsAll;
  const isLoading = idCompany ? loadingByCompany : loadingAll;
  const error = idCompany ? errorByCompany : errorAll;

  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const createMutation = useCreateBusinessUnit();
  const updateMutation = useUpdateBusinessUnit();
  const deactivateMutation = useDeactivateBusinessUnit();

  // Asegurar que idCompany se setee correctamente cuando se abra el diálogo
  useEffect(() => {
    if (openDialog && !formData.idCompany) {
      const fallbackCompanyId =
        idCompany ||
        companies[0]?.id ||
        (companies.length > 0 ? companies[0].id : 0);
      if (fallbackCompanyId && fallbackCompanyId !== formData.idCompany) {
        setFormData((prev) => ({
          ...prev,
          idCompany: prev.idCompany || fallbackCompanyId,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDialog, idCompany, companies]);

  // Filtrar por búsqueda y por empresa si no es superadmin
  const filteredUnits = useMemo(() => {
    let filtered = businessUnits;

    // Filtrar por empresa si el usuario no es superadmin
    if (user?.role !== "superadmin" && idCompany) {
      filtered = filtered.filter((u) => u.idCompany === idCompany);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          (u.detail && u.detail.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [businessUnits, searchTerm, idCompany, user?.role]);

  // Handlers
  const handleNew = () => {
    const fallbackCompanyId =
      idCompany ||
      companies[0]?.id ||
      (companies.length > 0 ? companies[0].id : 0);

    setEditingUnit(null);
    setFormData({
      idCompany: isSuperAdmin
        ? fallbackCompanyId
        : idCompany || fallbackCompanyId,
      name: "",
      detail: "",
    });
    setErrors({});
    setOpenDialog(true);

    // Mostrar advertencia si no hay empresa disponible, pero permitir abrir el modal
    if (!idCompany && companies.length === 0 && !loadingCompanies) {
      toast.error(
        "No hay empresas disponibles. Por favor, contacta al administrador."
      );
    }

    if (import.meta.env.DEV) {
      console.log("✅ [BusinessUnitsPage] handleNew - Modal abierto:", {
        idCompany: isSuperAdmin
          ? fallbackCompanyId
          : idCompany || fallbackCompanyId,
        userIdCompany: idCompany,
        companies: companies.map((c) => ({ id: c.id, name: c.name })),
        isSuperAdmin,
        loadingCompanies,
        openDialog: true,
      });
    }
  };

  const handleEdit = (unit: BusinessUnit) => {
    setEditingUnit(unit);
    setFormData({
      idCompany: unit.idCompany,
      name: unit.name,
      detail: unit.detail || "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDelete = (unit: BusinessUnit) => {
    setDeleteUnit(unit);
    setOpenDeleteDialog(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    // Asegurar que idCompany tenga un valor válido
    // Prioridad: formData.idCompany > idCompany (del usuario) > companies[0]?.id
    const finalIdCompany =
      formData.idCompany || idCompany || companies[0]?.id || 0;

    if (!finalIdCompany || finalIdCompany === 0) {
      if (companies.length === 0 && !loadingCompanies) {
        newErrors.idCompany =
          "No hay empresas disponibles. Contacta al administrador.";
      } else if (loadingCompanies) {
        newErrors.idCompany = "Cargando empresas...";
      } else {
        newErrors.idCompany = "Debe seleccionar una empresa";
      }

      if (import.meta.env.DEV) {
        console.error("❌ [BusinessUnitsPage] idCompany inválido:", {
          formDataIdCompany: formData.idCompany,
          userIdCompany: idCompany,
          companies: companies.map((c) => ({ id: c.id, name: c.name })),
          companiesLength: companies.length,
          loadingCompanies,
          user: user
            ? { id: user.id, empresaId: user.empresaId, role: user.role }
            : null,
        });
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (import.meta.env.DEV && !isValid) {
      console.warn("⚠️ [BusinessUnitsPage] Validación falló:", newErrors);
      console.warn("⚠️ [BusinessUnitsPage] formData actual:", formData);
    }

    return isValid;
  };

  const handleSave = async () => {
    // Asegurar idCompany antes de validar
    const finalIdCompany =
      formData.idCompany || idCompany || companies[0]?.id || 0;
    if (finalIdCompany && finalIdCompany !== formData.idCompany) {
      setFormData((prev) => ({ ...prev, idCompany: finalIdCompany }));
    }

    if (!validateForm()) {
      if (import.meta.env.DEV) {
        console.error("❌ [BusinessUnitsPage] POST bloqueado por validación");
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log("✅ [BusinessUnitsPage] Validación OK, ejecutando POST:", {
        editing: !!editingUnit,
        formData: { ...formData, idCompany: finalIdCompany },
      });
    }

    try {
      // Usar el idCompany final calculado arriba
      const dataToSend = {
        ...formData,
        idCompany: finalIdCompany,
      };

      if (editingUnit) {
        const updateData: UpdateBusinessUnitRequest = {
          id: editingUnit.id,
          idCompany: dataToSend.idCompany,
          name: dataToSend.name,
          detail: dataToSend.detail,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(dataToSend);
      }
      setOpenDialog(false);
    } catch (error) {
      // Error manejado por el mutation
      if (import.meta.env.DEV) {
        console.error("❌ [BusinessUnitsPage] Error en handleSave:", error);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteUnit) {
      try {
        await deactivateMutation.mutateAsync(deleteUnit.id);
        setOpenDeleteDialog(false);
        setDeleteUnit(null);
      } catch (error) {
        // Error manejado por el mutation
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredUnits.map((u) => {
      const company = companies.find((c) => c.id === u.idCompany);
      return {
        Nombre: u.name,
        Detalle: u.detail || "",
        Empresa: company?.name || "",
        Estado: u.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Business Units");
    XLSX.writeFile(
      wb,
      `business_units_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Stats
  const stats = {
    total: filteredUnits.length,
    activas: filteredUnits.filter((u) => u.isActive !== false).length,
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
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
          Error al cargar unidades de negocio:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ color: "#1e293b", mb: 1 }}
        >
          Business Units
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
        <Card
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
                  bgcolor: "#3b82f615",
                  color: "#3b82f6",
                }}
              >
                <StoreIcon />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ color: "#1e293b" }}
                >
                  {stats.total}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Total Unidades
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card
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
                  bgcolor: "#10b98115",
                  color: "#10b981",
                }}
              >
                <StoreIcon />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ color: "#1e293b" }}
                >
                  {stats.activas}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Activas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
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
            disabled={filteredUnits.length === 0}
            sx={{ borderRadius: 2 }}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
            disabled={
              createMutation.isPending ||
              (!idCompany && companies.length === 0 && !loadingCompanies)
            }
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
        {filteredUnits.map((unit, index) => {
          const company = companies.find((c) => c.id === unit.idCompany);
          return (
            <Fade in timeout={300 + index * 100} key={unit.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  transition: "all 0.2s",
                  opacity: unit.isActive !== false ? 1 : 0.7,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  },
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "#3b82f615",
                        }}
                      >
                        <StoreIcon sx={{ fontSize: 28, color: "#3b82f6" }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ color: "#1e293b", mb: 0.5 }}
                        >
                          {unit.name}
                        </Typography>
                        {company && (
                          <Chip
                            label={company.name}
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: "#f1f5f9",
                              color: "#475569",
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Chip
                      label={unit.isActive !== false ? "Activa" : "Inactiva"}
                      size="small"
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        bgcolor:
                          unit.isActive !== false ? "#10b98115" : "#f59e0b15",
                        color: unit.isActive !== false ? "#10b981" : "#f59e0b",
                      }}
                    />
                  </Box>

                  {/* Detalle */}
                  {unit.detail && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        {unit.detail}
                      </Typography>
                    </Box>
                  )}

                  {/* Acciones */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                      pt: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(unit)}
                      disabled={updateMutation.isPending}
                      sx={{
                        bgcolor: "#f1f5f9",
                        "&:hover": { bgcolor: "#e2e8f0" },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18, color: "#3b82f6" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(unit)}
                      disabled={deactivateMutation.isPending}
                      sx={{
                        bgcolor: "#fef2f2",
                        "&:hover": { bgcolor: "#fee2e2" },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          );
        })}
      </Box>

      {/* Empty State */}
      {!isLoading && filteredUnits.length === 0 && (
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
            disabled={!idCompany && companies.length === 0}
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
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingUnit ? "Editar Unidad de Negocio" : "Nueva Unidad de Negocio"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Empresa */}
              {isSuperAdmin && companies.length > 0 && (
                <Grid item xs={12}>
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
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5 }}
                      >
                        {errors.idCompany}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              )}

              {/* Mensaje informativo para usuarios no superadmin */}
              {!isSuperAdmin && idCompany > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Se usará tu empresa actual para crear la unidad de negocio
                  </Alert>
                </Grid>
              )}

              {/* Alerta si no hay empresa disponible */}
              {!idCompany && companies.length === 0 && !loadingCompanies && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    No hay empresas disponibles. Por favor, contacta al
                    administrador o verifica tu sesión.
                  </Alert>
                </Grid>
              )}

              {/* Nombre */}
              <Grid item xs={12}>
                <TextField
                  label="Nombre"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>

              {/* Detalle */}
              <Grid item xs={12}>
                <TextField
                  label="Detalle (opcional)"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.detail || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, detail: e.target.value })
                  }
                  helperText="Información adicional sobre la unidad de negocio"
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
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              (!idCompany && companies.length === 0 && !loadingCompanies)
            }
            sx={{ borderRadius: 2 }}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : editingUnit
              ? "Guardar Cambios"
              : "Crear Unidad"}
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
        <DialogTitle sx={{ fontWeight: 700 }}>Desactivar Unidad</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de desactivar la unidad{" "}
            <strong>{deleteUnit?.name}</strong>?
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
            disabled={deactivateMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            {deactivateMutation.isPending ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
