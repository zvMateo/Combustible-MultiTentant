// components/pages/_S/Configuracion/ConfiguracionPage.tsx
import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  Alert,
  Grid,
  TextField,
  Button,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import PolicyIcon from "@mui/icons-material/Policy";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PaletteIcon from "@mui/icons-material/Palette";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MicIcon from "@mui/icons-material/Mic";
import ReceiptIcon from "@mui/icons-material/Receipt";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import WarningIcon from "@mui/icons-material/Warning";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/theme/use-theme";
import { useTenantStore } from "@/stores/tenant.store";

// ==================== PERSONALIZACIÓN ====================
function PersonalizacionTab() {
  const { tenantTheme, updateTenantTheme } = useTheme();
  const [localConfig, setLocalConfig] = useState(
    tenantTheme || {
      primaryColor: "#1E2C56",
      secondaryColor: "#3b82f6",
      sidebarBg: "#1E2C56",
      sidebarText: "#ffffff",
      accentColor: "#10b981",
    }
  );
  const [saved, setSaved] = useState(false);

  const handleColorChange = (key: keyof typeof localConfig, value: string) => {
    setLocalConfig({ ...localConfig, [key]: value });
  };

  const handleSave = () => {
    if (updateTenantTheme) {
      updateTenantTheme(localConfig);
      setSaved(true);
      toast.success("Tema guardado correctamente");
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleReset = () => {
    if (tenantTheme) {
      setLocalConfig(tenantTheme);
    }
  };

  const presets = [
    {
      name: "Azul Corporativo",
      colors: {
        primaryColor: "#1E2C56",
        secondaryColor: "#3b82f6",
        sidebarBg: "#1E2C56",
        sidebarText: "#ffffff",
        accentColor: "#10b981",
      },
    },
    {
      name: "Verde Naturaleza",
      colors: {
        primaryColor: "#10b981",
        secondaryColor: "#059669",
        sidebarBg: "#064e3b",
        sidebarText: "#d1fae5",
        accentColor: "#f59e0b",
      },
    },
    {
      name: "Rojo Energía",
      colors: {
        primaryColor: "#ef4444",
        secondaryColor: "#dc2626",
        sidebarBg: "#7f1d1d",
        sidebarText: "#fee2e2",
        accentColor: "#f59e0b",
      },
    },
    {
      name: "Púrpura Moderno",
      colors: {
        primaryColor: "#8b5cf6",
        secondaryColor: "#7c3aed",
        sidebarBg: "#5b21b6",
        sidebarText: "#ede9fe",
        accentColor: "#10b981",
      },
    },
  ];

  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          🎨 Personalización del Tema
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure los colores y estilo de su empresa. Los cambios se aplicarán inmediatamente.
        </Typography>

        {saved && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Tema guardado exitosamente
          </Alert>
        )}

        {/* Presets */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Temas Predefinidos
          </Typography>
          <Grid container spacing={2}>
            {presets.map((preset) => (
              <Grid item xs={6} sm={3} key={preset.name}>
                <Box
                  onClick={() => setLocalConfig(preset.colors)}
                  sx={{
                    p: 2,
                    border: "2px solid #e2e8f0",
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: preset.colors.primaryColor,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: preset.colors.primaryColor, borderRadius: 1 }} />
                    <Box sx={{ width: 20, height: 20, bgcolor: preset.colors.secondaryColor, borderRadius: 1 }} />
                    <Box sx={{ width: 20, height: 20, bgcolor: preset.colors.accentColor, borderRadius: 1 }} />
                  </Box>
                  <Typography variant="caption" fontWeight={600}>
                    {preset.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Color Primario
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                type="color"
                value={localConfig.primaryColor}
                onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                sx={{ width: 80 }}
              />
              <TextField
                value={localConfig.primaryColor}
                onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Color Secundario
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                type="color"
                value={localConfig.secondaryColor}
                onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                sx={{ width: 80 }}
              />
              <TextField
                value={localConfig.secondaryColor}
                onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Fondo del Sidebar
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                type="color"
                value={localConfig.sidebarBg}
                onChange={(e) => handleColorChange("sidebarBg", e.target.value)}
                sx={{ width: 80 }}
              />
              <TextField
                value={localConfig.sidebarBg}
                onChange={(e) => handleColorChange("sidebarBg", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Color de Acento
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                type="color"
                value={localConfig.accentColor}
                onChange={(e) => handleColorChange("accentColor", e.target.value)}
                sx={{ width: 80 }}
              />
              <TextField
                value={localConfig.accentColor}
                onChange={(e) => handleColorChange("accentColor", e.target.value)}
                fullWidth
                size="small"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Preview */}
        <Box sx={{ mt: 4, p: 3, border: "2px solid #e2e8f0", borderRadius: 2, bgcolor: "#f9fafb" }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            Vista Previa
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Button
                variant="contained"
                fullWidth
                size="small"
                sx={{ bgcolor: localConfig.primaryColor }}
              >
                Primario
              </Button>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  height: 36,
                  bgcolor: localConfig.sidebarBg,
                  color: localConfig.sidebarText,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1,
                  fontSize: "0.875rem",
                }}
              >
                Sidebar
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  height: 36,
                  bgcolor: localConfig.accentColor,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1,
                  fontSize: "0.875rem",
                }}
              >
                Acento
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                sx={{ borderColor: localConfig.secondaryColor, color: localConfig.secondaryColor }}
              >
                Secundario
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={handleReset}>
            Restablecer
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            sx={{ bgcolor: localConfig.primaryColor }}
          >
            Guardar Cambios
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ==================== POLÍTICAS DE EVIDENCIAS ====================
function PoliticasTab() {
  const { tenantConfig } = useTenantStore();
  const [policies, setPolicies] = useState({
    requiredPhotos: tenantConfig?.policies?.requiredPhotos ?? true,
    requiredLocation: tenantConfig?.policies?.requiredLocation ?? true,
    requiredAudio: false,
    requiredTicket: false,
    minPhotos: 1,
    maxPhotos: 5,
    locationRadius: 500, // metros
    allowManualEntry: true,
    requireValidation: true,
    validationDeadline: 24, // horas
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof policies) => {
    setPolicies({ ...policies, [key]: !policies[key] });
  };

  const handleChange = (key: keyof typeof policies, value: number) => {
    setPolicies({ ...policies, [key]: value });
  };

  const handleSave = () => {
    // TODO: Guardar en backend/store cuando esté disponible
    setSaved(true);
    toast.success("Políticas guardadas correctamente");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          📋 Políticas de Evidencias
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure qué evidencias son obligatorias para las cargas de combustible
        </Typography>

        {saved && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Políticas guardadas exitosamente
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Evidencias Obligatorias */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Evidencias Obligatorias
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <PhotoCameraIcon sx={{ color: policies.requiredPhotos ? "#10b981" : "#9ca3af" }} />
                    <Box>
                      <Typography fontWeight={600}>Fotografías</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Fotos del surtidor, cuenta-litros y odómetro
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={policies.requiredPhotos}
                    onChange={() => handleToggle("requiredPhotos")}
                    color="success"
                  />
                </Box>
                {policies.requiredPhotos && (
                  <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                    <TextField
                      label="Mínimo"
                      type="number"
                      size="small"
                      value={policies.minPhotos}
                      onChange={(e) => handleChange("minPhotos", parseInt(e.target.value) || 1)}
                      sx={{ width: 100 }}
                      InputProps={{ inputProps: { min: 1, max: 10 } }}
                    />
                    <TextField
                      label="Máximo"
                      type="number"
                      size="small"
                      value={policies.maxPhotos}
                      onChange={(e) => handleChange("maxPhotos", parseInt(e.target.value) || 5)}
                      sx={{ width: 100 }}
                      InputProps={{ inputProps: { min: 1, max: 10 } }}
                    />
                  </Box>
                )}
              </Card>

              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <LocationOnIcon sx={{ color: policies.requiredLocation ? "#10b981" : "#9ca3af" }} />
                    <Box>
                      <Typography fontWeight={600}>Geolocalización</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ubicación GPS del evento de carga
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={policies.requiredLocation}
                    onChange={() => handleToggle("requiredLocation")}
                    color="success"
                  />
                </Box>
                {policies.requiredLocation && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label="Radio máximo (metros)"
                      type="number"
                      size="small"
                      value={policies.locationRadius}
                      onChange={(e) => handleChange("locationRadius", parseInt(e.target.value) || 500)}
                      sx={{ width: 180 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">m</InputAdornment>,
                      }}
                      helperText="Distancia máxima al surtidor registrado"
                    />
                  </Box>
                )}
              </Card>

              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <MicIcon sx={{ color: policies.requiredAudio ? "#10b981" : "#9ca3af" }} />
                    <Box>
                      <Typography fontWeight={600}>Audio/Nota de Voz</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Grabación de audio explicativa
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={policies.requiredAudio}
                    onChange={() => handleToggle("requiredAudio")}
                    color="success"
                  />
                </Box>
              </Card>

              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <ReceiptIcon sx={{ color: policies.requiredTicket ? "#10b981" : "#9ca3af" }} />
                    <Box>
                      <Typography fontWeight={600}>Ticket/Comprobante</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Foto del ticket de la estación
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={policies.requiredTicket}
                    onChange={() => handleToggle("requiredTicket")}
                    color="success"
                  />
                </Box>
              </Card>
            </Box>
          </Grid>

          {/* Configuración de Validación */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Validación de Eventos
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policies.requireValidation}
                      onChange={() => handleToggle("requireValidation")}
                      color="success"
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight={600}>Requiere Validación</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Los eventos deben ser validados por un supervisor
                      </Typography>
                    </Box>
                  }
                />
                {policies.requireValidation && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label="Plazo de validación"
                      type="number"
                      size="small"
                      value={policies.validationDeadline}
                      onChange={(e) => handleChange("validationDeadline", parseInt(e.target.value) || 24)}
                      sx={{ width: 180 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">horas</InputAdornment>,
                      }}
                      helperText="Tiempo máximo para validar un evento"
                    />
                  </Box>
                )}
              </Card>

              <Card variant="outlined" sx={{ p: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policies.allowManualEntry}
                      onChange={() => handleToggle("allowManualEntry")}
                      color="success"
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight={600}>Permitir Carga Manual</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permite cargar eventos desde el panel web
                      </Typography>
                    </Box>
                  }
                />
              </Card>

              {/* Resumen */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Resumen de Configuración
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {policies.requiredPhotos && <Chip label={`${policies.minPhotos}-${policies.maxPhotos} fotos`} size="small" />}
                  {policies.requiredLocation && <Chip label="GPS" size="small" />}
                  {policies.requiredAudio && <Chip label="Audio" size="small" />}
                  {policies.requiredTicket && <Chip label="Ticket" size="small" />}
                  {policies.requireValidation && <Chip label={`Validar en ${policies.validationDeadline}h`} size="small" />}
                </Box>
              </Alert>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            Guardar Políticas
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ==================== PRECIOS DE COMBUSTIBLE ====================
function PreciosTab() {
  const [precios, setPrecios] = useState([
    { id: 1, tipo: "Diésel", precio: 850, moneda: "ARS", vigenciaDesde: "2024-12-01", activo: true },
    { id: 2, tipo: "Nafta Super", precio: 920, moneda: "ARS", vigenciaDesde: "2024-12-01", activo: true },
    { id: 3, tipo: "Nafta Premium", precio: 1050, moneda: "ARS", vigenciaDesde: "2024-12-01", activo: true },
    { id: 4, tipo: "GNC", precio: 350, moneda: "ARS", vigenciaDesde: "2024-12-01", activo: false },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const handleEdit = (id: number, currentPrice: number) => {
    setEditingId(id);
    setEditValue(currentPrice);
  };

  const handleSave = (id: number) => {
    setPrecios(precios.map((p) => (p.id === id ? { ...p, precio: editValue, vigenciaDesde: new Date().toISOString().split("T")[0] } : p)));
    setEditingId(null);
    toast.success("Precio actualizado");
  };

  const handleToggle = (id: number) => {
    setPrecios(precios.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)));
  };

  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          ⛽ Precios de Combustible
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure los precios por tipo de combustible para el cálculo de costos
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Los precios se utilizan para calcular el costo total de cada carga. Actualice los precios cuando cambien en sus proveedores.
        </Alert>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f9fafb" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Tipo de Combustible</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Precio por Litro</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vigencia Desde</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {precios.map((precio) => (
                <TableRow key={precio.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocalGasStationIcon sx={{ color: precio.activo ? "#10b981" : "#9ca3af" }} />
                      <Typography fontWeight={600}>{precio.tipo}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {editingId === precio.id ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                        sx={{ width: 120 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        autoFocus
                      />
                    ) : (
                      <Typography variant="h6" fontWeight={700} color={precio.activo ? "#1e293b" : "#9ca3af"}>
                        ${precio.precio.toLocaleString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(precio.vigenciaDesde).toLocaleDateString("es-AR")}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={precio.activo}
                      onChange={() => handleToggle(precio.id)}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {editingId === precio.id ? (
                      <IconButton color="success" onClick={() => handleSave(precio.id)}>
                        <SaveIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => handleEdit(precio.id, precio.precio)}>
                        <EditIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          Agregar Nuevo Tipo de Combustible
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
          <TextField label="Tipo" placeholder="Ej: Biodiesel" size="small" sx={{ width: 200 }} />
          <TextField
            label="Precio/Litro"
            type="number"
            size="small"
            sx={{ width: 150 }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
          <Button variant="outlined" onClick={() => toast.info("Funcionalidad disponible próximamente")}>
            Agregar
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ==================== UMBRALES POR VEHÍCULO ====================
function UmbralesTab() {
  const [umbrales, setUmbrales] = useState([
    { id: 1, tipoVehiculo: "Camión", litrosMin: 50, litrosMax: 300, alertaExceso: true },
    { id: 2, tipoVehiculo: "Pickup", litrosMin: 20, litrosMax: 80, alertaExceso: true },
    { id: 3, tipoVehiculo: "Tractor", litrosMin: 80, litrosMax: 400, alertaExceso: true },
    { id: 4, tipoVehiculo: "Cosechadora", litrosMin: 100, litrosMax: 500, alertaExceso: true },
    { id: 5, tipoVehiculo: "Sembradora", litrosMin: 50, litrosMax: 200, alertaExceso: false },
    { id: 6, tipoVehiculo: "Pulverizadora", litrosMin: 30, litrosMax: 150, alertaExceso: false },
  ]);

  const handleChange = (id: number, field: string, value: number | boolean) => {
    setUmbrales(umbrales.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  };

  const handleSave = () => {
    toast.success("Umbrales guardados correctamente");
  };

  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          🚛 Umbrales por Tipo de Vehículo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure los límites de litros permitidos por carga según el tipo de vehículo
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          Las cargas que excedan estos umbrales generarán alertas y podrían requerir validación adicional.
        </Alert>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f9fafb" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Tipo de Vehículo</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Mínimo (L)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Máximo (L)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Alertar Exceso</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {umbrales.map((umbral) => (
                <TableRow key={umbral.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DirectionsCarIcon sx={{ color: "#3b82f6" }} />
                      <Typography fontWeight={600}>{umbral.tipoVehiculo}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={umbral.litrosMin}
                      onChange={(e) => handleChange(umbral.id, "litrosMin", parseInt(e.target.value) || 0)}
                      sx={{ width: 100 }}
                      InputProps={{ endAdornment: <InputAdornment position="end">L</InputAdornment> }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={umbral.litrosMax}
                      onChange={(e) => handleChange(umbral.id, "litrosMax", parseInt(e.target.value) || 0)}
                      sx={{ width: 100 }}
                      InputProps={{ endAdornment: <InputAdornment position="end">L</InputAdornment> }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={umbral.alertaExceso}
                      onChange={(e) => handleChange(umbral.id, "alertaExceso", e.target.checked)}
                      color="warning"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "flex-end" }}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            Guardar Umbrales
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ==================== CONFIGURACIÓN DE ALERTAS ====================
function AlertasTab() {
  const [alertas, setAlertas] = useState({
    excesoCarga: true,
    cargaDuplicada: true,
    ubicacionInvalida: true,
    sinEvidencias: true,
    tanqueBajo: true,
    eventosPendientes: true,
    // Canales de notificación
    notifyEmail: true,
    notifyWhatsapp: false,
    notifyPush: false,
    // Destinatarios
    notifySupervisor: true,
    notifyAdmin: true,
    notifyOperador: false,
  });

  const handleToggle = (key: keyof typeof alertas) => {
    setAlertas({ ...alertas, [key]: !alertas[key] });
  };

  const handleSave = () => {
    toast.success("Configuración de alertas guardada");
  };

  const tiposAlerta = [
    { key: "excesoCarga", label: "Exceso de Carga", desc: "Cuando los litros exceden el umbral del vehículo" },
    { key: "cargaDuplicada", label: "Carga Duplicada", desc: "Posible carga duplicada en corto período" },
    { key: "ubicacionInvalida", label: "Ubicación Inválida", desc: "GPS fuera del radio permitido" },
    { key: "sinEvidencias", label: "Sin Evidencias", desc: "Evento sin las evidencias obligatorias" },
    { key: "tanqueBajo", label: "Tanque Bajo", desc: "Stock de tanque por debajo del mínimo" },
    { key: "eventosPendientes", label: "Eventos Pendientes", desc: "Eventos sin validar por más de 24h" },
  ];

  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          🔔 Configuración de Alertas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure qué alertas desea recibir y cómo desea ser notificado
        </Typography>

        <Grid container spacing={4}>
          {/* Tipos de Alerta */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Tipos de Alerta
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {tiposAlerta.map((tipo) => (
                <Card key={tipo.key} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography fontWeight={600}>{tipo.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tipo.desc}
                      </Typography>
                    </Box>
                    <Switch
                      checked={alertas[tipo.key as keyof typeof alertas] as boolean}
                      onChange={() => handleToggle(tipo.key as keyof typeof alertas)}
                      color="warning"
                    />
                  </Box>
                </Card>
              ))}
            </Box>
          </Grid>

          {/* Canales y Destinatarios */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Canales de Notificación
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={alertas.notifyEmail}
                    onChange={() => handleToggle("notifyEmail")}
                    color="success"
                  />
                }
                label="Email"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={alertas.notifyWhatsapp}
                    onChange={() => handleToggle("notifyWhatsapp")}
                    color="success"
                  />
                }
                label="WhatsApp"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={alertas.notifyPush}
                    onChange={() => handleToggle("notifyPush")}
                    color="success"
                  />
                }
                label="Notificación Push"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Destinatarios
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={alertas.notifyAdmin}
                    onChange={() => handleToggle("notifyAdmin")}
                    color="primary"
                  />
                }
                label="Administrador"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={alertas.notifySupervisor}
                    onChange={() => handleToggle("notifySupervisor")}
                    color="primary"
                  />
                }
                label="Supervisor de Unidad"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={alertas.notifyOperador}
                    onChange={() => handleToggle("notifyOperador")}
                    color="primary"
                  />
                }
                label="Operador (solo sus alertas)"
              />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            Guardar Configuración
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ==================== PÁGINA PRINCIPAL ====================
export default function ConfiguracionPage() {
  const [tab, setTab] = useState(0);
  const { hasPermission } = useTenantStore();
  const canEdit = hasPermission("configuracion:editar");

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, mt: -3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Configuración
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión de políticas, precios, umbrales, alertas y personalización
        </Typography>
      </Box>

      {!canEdit && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No tienes permisos para editar la configuración. Los cambios no se guardarán.
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, newValue) => setTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          bgcolor: "white",
          borderRadius: 2,
          border: "1px solid #e2e8f0",
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            minHeight: 64,
          },
        }}
      >
        <Tab icon={<PolicyIcon />} iconPosition="start" label="Políticas" />
        <Tab icon={<LocalGasStationIcon />} iconPosition="start" label="Precios" />
        <Tab icon={<DirectionsCarIcon />} iconPosition="start" label="Umbrales" />
        <Tab icon={<NotificationsIcon />} iconPosition="start" label="Alertas" />
        <Tab icon={<PaletteIcon />} iconPosition="start" label="Personalización" />
      </Tabs>

      {tab === 0 && <PoliticasTab />}
      {tab === 1 && <PreciosTab />}
      {tab === 2 && <UmbralesTab />}
      {tab === 3 && <AlertasTab />}
      {tab === 4 && <PersonalizacionTab />}
    </Box>
  );
}
