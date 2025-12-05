import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import * as XLSX from "xlsx";
import { useTenantStore } from "@/stores/tenant.store";

// Tipos
interface EventoExtended {
  id: number;
  vehiculoId: number;
  vehiculoPatente: string;
  choferId: number;
  choferNombre: string;
  surtidorId: number;
  surtidorNombre: string;
  litros: number;
  precio: number;
  total: number;
  fecha: string;
  estado: "Pendiente" | "Validado" | "Rechazado";
  observaciones?: string;
  ubicacion?: string;
  activo: boolean;
  empresaId: number;
  empresaNombre?: string;
}

interface EventoFormData {
  vehiculoId: number | "";
  choferId: number | "";
  surtidorId: number | "";
  litros: number | "";
  precio: number | "";
  total: number | "";
  fecha: string;
  estado: "Pendiente" | "Validado" | "Rechazado";
  observaciones: string;
  ubicacion?: string;
  activo: boolean;
}

interface FormErrors {
  [key: string]: string;
}

// Mock data temporal
const mockEventos: EventoExtended[] = [
  {
    id: 1,
    vehiculoId: 1,
    vehiculoPatente: "ABC123",
    choferId: 1,
    choferNombre: "Juan Pérez",
    surtidorId: 1,
    surtidorNombre: "Surtidor Centro",
    litros: 50,
    precio: 850,
    total: 42500,
    fecha: "2024-12-01",
    estado: "Validado",
    observaciones: "Carga completa",
    ubicacion: "Córdoba Capital",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
  {
    id: 2,
    vehiculoId: 2,
    vehiculoPatente: "XYZ789",
    choferId: 2,
    choferNombre: "María González",
    surtidorId: 2,
    surtidorNombre: "Surtidor Norte",
    litros: 75,
    precio: 845,
    total: 63375,
    fecha: "2024-12-02",
    estado: "Pendiente",
    observaciones: "",
    ubicacion: "Zona Norte",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
  {
    id: 3,
    vehiculoId: 3,
    vehiculoPatente: "AAA111",
    choferId: 3,
    choferNombre: "Carlos López",
    surtidorId: 1,
    surtidorNombre: "Surtidor Centro",
    litros: 40,
    precio: 850,
    total: 34000,
    fecha: "2024-12-03",
    estado: "Rechazado",
    observaciones: "Factura incorrecta",
    ubicacion: "Córdoba Capital",
    activo: true,
    empresaId: 2,
    empresaNombre: "Empresa B",
  },
  {
    id: 4,
    vehiculoId: 1,
    vehiculoPatente: "ABC123",
    choferId: 1,
    choferNombre: "Juan Pérez",
    surtidorId: 2,
    surtidorNombre: "Surtidor Norte",
    litros: 60,
    precio: 845,
    total: 50700,
    fecha: "2024-12-04",
    estado: "Validado",
    observaciones: "Todo ok",
    ubicacion: "Zona Norte",
    activo: true,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
];

const mockVehiculos = [
  { id: 1, patente: "ABC123", marca: "Ford", modelo: "Ranger" },
  { id: 2, patente: "XYZ789", marca: "Toyota", modelo: "Hilux" },
  { id: 3, patente: "AAA111", marca: "Chevrolet", modelo: "S10" },
];

const mockChoferes = [
  { id: 1, nombre: "Juan", apellido: "Pérez" },
  { id: 2, nombre: "María", apellido: "González" },
  { id: 3, nombre: "Carlos", apellido: "López" },
];

const mockSurtidores = [
  { id: 1, nombre: "Surtidor Centro", ubicacion: "Córdoba Capital" },
  { id: 2, nombre: "Surtidor Norte", ubicacion: "Zona Norte" },
  { id: 3, nombre: "Surtidor Sur", ubicacion: "Zona Sur" },
];

const getEstadoColor = (estado: string) => {
  const colors = {
    Validado: "#10b981",
    Pendiente: "#f59e0b",
    Rechazado: "#ef4444",
  };
  return colors[estado as keyof typeof colors] || "#999";
};

export default function EventosPage() {
  const { user, tenantConfig } = useTenantStore();
  const tenantName = tenantConfig?.name;
  const [eventos, setEventos] = useState<EventoExtended[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [editingEvento, setEditingEvento] = useState<EventoExtended | null>(
    null
  );
  const [deleteEvento, setDeleteEvento] = useState<EventoExtended | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [formData, setFormData] = useState<EventoFormData>({
    vehiculoId: "",
    choferId: "",
    surtidorId: "",
    litros: "",
    precio: "",
    total: "",
    fecha: new Date().toISOString().split("T")[0],
    estado: "Pendiente",
    observaciones: "",
    ubicacion: "",
    activo: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // ✅ TODOS los hooks ANTES del early return
  useEffect(() => {
    const loadEventos = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setEventos(mockEventos);
      } catch (error) {
        console.error("Error loading eventos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadEventos();
  }, []);

  // ✅ Calcular automáticamente el total cuando cambien litros o precio
  useEffect(() => {
    if (formData.litros && formData.precio) {
      const calculatedTotal =
        (formData.litros as number) * (formData.precio as number);
      setFormData((prev) => ({ ...prev, total: calculatedTotal }));
    }
  }, [formData.litros, formData.precio]);

  // ✅ Early return DESPUÉS de todos los hooks
  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando eventos...</Typography>
      </Box>
    );
  }

  const filteredEventos = eventos.filter((e) => {
    const vehiculoPatente = e.vehiculoPatente?.toLowerCase() || "";
    const choferNombre = e.choferNombre?.toLowerCase() || "";
    const observaciones = e.observaciones?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return (
      vehiculoPatente.includes(term) ||
      choferNombre.includes(term) ||
      observaciones.includes(term)
    );
  });

  const handleNew = () => {
    setEditingEvento(null);
    setFormData({
      vehiculoId: "",
      choferId: "",
      surtidorId: "",
      litros: "",
      precio: "",
      total: "",
      fecha: new Date().toISOString().split("T")[0],
      estado: "Pendiente",
      observaciones: "",
      ubicacion: "",
      activo: true,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (evento: EventoExtended) => {
    setEditingEvento(evento);
    setFormData({
      vehiculoId: evento.vehiculoId,
      choferId: evento.choferId,
      surtidorId: evento.surtidorId,
      litros: evento.litros,
      precio: evento.precio,
      total: evento.total,
      fecha: evento.fecha,
      estado: evento.estado,
      observaciones: evento.observaciones || "",
      ubicacion: evento.ubicacion || "",
      activo: evento.activo,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (evento: EventoExtended) => {
    setDeleteEvento(evento);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.vehiculoId) newErrors.vehiculoId = "Seleccione un vehículo";
    if (!formData.choferId) newErrors.choferId = "Seleccione un chofer";
    if (!formData.surtidorId) newErrors.surtidorId = "Seleccione un surtidor";
    if (!formData.litros || formData.litros <= 0)
      newErrors.litros = "Litros inválidos";
    if (!formData.precio || formData.precio <= 0)
      newErrors.precio = "Precio inválido";
    if (!formData.fecha) newErrors.fecha = "Fecha obligatoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const calculatedTotal =
      (formData.litros as number) * (formData.precio as number);

    try {
      if (editingEvento) {
        setEventos(
          eventos.map((e) =>
            e.id === editingEvento.id
              ? {
                  ...editingEvento,
                  ...formData,
                  vehiculoId: formData.vehiculoId as number,
                  choferId: formData.choferId as number,
                  surtidorId: formData.surtidorId as number,
                  litros: formData.litros as number,
                  precio: formData.precio as number,
                  total: calculatedTotal,
                  vehiculoPatente:
                    mockVehiculos.find((v) => v.id === formData.vehiculoId)
                      ?.patente || "",
                  choferNombre: (() => {
                    const chofer = mockChoferes.find(
                      (c) => c.id === formData.choferId
                    );
                    return chofer ? `${chofer.nombre} ${chofer.apellido}` : "";
                  })(),
                  surtidorNombre:
                    mockSurtidores.find((s) => s.id === formData.surtidorId)
                      ?.nombre || "",
                }
              : e
          )
        );
      } else {
        const chofer = mockChoferes.find((c) => c.id === formData.choferId);
        const newEvento: EventoExtended = {
          id: Math.max(...eventos.map((e) => e.id), 0) + 1,
          vehiculoId: formData.vehiculoId as number,
          vehiculoPatente:
            mockVehiculos.find((v) => v.id === formData.vehiculoId)?.patente ||
            "",
          choferId: formData.choferId as number,
          choferNombre: chofer ? `${chofer.nombre} ${chofer.apellido}` : "",
          surtidorId: formData.surtidorId as number,
          surtidorNombre:
            mockSurtidores.find((s) => s.id === formData.surtidorId)?.nombre ||
            "",
          litros: formData.litros as number,
          precio: formData.precio as number,
          total: calculatedTotal,
          fecha: formData.fecha,
          estado: formData.estado,
          observaciones: formData.observaciones,
          ubicacion: formData.ubicacion,
          activo: formData.activo,
          empresaId: 1,
          empresaNombre: tenantName,
        };
        setEventos([...eventos, newEvento]);
      }
      setOpenDialog(false);
    } catch (error) {
      console.error("Error saving evento:", error);
    }
  };

  const handleDelete = () => {
    if (deleteEvento) {
      setEventos(eventos.filter((e) => e.id !== deleteEvento.id));
    }
    setOpenDeleteDialog(false);
    setDeleteEvento(null);
  };

  const handleExport = (): void => {
    const dataToExport = filteredEventos.map((e) => ({
      Vehículo: e.vehiculoPatente,
      Chofer: e.choferNombre,
      Surtidor: e.surtidorNombre,
      Litros: e.litros,
      Precio: e.precio,
      Total: e.total,
      Fecha: e.fecha,
      Estado: e.estado,
      Observaciones: e.observaciones || "",
      ...(user?.role === "admin" && { Empresa: e.empresaNombre }),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eventos");
    XLSX.writeFile(
      wb,
      `Eventos_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  return (
    <Box sx={{ p: 3, mt: -3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          Gestión de Eventos • {filteredEventos.length}{" "}
          {filteredEventos.length === 1 ? "evento" : "eventos"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={filteredEventos.length === 0}
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
            Nuevo Evento
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
          placeholder="Buscar por vehículo, chofer u observaciones..."
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

      {/* Tabla */}
      <TableContainer
        component={Paper}
        sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f9fafb" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Chofer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Surtidor</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Litros
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Precio
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Total
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              {user?.role === "admin" && (
                <TableCell sx={{ fontWeight: 700 }}>Empresa</TableCell>
              )}
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEventos.map((evento) => (
              <TableRow key={evento.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>
                  {evento.vehiculoPatente}
                </TableCell>
                <TableCell>{evento.choferNombre}</TableCell>
                <TableCell>{evento.surtidorNombre}</TableCell>
                <TableCell align="right">{evento.litros} L</TableCell>
                <TableCell align="right">
                  ${evento.precio.toLocaleString()}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ${evento.total.toLocaleString()}
                </TableCell>
                <TableCell>
                  {new Date(evento.fecha).toLocaleDateString("es-AR")}
                </TableCell>
                <TableCell>
                  <Chip
                    label={evento.estado}
                    size="small"
                    sx={{
                      bgcolor: `${getEstadoColor(evento.estado)}15`,
                      color: getEstadoColor(evento.estado),
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                {user?.role === "admin" && (
                  <TableCell>{evento.empresaNombre}</TableCell>
                )}
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(evento)}
                    sx={{
                      bgcolor: "#f3f4f6",
                      "&:hover": { bgcolor: "#e5e7eb" },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(evento)}
                    sx={{
                      bgcolor: "#fee2e2",
                      color: "#dc2626",
                      "&:hover": { bgcolor: "#fecaca" },
                      ml: 0.5,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredEventos.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <LocalGasStationIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay eventos registrados
          </Typography>
        </Box>
      )}

      {/* Diálogo crear/editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEvento ? "Editar Evento" : "Nuevo Evento"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              select
              label="Vehículo"
              value={formData.vehiculoId}
              onChange={(e) =>
                setFormData({ ...formData, vehiculoId: Number(e.target.value) })
              }
              error={!!errors.vehiculoId}
              helperText={errors.vehiculoId}
              required
              fullWidth
            >
              <MenuItem value="">Seleccione...</MenuItem>
              {mockVehiculos.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.patente} - {v.marca} {v.modelo}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Chofer"
              value={formData.choferId}
              onChange={(e) =>
                setFormData({ ...formData, choferId: Number(e.target.value) })
              }
              error={!!errors.choferId}
              helperText={errors.choferId}
              required
              fullWidth
            >
              <MenuItem value="">Seleccione...</MenuItem>
              {mockChoferes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Surtidor"
              value={formData.surtidorId}
              onChange={(e) =>
                setFormData({ ...formData, surtidorId: Number(e.target.value) })
              }
              error={!!errors.surtidorId}
              helperText={errors.surtidorId}
              required
              fullWidth
            >
              <MenuItem value="">Seleccione...</MenuItem>
              {mockSurtidores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nombre} ({s.ubicacion})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Litros"
              type="number"
              value={formData.litros}
              onChange={(e) =>
                setFormData({ ...formData, litros: Number(e.target.value) })
              }
              error={!!errors.litros}
              helperText={errors.litros}
              required
              fullWidth
            />

            <TextField
              label="Precio Unitario"
              type="number"
              value={formData.precio}
              onChange={(e) =>
                setFormData({ ...formData, precio: Number(e.target.value) })
              }
              error={!!errors.precio}
              helperText={errors.precio}
              required
              fullWidth
            />

            <TextField
              label="Total"
              type="number"
              value={formData.total}
              disabled
              fullWidth
              helperText="Calculado automáticamente"
            />

            <TextField
              label="Fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) =>
                setFormData({ ...formData, fecha: e.target.value })
              }
              error={!!errors.fecha}
              helperText={errors.fecha}
              required
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              select
              label="Estado"
              value={formData.estado}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estado: e.target.value as
                    | "Pendiente"
                    | "Validado"
                    | "Rechazado",
                })
              }
              fullWidth
            >
              <MenuItem value="Pendiente">Pendiente</MenuItem>
              <MenuItem value="Validado">Validado</MenuItem>
              <MenuItem value="Rechazado">Rechazado</MenuItem>
            </TextField>

            <TextField
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingEvento ? "Guardar cambios" : "Crear Evento"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo eliminar */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar el evento del vehículo{" "}
            <strong>{deleteEvento?.vehiculoPatente}</strong>?
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
