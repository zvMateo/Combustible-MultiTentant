// components/pages/_S/Empresas/EmpresasPage.tsx
import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Typography,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type TipoMercado = "Transporte" | "Agro" | "Construcción" | "Minería" | "Logística" | "Otro";

interface Empresa {
  id: number;
  nombre: string;
  cuit?: string;
  tipoMercado: TipoMercado;
  activo: boolean;
}

interface EmpresaFormData {
  nombre: string;
  cuit: string;
  tipoMercado: TipoMercado;
  activo: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const TIPOS_MERCADO: TipoMercado[] = [
  "Transporte",
  "Agro",
  "Construcción",
  "Minería",
  "Logística",
  "Otro",
];

// Mock data
const mockEmpresas: Empresa[] = [
  {
    id: 1,
    nombre: "Empresa A",
    cuit: "30-12345678-9",
    tipoMercado: "Transporte",
    activo: true,
  },
  {
    id: 2,
    nombre: "Empresa B",
    cuit: "30-98765432-1",
    tipoMercado: "Agro",
    activo: true,
  },
];

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>(mockEmpresas);
  const [loading] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [deleteEmpresa, setDeleteEmpresa] = useState<Empresa | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [formData, setFormData] = useState<EmpresaFormData>({
    nombre: "",
    cuit: "",
    tipoMercado: "Transporte",
    activo: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const filteredEmpresas = empresas.filter((e) => {
    return (
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.cuit && e.cuit.includes(searchTerm))
    );
  });

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  const handleNew = (): void => {
    setEditingEmpresa(null);
    setFormData({
      nombre: "",
      cuit: "",
      tipoMercado: "Transporte",
      activo: true,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (empresa: Empresa): void => {
    setEditingEmpresa(empresa);
    setFormData({
      nombre: empresa.nombre,
      cuit: empresa.cuit || "",
      tipoMercado: empresa.tipoMercado,
      activo: empresa.activo,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.cuit.trim()) {
      newErrors.cuit = "El CUIT es obligatorio";
    } else if (!/^\d{2}-\d{8}-\d{1}$/.test(formData.cuit)) {
      newErrors.cuit = "Formato inválido (ej: 30-12345678-9)";
    }
    if (!formData.tipoMercado)
      newErrors.tipoMercado = "El tipo de mercado es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (): void => {
    if (!validate()) return;

    if (editingEmpresa) {
      setEmpresas(
        empresas.map((e) =>
          e.id === editingEmpresa.id
            ? { ...editingEmpresa, ...formData, id: e.id }
            : e
        )
      );
    } else {
      const newEmpresa: Empresa = {
        ...formData,
        id: Math.max(...empresas.map((e) => e.id), 0) + 1,
      };
      setEmpresas([...empresas, newEmpresa]);
    }

    setOpenDialog(false);
  };

  const handleDeleteClick = (empresa: Empresa): void => {
    setDeleteEmpresa(empresa);
    setOpenDeleteDialog(true);
  };

  const handleDelete = (): void => {
    if (deleteEmpresa) {
      setEmpresas(empresas.filter((e) => e.id !== deleteEmpresa.id));
    }
    setOpenDeleteDialog(false);
    setDeleteEmpresa(null);
  };

  const getAvatarColor = (tipo: TipoMercado): string => {
    const colors: Record<TipoMercado, string> = {
      Transporte: "#3b82f6",
      Agro: "#10b981",
      Construcción: "#f59e0b",
      Minería: "#8b5cf6",
      Logística: "#06b6d4",
      Otro: "#64748b",
    };
    return colors[tipo] || colors.Otro;
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Empresas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión de empresas clientes (Multi-tenant) • {filteredEmpresas.length}{" "}
          {filteredEmpresas.length === 1 ? "empresa" : "empresas"}
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
          sx={{
            bgcolor: "#1E2C56",
            fontWeight: 600,
            "&:hover": { bgcolor: "#16213E" },
          }}
        >
          Nueva Empresa
        </Button>
      </Box>

      {/* Grid de Empresas */}
      <Grid container spacing={3}>
        {filteredEmpresas.map((empresa) => (
          <Grid item xs={12} sm={6} md={4} key={empresa.id}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                height: "100%",
                transition: "all 0.3s",
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
                      bgcolor: getAvatarColor(empresa.tipoMercado),
                      fontSize: 20,
                      fontWeight: 700,
                      mr: 2,
                    }}
                  >
                    <BusinessIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5 }}>
                      {empresa.nombre}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Chip
                        label={empresa.tipoMercado}
                        size="small"
                        sx={{
                          bgcolor: `${getAvatarColor(empresa.tipoMercado)}15`,
                          color: getAvatarColor(empresa.tipoMercado),
                          fontWeight: 600,
                          height: 20,
                          fontSize: 11,
                        }}
                      />
                      <Chip
                        label={empresa.activo ? "Activo" : "Inactivo"}
                        size="small"
                        sx={{
                          bgcolor: empresa.activo ? "#10b98115" : "#99999915",
                          color: empresa.activo ? "#10b981" : "#999",
                          fontWeight: 600,
                          height: 20,
                          fontSize: 11,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.3 }}
                  >
                    CUIT
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {empresa.cuit || "Sin CUIT"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(empresa)}
                    sx={{
                      bgcolor: "#f3f4f6",
                      "&:hover": { bgcolor: "#e5e7eb" },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(empresa)}
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

      {filteredEmpresas.length === 0 && (
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
          {editingEmpresa ? "Editar Empresa" : "Nueva Empresa"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Empresa"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                error={!!errors.nombre}
                helperText={errors.nombre}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CUIT"
                placeholder="30-12345678-9"
                value={formData.cuit}
                onChange={(e) =>
                  setFormData({ ...formData, cuit: e.target.value })
                }
                error={!!errors.cuit}
                helperText={errors.cuit}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Tipo de Mercado"
                value={formData.tipoMercado}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipoMercado: e.target.value as TipoMercado,
                  })
                }
                error={!!errors.tipoMercado}
                helperText={
                  errors.tipoMercado ||
                  "Define el tipo de operación de la empresa"
                }
                required
              >
                {TIPOS_MERCADO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingEmpresa ? "Guardar Cambios" : "Crear Empresa"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar la empresa{" "}
            <strong>{deleteEmpresa?.nombre}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
