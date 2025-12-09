// src/pages/Dashboard/Companies/CompaniesPage.tsx
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
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeactivateCompany,
} from "@/hooks/queries";
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

export default function CompaniesPage() {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [formData, setFormData] = useState<CreateCompanyRequest>({
    name: "",
    detail: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: companies = [], isLoading, error } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deactivateMutation = useDeactivateCompany();

  // Filtrar empresas por búsqueda
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.detail && c.detail.toLowerCase().includes(term))
    );
  }, [companies, searchTerm]);

  const handleNew = (): void => {
    setEditingCompany(null);
    setFormData({
      name: "",
      detail: "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (company: Company): void => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      detail: company.detail || "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (): Promise<void> => {
    if (!validate()) return;

    try {
      if (editingCompany) {
        const updateData: UpdateCompanyRequest = {
          id: editingCompany.id,
          name: formData.name,
          detail: formData.detail,
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

  const handleDeleteClick = (company: Company): void => {
    setDeleteCompany(company);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async (): Promise<void> => {
    if (deleteCompany) {
      try {
        await deactivateMutation.mutateAsync(deleteCompany.id);
        setOpenDeleteDialog(false);
        setDeleteCompany(null);
      } catch {
        // Error manejado por el mutation
      }
    }
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#06b6d4",
      "#64748b",
    ];
    return colors[name.charCodeAt(0) % colors.length] || "#64748b";
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            // @ts-expect-error - MUI v7 Grid type incompatibility
            <Grid xs={12} sm={6} md={4} key={i}>
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
          Error al cargar empresas:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Companies
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión de empresas clientes (Multi-tenant) •{" "}
          {filteredCompanies.length}{" "}
          {filteredCompanies.length === 1 ? "company" : "companies"}
        </Typography>
      </Box>

      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          bgcolor: "white",
          p: 2.5,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
        }}
      >
        <TextField
          placeholder="Buscar por nombre o CUIT..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNew}
          disabled={createMutation.isPending}
          sx={{
            bgcolor: "#1E2C56",
            fontWeight: 600,
            "&:hover": { bgcolor: "#16213E" },
          }}
        >
          New Company
        </Button>
      </Box>

      {/* Grid de Companies */}
      <Grid container spacing={3}>
        {filteredCompanies.map((company) => (
          // @ts-expect-error - MUI v7 Grid type incompatibility
          <Grid xs={12} sm={6} md={4} key={company.id}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                height: "100%",
                transition: "all 0.3s",
                opacity: company.isActive !== false ? 1 : 0.7,
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: getAvatarColor(company.name),
                      fontSize: 20,
                      fontWeight: 700,
                      mr: 2,
                    }}
                  >
                    <BusinessIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5 }}>
                      {company.name}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Chip
                        label={
                          company.isActive !== false ? "Active" : "Inactive"
                        }
                        size="small"
                        sx={{
                          bgcolor:
                            company.isActive !== false
                              ? "#10b98115"
                              : "#99999915",
                          color:
                            company.isActive !== false ? "#10b981" : "#999",
                          fontWeight: 600,
                          height: 20,
                          fontSize: 11,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {company.detail && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.3 }}
                    >
                      Detalle
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {company.detail}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(company)}
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
                    onClick={() => handleDeleteClick(company)}
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
        ))}
      </Grid>

      {filteredCompanies.length === 0 && !isLoading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <BusinessIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay empresas registradas
          </Typography>
        </Box>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCompany ? "Editar Empresa" : "Nueva Empresa"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Empresa"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Detalle (opcional)"
                value={formData.detail || ""}
                onChange={(e) =>
                  setFormData({ ...formData, detail: e.target.value })
                }
                multiline
                rows={3}
                helperText="Información adicional sobre la empresa"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : editingCompany
              ? "Guardar Cambios"
              : "Crear Empresa"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de desactivar la empresa{" "}
            <strong>{deleteCompany?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            La empresa será desactivada pero no eliminada permanentemente.
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
