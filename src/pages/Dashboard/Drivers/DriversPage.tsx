// src/pages/Dashboard/Drivers/DriversPage.tsx
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
  LinearProgress,
  MenuItem,
  Alert,
  Skeleton,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import BadgeIcon from "@mui/icons-material/Badge";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeactivateDriver,
} from "@/hooks/queries";
import { useCompanies } from "@/hooks/queries";
import type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

// Colores para avatares
const getAvatarColor = (name: string): string => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

// Obtener iniciales
const getInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function DriversPage() {
  const { user } = useAuthStore();
  const idCompany = user?.empresaId ?? 0;
  const isSuperAdmin = (user?.role || "").toLowerCase() === "superadmin";

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<CreateDriverRequest>({
    idCompany: idCompany || 0,
    name: "",
    dni: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: drivers = [], isLoading, error } = useDrivers(idCompany);
  const { data: companies = [] } = useCompanies();
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deactivateMutation = useDeactivateDriver();

  // Filtrar choferes por búsqueda
  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) return drivers;
    const term = searchTerm.toLowerCase();
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.dni.toLowerCase().includes(term) ||
        (d.phoneNumber && d.phoneNumber.toLowerCase().includes(term))
    );
  }, [drivers, searchTerm]);

  // Handlers
  const handleNew = () => {
    const fallbackCompanyId =
      idCompany ||
      companies[0]?.id ||
      (companies.length > 0 ? companies[0].id : 0);

    setEditingDriver(null);
    setFormData({
      idCompany: 2,
      name: "",
      dni: "",
      phoneNumber: "",
    });
    setErrors({});
    setOpenDialog(true);

    console.log(formData);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      idCompany: driver.idCompany,
      name: driver.name,
      dni: driver.dni,
      phoneNumber: driver.phoneNumber || "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (driver: Driver) => {
    setDeleteDriver(driver);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }
    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es obligatorio";
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = "DNI inválido (7-8 dígitos)";
    }

    // Asegurar que idCompany tenga un valor válido
    const finalIdCompany =
      formData.idCompany || idCompany || companies[0]?.id || 0;
    if (!finalIdCompany || finalIdCompany === 0) {
      newErrors.idCompany = "Debe seleccionar una empresa";
      if (import.meta.env.DEV) {
        console.error("❌ [DriversPage] idCompany inválido:", {
          formDataIdCompany: formData.idCompany,
          userIdCompany: idCompany,
          companies: companies.map((c) => ({ id: c.id, name: c.name })),
          user: user
            ? { id: user.id, empresaId: user.empresaId, role: user.role }
            : null,
        });
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (import.meta.env.DEV && !isValid) {
      console.warn("⚠️ [DriversPage] Validación falló:", newErrors);
      console.warn("⚠️ [DriversPage] formData actual:", formData);
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

    if (!validate()) {
      toast.error("Completa los campos obligatorios");
      if (import.meta.env.DEV) {
        console.error("❌ [DriversPage] POST bloqueado por validación");
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log("✅ [DriversPage] Validación OK, ejecutando POST:", {
        editing: !!editingDriver,
        formData: { ...formData, idCompany: finalIdCompany },
      });
    }

    try {
      // Usar el idCompany final (puede haber sido corregido)
      const finalIdCompany =
        formData.idCompany || idCompany || companies[0]?.id || 0;
      const dataToSend = {
        ...formData,
        idCompany: finalIdCompany,
      };

      if (editingDriver) {
        const updateData: UpdateDriverRequest = {
          id: editingDriver.id,
          idCompany: dataToSend.idCompany,
          name: dataToSend.name,
          dni: dataToSend.dni,
          phoneNumber: dataToSend.phoneNumber,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(dataToSend);
      }
      setOpenDialog(false);
    } catch (error) {
      // Error manejado por el mutation
      if (import.meta.env.DEV) {
        console.error("❌ [DriversPage] Error en handleSave:", error);
      }
    }
  };

  // Si el form quedó con idCompany = 0 pero ya tenemos empresas / usuario, setearlo
  useEffect(() => {
    if (!formData.idCompany) {
      const fallbackCompanyId =
        idCompany ||
        companies[0]?.id ||
        (companies.length > 0 ? companies[0].id : 0);
      setFormData((prev) => ({
        ...prev,
        idCompany: prev.idCompany || fallbackCompanyId,
      }));
    }
  }, [companies, formData.idCompany, idCompany]);

  const handleDelete = async () => {
    if (!deleteDriver) return;

    try {
      await deactivateMutation.mutateAsync(deleteDriver.id);
      setOpenDeleteDialog(false);
      setDeleteDriver(null);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = filteredDrivers.map((d) => {
      const company = companies.find((c) => c.id === d.idCompany);
      return {
        Nombre: d.name,
        DNI: d.dni,
        Teléfono: d.phoneNumber || "",
        Empresa: company?.name || "",
        Estado: d.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Drivers");
    XLSX.writeFile(
      wb,
      `drivers_${new Date().toISOString().split("T")[0]}.xlsx`
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
          Error al cargar choferes:{" "}
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
            Driver Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredDrivers.length}{" "}
            {filteredDrivers.length === 1 ? "driver" : "drivers"} registrados
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={filteredDrivers.length === 0}
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
            New Driver
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
          placeholder="Buscar por nombre, DNI o teléfono..."
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

      {/* Grid de choferes */}
      <Grid container spacing={3}>
        {filteredDrivers.map((driver) => {
          const company = companies.find((c) => c.id === driver.idCompany);
          return (
            // @ts-expect-error - MUI v7 Grid type incompatibility
            <Grid xs={12} sm={6} md={4} lg={3} key={driver.id}>
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
                  opacity: driver.isActive !== false ? 1 : 0.7,
                  "&:hover": {
                    boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                    transform: "translateY(-3px)",
                    borderColor: "#10b981",
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
                  {/* Header con avatar */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        bgcolor: getAvatarColor(driver.name),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                      }}
                    >
                      {getInitials(driver.name)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {driver.name}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <BadgeIcon sx={{ fontSize: 14, color: "#6b7280" }} />
                        <Typography variant="body2" color="text.secondary">
                          {driver.dni}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Info de contacto */}
                  {driver.phoneNumber && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mb: 1,
                      }}
                    >
                      <PhoneAndroidIcon
                        sx={{ fontSize: 16, color: "#10b981" }}
                      />
                      <Typography variant="body2">
                        {driver.phoneNumber}
                      </Typography>
                    </Box>
                  )}

                  {/* Empresa */}
                  {company && (
                    <Box sx={{ mb: 1.5 }}>
                      <Chip
                        label={company.name}
                        size="small"
                        sx={{ bgcolor: "#3b82f615", color: "#3b82f6" }}
                      />
                    </Box>
                  )}

                  {/* Estado */}
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                  >
                    <Chip
                      label={driver.isActive !== false ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        bgcolor:
                          driver.isActive !== false ? "#10b98115" : "#f59e0b15",
                        color:
                          driver.isActive !== false ? "#10b981" : "#f59e0b",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* Acciones */}
                  <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(driver)}
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
                      onClick={() => handleDeleteClick(driver)}
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
      {filteredDrivers.length === 0 && !isLoading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <PersonIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay choferes registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Haz clic en 'Nuevo Chofer' para agregar uno
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
          {editingDriver ? "Editar Chofer" : "Nuevo Chofer"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            {/* Empresa */}
            {isSuperAdmin ? (
              <TextField
                select
                label="Empresa *"
                value={formData.idCompany}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idCompany: Number(e.target.value),
                  })
                }
                error={!!errors.idCompany}
                helperText={errors.idCompany}
                fullWidth
                SelectProps={{
                  native: false,
                }}
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                label="Empresa"
                value={
                  companies.find((c) => c.id === idCompany)?.name ||
                  "Empresa actual"
                }
                fullWidth
                disabled
                helperText="Se usará tu empresa actual para crear el chofer"
              />
            )}

            <TextField
              label="Nombre Completo"
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
              label="DNI"
              value={formData.dni}
              onChange={(e) =>
                setFormData({ ...formData, dni: e.target.value })
              }
              error={!!errors.dni}
              helperText={errors.dni || "7-8 dígitos"}
              required
              fullWidth
            />

            <TextField
              label="Teléfono (opcional)"
              value={formData.phoneNumber || ""}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneAndroidIcon sx={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
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
              : editingDriver
              ? "Guardar Cambios"
              : "Crear Chofer"}
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
            ¿Estás seguro de desactivar al chofer{" "}
            <strong>{deleteDriver?.name}</strong>?
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
