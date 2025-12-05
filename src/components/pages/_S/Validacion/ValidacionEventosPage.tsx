import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import { useTenantStore } from "@/stores/tenant.store";
import { format } from "date-fns";

// Tipos
interface Evidencia {
  id: number;
  eventoId: number;
  tipo: string;
  url: string;
  uploadedAt: string;
}

interface Evento {
  id: number;
  vehiculoId: number;
  vehiculoPatente: string;
  choferNombre: string;
  litros: number;
  total: number;
  fecha: string;
  estado: string;
  empresaId: number;
  empresaNombre?: string;
}

interface EventoExtended extends Evento {
  vehiculo?: string;
  chofer?: string;
  costo?: number;
  kmInicial?: number;
  kmFinal?: number;
  motivoRechazo?: string;
}

interface ValidationResult {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

// Constantes
const ESTADOS_EVENTO = {
  PENDIENTE: "Pendiente",
  VALIDADO: "Validado",
  RECHAZADO: "Rechazado",
};

// Mock data
const mockEventos: EventoExtended[] = [
  {
    id: 1,
    vehiculoId: 1,
    vehiculoPatente: "ABC123",
    vehiculo: "ABC123 - Camión Ford",
    choferNombre: "Juan Pérez",
    chofer: "Juan Pérez",
    litros: 50,
    total: 42500,
    costo: 42500,
    fecha: new Date().toISOString(),
    estado: ESTADOS_EVENTO.PENDIENTE,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
  {
    id: 2,
    vehiculoId: 2,
    vehiculoPatente: "XYZ789",
    vehiculo: "XYZ789 - Pickup Toyota",
    choferNombre: "María González",
    chofer: "María González",
    litros: 35,
    total: 29750,
    costo: 29750,
    fecha: new Date().toISOString(),
    estado: ESTADOS_EVENTO.PENDIENTE,
    empresaId: 1,
    empresaNombre: "Empresa A",
  },
  {
    id: 3,
    vehiculoId: 3,
    vehiculoPatente: "AAA111",
    vehiculo: "AAA111 - Chevrolet S10",
    choferNombre: "Carlos López",
    chofer: "Carlos López",
    litros: 220,
    total: 187000,
    costo: 187000,
    fecha: new Date().toISOString(),
    estado: ESTADOS_EVENTO.PENDIENTE,
    empresaId: 2,
    empresaNombre: "Empresa B",
  },
];

const mockEvidencias: Evidencia[] = [
  {
    id: 1,
    eventoId: 1,
    tipo: "foto-surtidor",
    url: "https://images.unsplash.com/photo-1545262810-77515befe149?w=800",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: 2,
    eventoId: 1,
    tipo: "foto-odometro",
    url: "https://images.unsplash.com/photo-1621570945002-f4cdd43dbc68?w=800",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: 3,
    eventoId: 2,
    tipo: "foto-surtidor",
    url: "https://images.unsplash.com/photo-1545262810-77515befe149?w=800",
    uploadedAt: new Date().toISOString(),
  },
];

function getEvidenciasByEvento(eventoId: number): Evidencia[] {
  return mockEvidencias.filter((e) => e.eventoId === eventoId);
}

function validarEventoConPoliticas(evento: EventoExtended): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validaciones básicas
  if (!evento.litros || evento.litros <= 0) {
    errores.push("Los litros deben ser mayor a 0");
  }

  if (evento.litros > 200) {
    advertencias.push("Carga excesiva de combustible detectada (>200L)");
  }

  const evidencias = getEvidenciasByEvento(evento.id);
  if (evidencias.length === 0) {
    errores.push("Faltan evidencias fotográficas");
  }

  if (evidencias.length < 2) {
    advertencias.push("Se recomienda adjuntar al menos 2 evidencias");
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

function getResumenValidacion(result: ValidationResult): string {
  const parts = [];
  if (result.errores.length > 0) {
    parts.push(`Errores: ${result.errores.join(", ")}`);
  }
  if (result.advertencias.length > 0) {
    parts.push(`Advertencias: ${result.advertencias.join(", ")}`);
  }
  return parts.join(" | ") || "Todo correcto";
}

// Componente EventoDetalle mejorado
function EventoDetalle({
  open,
  onClose,
  evento,
  evidencias,
  onValidate,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  evento: EventoExtended;
  evidencias: Evidencia[];
  onValidate: (e: EventoExtended) => void;
  onReject: (e: EventoExtended) => void;
}) {
  const validationResult = validarEventoConPoliticas(evento);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "#3b82f615",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LocalGasStationIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Detalle del Evento #{evento.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {evento.vehiculo}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Resumen de validación */}
          {!validationResult.valido && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {validationResult.errores.join(", ")}
              </Typography>
            </Alert>
          )}
          {validationResult.advertencias.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {validationResult.advertencias.join(", ")}
              </Typography>
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Chofer
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {evento.chofer}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Fecha
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {format(new Date(evento.fecha), "dd/MM/yyyy HH:mm")}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Litros
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#1E2C56">
                {evento.litros} L
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#10b981">
                ${evento.total.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Evidencias ({evidencias.length})
          </Typography>
          <Grid container spacing={2}>
            {evidencias.map((evidencia) => (
              <Grid item xs={6} key={evidencia.id}>
                <Box
                  component="img"
                  src={evidencia.url}
                  alt={evidencia.tipo}
                  sx={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {evidencia.tipo}
                </Typography>
              </Grid>
            ))}
            {evidencias.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">No hay evidencias disponibles</Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
        <Button
          color="error"
          onClick={() => onReject(evento)}
          startIcon={<CancelIcon />}
        >
          Rechazar
        </Button>
        <Button
          variant="contained"
          onClick={() => onValidate(evento)}
          startIcon={<CheckCircleIcon />}
          disabled={!validationResult.valido}
          sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
        >
          Validar Evento
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ValidacionPage() {
  const { user } = useTenantStore();
  const [eventos, setEventos] = useState<EventoExtended[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvento, setSelectedEvento] = useState<EventoExtended | null>(
    null
  );
  const [openDetalleDialog, setOpenDetalleDialog] = useState<boolean>(false);
  const [openRejectDialog, setOpenRejectDialog] = useState<boolean>(false);
  const [motivo, setMotivo] = useState<string>("");

  // ✅ Todos los hooks antes del early return
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

  const eventosPendientes = useMemo(() => {
    return eventos.filter((e) => {
      const isPendiente = e.estado === ESTADOS_EVENTO.PENDIENTE;
      return isPendiente;
    });
  }, [eventos]);
  const validationResults = useMemo(() => {
    const results = new Map<number, ValidationResult>();
    eventosPendientes.forEach((evento) => {
      const result = validarEventoConPoliticas(evento);
      results.set(evento.id, result);
    });
    return results;
  }, [eventosPendientes]);

  // ✅ Early return después de todos los hooks
  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando eventos pendientes...</Typography>
      </Box>
    );
  }

  const handleViewDetalle = (evento: EventoExtended): void => {
    setSelectedEvento(evento);
    setOpenDetalleDialog(true);
  };

  const handleValidate = (evento: EventoExtended): void => {
    setEventos(
      eventos.map((e) =>
        e.id === evento.id ? { ...e, estado: ESTADOS_EVENTO.VALIDADO } : e
      )
    );
    setOpenDetalleDialog(false);
    setSelectedEvento(null);
  };

  const handleRejectClick = (evento: EventoExtended): void => {
    setSelectedEvento(evento);
    setOpenDetalleDialog(false);
    setOpenRejectDialog(true);
  };

  const confirmReject = (): void => {
    if (!motivo.trim() || !selectedEvento) return;

    setEventos(
      eventos.map((e) =>
        e.id === selectedEvento.id
          ? { ...e, estado: ESTADOS_EVENTO.RECHAZADO, motivoRechazo: motivo }
          : e
      )
    );
    setOpenRejectDialog(false);
    setSelectedEvento(null);
    setMotivo("");
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Validado":
        return { bg: "#10b98115", color: "#10b981" };
      case "Pendiente":
        return { bg: "#f59e0b15", color: "#f59e0b" };
      case "Rechazado":
        return { bg: "#ef444415", color: "#ef4444" };
      default:
        return { bg: "#99999915", color: "#999" };
    }
  };

  return (
    <Box sx={{ p: 3, mt: -3}}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, lineHeight: 1.1, mb: 0.5 }}
        >
          Validación de Eventos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Revisa evidencias y valida los eventos de combustible pendientes
        </Typography>
      </Box>

      {eventosPendientes.length === 0 ? (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
            border: "1px solid #10b981",
            bgcolor: "#10b98110",
          }}
        >
          <Typography fontWeight={600}>
            ✅ No hay eventos pendientes de validación
          </Typography>
        </Alert>
      ) : (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 2,
            border: "1px solid #f59e0b",
            bgcolor: "#f59e0b10",
          }}
        >
          <Typography fontWeight={600}>
            <strong>{eventosPendientes.length}</strong>{" "}
            {eventosPendientes.length === 1
              ? "evento pendiente"
              : "eventos pendientes"}{" "}
            de validación
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {eventosPendientes.map((evento) => {
          const validationResult = validationResults.get(evento.id);
          const hasErrors = validationResult?.errores.length
            ? validationResult.errores.length > 0
            : false;
          const hasWarnings = validationResult?.advertencias.length
            ? validationResult.advertencias.length > 0
            : false;

          return (
            <Grid
              item
              xs={12}
              md={6}
              lg={4}
              key={evento.id}
              sx={{ display: "flex" }}
            >
              <Card
                elevation={0}
                sx={{
                  border: "2px solid",
                  borderColor: hasErrors
                    ? "#ef4444"
                    : hasWarnings
                    ? "#f59e0b"
                    : "#e2e8f0",
                  borderRadius: 3,
                  transition: "all 0.25s ease",
                  bgcolor: hasErrors
                    ? "#ef444405"
                    : hasWarnings
                    ? "#f59e0b05"
                    : "white",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 2.5,
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    width: 500,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: getEstadoColor(evento.estado).bg,
                          color: getEstadoColor(evento.estado).color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <LocalGasStationIcon />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          Evento #{evento.id}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {evento.vehiculo || evento.vehiculoPatente}
                        </Typography>
                      </Box>
                    </Box>

                    {validationResult && !validationResult.valido ? (
                      <Tooltip title={getResumenValidacion(validationResult)}>
                        <Chip
                          icon={<ErrorIcon />}
                          label={`${validationResult.errores.length} Error${
                            validationResult.errores.length > 1 ? "es" : ""
                          }`}
                          size="small"
                          sx={{
                            bgcolor: "#ef444415",
                            color: "#ef4444",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        />
                      </Tooltip>
                    ) : hasWarnings ? (
                      <Tooltip title={getResumenValidacion(validationResult!)}>
                        <Chip
                          icon={<WarningIcon />}
                          label="Advertencias"
                          size="small"
                          sx={{
                            bgcolor: "#f59e0b15",
                            color: "#f59e0b",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="OK"
                        size="small"
                        sx={{
                          bgcolor: "#10b98115",
                          color: "#10b981",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>

                  {user?.role === "superadmin" && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1.5 }}
                    >
                      Empresa: {evento.empresaNombre}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      <strong>Chofer:</strong>{" "}
                      {evento.chofer || evento.choferNombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Fecha:</strong>{" "}
                      {format(new Date(evento.fecha), "dd/MM/yyyy HH:mm")}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#f9fafb",
                      borderRadius: 1.5,
                      mb: 2,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Litros
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="#1E2C56"
                        >
                          {evento.litros} L
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Costo
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="#10b981"
                        >
                          $
                          {(evento.costo || evento.total || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {getEvidenciasByEvento(evento.id).length > 0 && (
                    <Box
                      sx={{
                        mb: 2,
                        p: 1.5,
                        bgcolor: "#3b82f615",
                        borderRadius: 1.5,
                        border: "1px solid #3b82f630",
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="#3b82f6"
                      >
                        📎 {getEvidenciasByEvento(evento.id).length} evidencia
                        {getEvidenciasByEvento(evento.id).length > 1
                          ? "s"
                          : ""}{" "}
                        disponible
                        {getEvidenciasByEvento(evento.id).length > 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: "auto" }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetalle(evento)}
                      sx={{
                        bgcolor: "#1E2C56",
                        fontWeight: 600,
                        textTransform: "none",
                        mb: 1.5,
                        "&:hover": { bgcolor: "#16213E" },
                      }}
                    >
                      Ver Evidencias y Validar
                    </Button>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleValidate(evento)}
                        sx={{
                          borderColor: "#10b981",
                          color: "#10b981",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#059669",
                            bgcolor: "#10b98110",
                          },
                        }}
                        disabled={hasErrors}
                      >
                        Validar
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() => handleRejectClick(evento)}
                        sx={{
                          borderColor: "#ef4444",
                          color: "#ef4444",
                          fontWeight: 600,
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#dc2626",
                            bgcolor: "#ef444410",
                          },
                        }}
                      >
                        Rechazar
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {selectedEvento && (
        <EventoDetalle
          open={openDetalleDialog}
          onClose={() => setOpenDetalleDialog(false)}
          evento={selectedEvento}
          evidencias={getEvidenciasByEvento(selectedEvento.id)}
          onValidate={handleValidate}
          onReject={handleRejectClick}
        />
      )}

      <Dialog
        open={openRejectDialog}
        onClose={() => setOpenRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "#ef444415",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CancelIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Rechazar Evento
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Evento #{selectedEvento?.id}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Ingresa el motivo del rechazo. Este comentario será visible para el
            chofer y supervisores.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo del Rechazo *"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Los kilómetros no coinciden con el odómetro, falta evidencia fotográfica del surtidor, etc."
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setOpenRejectDialog(false);
              setMotivo("");
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmReject}
            disabled={!motivo.trim()}
            startIcon={<CancelIcon />}
            sx={{ fontWeight: 700 }}
          >
            Confirmar Rechazo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
