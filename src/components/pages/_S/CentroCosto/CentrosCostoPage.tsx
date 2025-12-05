// components/pages/_S/CentroCosto/CentroCostoPage.tsx
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
  FormControlLabel,
  Switch,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useTenantStore } from "@/stores/tenant.store";
import * as XLSX from "xlsx";

type TipoCentroCosto = "Lote" | "Obra" | "Area" | "Proyecto" | "Otro";

interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoCentroCosto;
  activo: boolean;
  empresaId: number;
  empresaNombre?: string;
}

interface FormErrors {
  [key: string]: string;
}

const TIPOS_CENTRO_COSTO: TipoCentroCosto[] = [
  "Lote",
  "Obra",
  "Area",
  "Proyecto",
  "Otro",
];

interface FormData {
  codigo: string;
  nombre: string;
  tipo: TipoCentroCosto;
  activo: boolean;
}

// Mock data temporal (más completo)
const mockCentrosCosto: CentroCosto[] = [
  {
    id: 1,
    codigo: "LOTE-001",
    nombre: "Lote Norte",
    tipo: "Lote",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
  {
    id: 2,
    codigo: "OBRA-001",
    nombre: "Construcción Edificio Centro",
    tipo: "Obra",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
  {
    id: 3,
    codigo: "AREA-ADM",
    nombre: "Área Administrativa",
    tipo: "Area",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
  {
    id: 4,
    codigo: "PROY-CRM",
    nombre: "Proyecto Implementación CRM",
    tipo: "Proyecto",
    activo: false,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
  {
    id: 5,
    codigo: "LOTE-002",
    nombre: "Lote Sur",
    tipo: "Lote",
    activo: true,
    empresaId: 2,
    empresaNombre: "Empresa B",
  },
  {
    id: 6,
    codigo: "OBRA-RET01",
    nombre: "Refacción Oficinas Planta 1",
    tipo: "Obra",
    activo: false,
    empresaId: 2,
    empresaNombre: "Empresa B",
  },
  {
    id: 7,
    codigo: "AREA-TI",
    nombre: "Área Tecnología / IT",
    tipo: "Area",
    activo: true,
    empresaId: 2,
    empresaNombre: "Empresa B",
  },
  {
    id: 8,
    codigo: "PROY-DATA",
    nombre: "Proyecto Data Warehouse",
    tipo: "Proyecto",
    activo: true,
    empresaId: 3,
    empresaNombre: "Empresa C",
  },
  {
    id: 9,
    codigo: "OTRO-MKT",
    nombre: "Centro de Marketing General",
    tipo: "Otro",
    activo: true,
    empresaId: 3,
    empresaNombre: "Empresa C",
  },
];

const tipoColorMap: Record<TipoCentroCosto, string> = {
  Lote: "#10b981",
  Obra: "#3b82f6",
  Area: "#f59e0b",
  Proyecto: "#8b5cf6",
  Otro: "#64748b",
};

const getTipoColor = (tipo: TipoCentroCosto): string =>
  tipoColorMap[tipo] || tipoColorMap.Otro;

export default function CentroCostoPage() {
  const { user, tenantConfig } = useTenantStore();
  const tenantName = tenantConfig?.name;
  const [items, setItems] = useState<CentroCosto[]>(mockCentrosCosto);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<CentroCosto | null>(null);
  const [deleteItem, setDeleteItem] = useState<CentroCosto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<FormData>({
    codigo: "",
    nombre: "",
    tipo: "Lote",
    activo: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Mientras maqueteás, no filtramos por tenant
  const itemsPorEmpresa = items;

  const filteredItems = itemsPorEmpresa.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.nombre.toLowerCase().includes(term) ||
      item.codigo.toLowerCase().includes(term)
    );
  });

  const handleExport = (): void => {
    const dataToExport = filteredItems.map((item) => ({
      Código: item.codigo,
      Nombre: item.nombre,
      Tipo: item.tipo,
      Estado: item.activo ? "Activo" : "Inactivo",
      ...(user?.role === "admin" && { Empresa: item.empresaNombre }),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CentrosCosto");
    XLSX.writeFile(
      wb,
      `CentrosCosto_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleNew = (): void => {
    setEditingItem(null);
    setFormData({
      codigo: "",
      nombre: "",
      tipo: "Lote",
      activo: true,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (item: CentroCosto): void => {
    setEditingItem(item);
    setFormData({
      codigo: item.codigo,
      nombre: item.nombre,
      tipo: item.tipo,
      activo: item.activo,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.codigo.trim()) newErrors.codigo = "El código es obligatorio";
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.tipo) newErrors.tipo = "El tipo es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (): void => {
    if (!validate()) return;

    if (editingItem) {
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? {
                ...editingItem,
                ...formData,
              }
            : item
        )
      );
    } else {
      const newItem: CentroCosto = {
        id: Math.max(...items.map((i) => i.id), 0) + 1,
        ...formData,
        empresaId: 1, // mock fijo
        empresaNombre: tenantName,
      };
      setItems([...items, newItem]);
    }

    setOpenDialog(false);
  };

  const handleDeleteClick = (item: CentroCosto): void => {
    setDeleteItem(item);
    setOpenDeleteDialog(true);
  };

  const handleDelete = (): void => {
    if (deleteItem) {
      setItems(items.filter((item) => item.id !== deleteItem.id));
    }
    setOpenDeleteDialog(false);
    setDeleteItem(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header alineado a Usuarios */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: -3,
          mb: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
              mb: 0.5,
            }}
          >
            Gestión de lotes, obras, áreas y proyectos • {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "ítem" : "ítems"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={filteredItems.length === 0}
            sx={{
              borderColor: "#10b981",
              color: "#10b981",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { borderColor: "#059669", bgcolor: "#10b98110" },
            }}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
            sx={{
              bgcolor: "#1E2C56",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#16213E" },
            }}
          >
            Nuevo centro
          </Button>
        </Box>
      </Box>

      {/* Filtros en card compacta */}
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
          placeholder="Buscar por código o nombre..."
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

      {/* Grid de Items */}
      <Grid container spacing={3}>
        {filteredItems.map((item) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={item.id}
            sx={{ display: "flex" }}
          >
            <Card
              elevation={0}
              sx={{
                background: "white",
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                height: "100%",
                width: 500,
                maxWidth: "100%",
                transition: "all 0.25s ease",
                "&:hover": {
                  boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                  transform: "translateY(-3px)",
                  borderColor: "#cbd5f5",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Header + info principal */}
                <Box sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      mb: 2.5,
                      gap: 1.5,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: getTipoColor(item.tipo),
                        color: "white",
                      }}
                    >
                      <AccountTreeIcon />
                    </Avatar>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          mb: 0.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.codigo}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748b",
                          mb: 0.75,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.nombre}
                      </Typography>
                      <Box
                        sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}
                      >
                        <Chip
                          label={item.tipo}
                          size="small"
                          sx={{
                            bgcolor: `${getTipoColor(item.tipo)}15`,
                            color: getTipoColor(item.tipo),
                            fontWeight: 600,
                            height: 22,
                            fontSize: 11,
                          }}
                        />
                        <Chip
                          label={item.activo ? "Activo" : "Inactivo"}
                          size="small"
                          sx={{
                            bgcolor: item.activo ? "#10b98115" : "#e5e7eb",
                            color: item.activo ? "#10b981" : "#6b7280",
                            fontWeight: 600,
                            height: 22,
                            fontSize: 11,
                          }}
                        />
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        ml: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(item)}
                        sx={{
                          bgcolor: "#eef2ff",
                          color: "#1d4ed8",
                          "&:hover": { bgcolor: "#e0e7ff" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(item)}
                        sx={{
                          bgcolor: "#fee2e2",
                          color: "#dc2626",
                          "&:hover": { bgcolor: "#fecaca" },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Footer: empresa solo para admin */}
                {user?.role === "admin" && (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.3 }}
                    >
                      Empresa
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {item.empresaNombre || "N/A"}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredItems.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <AccountTreeIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay centros de costo registrados
          </Typography>
        </Box>
      )}

      {/* Dialog crear / editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? "Editar centro de costo" : "Nuevo centro de costo"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Código"
              value={formData.codigo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  codigo: e.target.value.toUpperCase(),
                })
              }
              error={!!errors.codigo}
              helperText={errors.codigo}
              required
            />

            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              error={!!errors.nombre}
              helperText={errors.nombre}
              required
            />

            <TextField
              fullWidth
              select
              label="Tipo"
              value={formData.tipo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tipo: e.target.value as TipoCentroCosto,
                })
              }
              error={!!errors.tipo}
              helperText={errors.tipo}
              required
            >
              {TIPOS_CENTRO_COSTO.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                />
              }
              label="Activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingItem ? "Guardar cambios" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog eliminar */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar el centro de costo{" "}
            <strong>
              {deleteItem?.codigo} - {deleteItem?.nombre}
            </strong>
            ?
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
