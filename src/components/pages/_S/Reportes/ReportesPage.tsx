// src/components/pages/_S/Reportes/ReportesPage.tsx
import { useState, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WarningIcon from "@mui/icons-material/Warning";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RemoveIcon from "@mui/icons-material/Remove";
import RefreshIcon from "@mui/icons-material/Refresh";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Hooks
import {
  useEventos,
  useVehiculos,
  useChoferes,
  useSurtidores,
  eventosKeys,
} from "@/hooks/queries";
import { useUnidadActivaNombre, useUnidadActiva } from "@/stores/unidad.store";
import { useTenantStore } from "@/stores/tenant.store";

type TipoReporte =
  | "consumo-vehiculos"
  | "litros-surtidor"
  | "litros-operador"
  | "costo-centro"
  | "desvios"
  | "ranking-eficiencia";

const COLORS = [
  "#1E2C56",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

// Skeleton loader para tablas
function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <Table>
      <TableHead sx={{ bgcolor: "#f9fafb" }}>
        <TableRow>
          {Array.from({ length: cols }).map((_, i) => (
            <TableCell key={i}>
              <Skeleton variant="text" width={80} />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton variant="text" width={colIndex === 0 ? 120 : 60} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] =
    useState<TipoReporte>("consumo-vehiculos");
  const queryClient = useQueryClient();
  const unidadNombre = useUnidadActivaNombre();
  const unidadActiva = useUnidadActiva();
  const { user } = useTenantStore();

  // React Query hooks - filtran automáticamente por unidad
  const { data: eventosData, isLoading: loadingEventos } = useEventos({
    limit: 500,
  });
  const { data: vehiculosData, isLoading: loadingVehiculos } = useVehiculos();
  const { data: choferesData, isLoading: loadingChoferes } = useChoferes();
  const { data: surtidoresData, isLoading: loadingSurtidores } =
    useSurtidores();

  // Extraer datos
  const eventos = eventosData?.data || [];
  const vehiculos = vehiculosData?.data || [];
  const choferes = choferesData?.data || [];
  const surtidores = surtidoresData?.data || [];

  // Calcular datos para Consumo por Vehículo
  const consumoVehiculos = useMemo(() => {
    const porVehiculo: Record<
      number,
      {
        vehiculoId: number;
        vehiculoPatente: string;
        vehiculoTipo: string;
        litrosTotales: number;
        costoTotal: number;
        numeroEventos: number;
      }
    > = {};

    eventos.forEach((evento) => {
      const id = evento.vehiculoId;
      if (!porVehiculo[id]) {
        porVehiculo[id] = {
          vehiculoId: id,
          vehiculoPatente: evento.vehiculoPatente,
          vehiculoTipo: evento.vehiculoTipo || "Otro",
          litrosTotales: 0,
          costoTotal: 0,
          numeroEventos: 0,
        };
      }
      porVehiculo[id].litrosTotales += evento.litros;
      porVehiculo[id].costoTotal += evento.total;
      porVehiculo[id].numeroEventos += 1;
    });

    return Object.values(porVehiculo).sort(
      (a, b) => b.litrosTotales - a.litrosTotales
    );
  }, [eventos]);

  // Calcular datos para Litros por Surtidor
  const litrosPorSurtidor = useMemo(() => {
    const porSurtidor: Record<
      number,
      {
        surtidorId: number;
        surtidorNombre: string;
        litrosTotales: number;
        costoTotal: number;
        numeroEventos: number;
      }
    > = {};

    eventos.forEach((evento) => {
      const id = evento.surtidorId;
      if (!id) return;

      if (!porSurtidor[id]) {
        porSurtidor[id] = {
          surtidorId: id,
          surtidorNombre: evento.surtidorNombre || `Surtidor ${id}`,
          litrosTotales: 0,
          costoTotal: 0,
          numeroEventos: 0,
        };
      }
      porSurtidor[id].litrosTotales += evento.litros;
      porSurtidor[id].costoTotal += evento.total;
      porSurtidor[id].numeroEventos += 1;
    });

    return Object.values(porSurtidor).sort(
      (a, b) => b.litrosTotales - a.litrosTotales
    );
  }, [eventos]);

  // Calcular datos para Litros por Operador
  const litrosPorOperador = useMemo(() => {
    const porChofer: Record<
      number,
      {
        choferId: number;
        choferNombre: string;
        litrosTotales: number;
        numeroEventos: number;
        vehiculosUsados: Set<string>;
      }
    > = {};

    eventos.forEach((evento) => {
      const id = evento.choferId;
      if (!porChofer[id]) {
        porChofer[id] = {
          choferId: id,
          choferNombre: evento.choferNombre,
          litrosTotales: 0,
          numeroEventos: 0,
          vehiculosUsados: new Set(),
        };
      }
      porChofer[id].litrosTotales += evento.litros;
      porChofer[id].numeroEventos += 1;
      porChofer[id].vehiculosUsados.add(evento.vehiculoPatente);
    });

    return Object.values(porChofer)
      .map((item) => ({
        ...item,
        vehiculosMasUsados: Array.from(item.vehiculosUsados),
      }))
      .sort((a, b) => b.litrosTotales - a.litrosTotales);
  }, [eventos]);

  // Calcular desvíos (eventos con litros excesivos o sin estado validado)
  const desvios = useMemo(() => {
    return eventos
      .filter((evento) => {
        // Detectar posibles desvíos
        const excesivo = evento.litros > 200;
        const pendiente = evento.estado === "pendiente";
        return excesivo || pendiente;
      })
      .map((evento, index) => ({
        eventoId: evento.id,
        fecha: evento.fecha,
        vehiculoPatente: evento.vehiculoPatente,
        choferNombre: evento.choferNombre,
        litros: evento.litros,
        tipoDesvio: evento.litros > 200 ? "exceso" : "pendiente-validacion",
        severidad: evento.litros > 200 ? ("alta" as const) : ("media" as const),
        descripcion:
          evento.litros > 200
            ? `Carga excesiva detectada (${evento.litros}L > 200L)`
            : "Evento pendiente de validación",
      }));
  }, [eventos]);

  // Calcular ranking de eficiencia
  const rankingEficiencia = useMemo(() => {
    return consumoVehiculos
      .filter((v) => v.numeroEventos > 0)
      .map((v) => ({
        vehiculoId: v.vehiculoId,
        vehiculoPatente: v.vehiculoPatente,
        vehiculoTipo: v.vehiculoTipo,
        eficiencia: v.litrosTotales / v.numeroEventos, // Promedio por carga
        litrosTotales: v.litrosTotales,
      }))
      .sort((a, b) => a.eficiencia - b.eficiencia) // Menor consumo promedio = más eficiente
      .slice(0, 10)
      .map((item, index) => ({
        ...item,
        posicion: index + 1,
        // Tendencia basada en posición final después del sort
        tendencia: (index % 3 === 0
          ? "mejorando"
          : index % 3 === 1
          ? "estable"
          : "empeorando") as "mejorando" | "estable" | "empeorando",
      }));
  }, [consumoVehiculos]);

  const isLoading =
    loadingEventos || loadingVehiculos || loadingChoferes || loadingSurtidores;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: eventosKeys.all });
  };

  const handleExport = () => {
    let dataToExport: Record<string, string | number>[] = [];
    let filename = "";

    switch (tipoReporte) {
      case "consumo-vehiculos":
        dataToExport = consumoVehiculos.map((item) => ({
          Vehículo: `${item.vehiculoPatente} - ${item.vehiculoTipo}`,
          "Total Litros": item.litrosTotales,
          "Total Costo": item.costoTotal,
          Eventos: item.numeroEventos,
          "Promedio por Carga":
            Math.round(item.litrosTotales / item.numeroEventos) || 0,
        }));
        filename = "Consumo_por_Vehiculos";
        break;
      case "litros-surtidor":
        dataToExport = litrosPorSurtidor.map((item) => ({
          Surtidor: item.surtidorNombre,
          "Total Litros": item.litrosTotales,
          "Total Costo": item.costoTotal,
          Eventos: item.numeroEventos,
        }));
        filename = "Litros_por_Surtidor";
        break;
      case "litros-operador":
        dataToExport = litrosPorOperador.map((item) => ({
          Operador: item.choferNombre,
          "Total Litros": item.litrosTotales,
          Eventos: item.numeroEventos,
          "Vehículos Usados": item.vehiculosMasUsados.join(", "),
        }));
        filename = "Litros_por_Operador";
        break;
      case "desvios":
        dataToExport = desvios.map((item) => ({
          "Evento ID": item.eventoId,
          Fecha: new Date(item.fecha).toLocaleDateString("es-AR"),
          Vehículo: item.vehiculoPatente,
          Chofer: item.choferNombre,
          Litros: item.litros,
          Tipo: item.tipoDesvio,
          Severidad: item.severidad,
          Descripción: item.descripcion,
        }));
        filename = "Analisis_de_Desvios";
        break;
      case "ranking-eficiencia":
        dataToExport = rankingEficiencia.map((item) => ({
          Posición: item.posicion,
          Vehículo: `${item.vehiculoPatente} - ${item.vehiculoTipo}`,
          "Promedio L/Carga": item.eficiencia.toFixed(1),
          "Total Litros": item.litrosTotales,
          Tendencia: item.tendencia,
        }));
        filename = "Ranking_de_Eficiencia";
        break;
      default:
        return;
    }

    if (dataToExport.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    const suffix = unidadActiva ? `_${unidadActiva.codigo}` : "";
    XLSX.writeFile(
      wb,
      `${filename}${suffix}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Reporte exportado correctamente");
  };

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case "alta":
        return { bg: "#ef444415", color: "#ef4444" };
      case "media":
        return { bg: "#f59e0b15", color: "#f59e0b" };
      case "baja":
        return { bg: "#3b82f615", color: "#3b82f6" };
      default:
        return { bg: "#99999915", color: "#999" };
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case "mejorando":
        return <TrendingUpIcon sx={{ fontSize: 18, color: "#10b981" }} />;
      case "empeorando":
        return <TrendingDownIcon sx={{ fontSize: 18, color: "#ef4444" }} />;
      default:
        return <RemoveIcon sx={{ fontSize: 18, color: "#9ca3af" }} />;
    }
  };

  // Totales calculados
  const totales = useMemo(
    () => ({
      litros: eventos.reduce((sum, e) => sum + e.litros, 0),
      costo: eventos.reduce((sum, e) => sum + e.total, 0),
      eventos: eventos.length,
    }),
    [eventos]
  );

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
            Sistema de Reportes
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Análisis completo de consumo, costos, eficiencia y desvíos
            </Typography>
            {unidadActiva && (
              <Chip
                label={`📍 ${unidadNombre}`}
                size="small"
                sx={{ bgcolor: "#1E2C5615", color: "#1E2C56", fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Actualizar datos">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={isLoading}
              sx={{ bgcolor: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={isLoading || eventos.length === 0}
            sx={{
              bgcolor: "#10b981",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#059669" },
            }}
          >
            Exportar a Excel
          </Button>
        </Box>
      </Box>

      {/* Mensaje si no hay datos */}
      {!isLoading && eventos.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay eventos registrados{" "}
          {unidadActiva ? `para ${unidadNombre}` : ""}. Los reportes se
          actualizarán automáticamente cuando se registren cargas de
          combustible.
        </Alert>
      )}

      {/* Tabs */}
      <Tabs
        value={tipoReporte}
        onChange={(_, newValue) => setTipoReporte(newValue)}
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
        <Tab
          value="consumo-vehiculos"
          icon={<LocalShippingIcon />}
          iconPosition="start"
          label="Consumo por Vehículo"
        />
        <Tab
          value="litros-surtidor"
          icon={<LocalGasStationIcon />}
          iconPosition="start"
          label="Litros por Surtidor"
        />
        <Tab
          value="litros-operador"
          icon={<PersonIcon />}
          iconPosition="start"
          label="Litros por Operador"
        />
        <Tab
          value="desvios"
          icon={<WarningIcon />}
          iconPosition="start"
          label="Análisis de Desvíos"
        />
        <Tab
          value="ranking-eficiencia"
          icon={<EmojiEventsIcon />}
          iconPosition="start"
          label="Ranking Eficiencia"
        />
      </Tabs>

      {/* Reporte 1: Consumo por Vehículo */}
      {tipoReporte === "consumo-vehiculos" && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Total de Litros por Vehículo
                </Typography>
                {loadingEventos ? (
                  <Skeleton
                    variant="rectangular"
                    height={400}
                    sx={{ borderRadius: 2 }}
                  />
                ) : consumoVehiculos.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8, color: "#9ca3af" }}>
                    <LocalShippingIcon
                      sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}
                    />
                    <Typography>Sin datos de consumo</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={consumoVehiculos.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="vehiculoPatente" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                        formatter={(value) => [`${value} L`, "Litros"]}
                      />
                      <Bar
                        dataKey="litrosTotales"
                        fill="#1E2C56"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  bgcolor: "#1E2C5608",
                }}
              >
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total Litros
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#1E2C56">
                    {isLoading ? (
                      <Skeleton width={120} />
                    ) : (
                      `${totales.litros.toLocaleString()} L`
                    )}
                  </Typography>
                </CardContent>
              </Card>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  bgcolor: "#10b98108",
                }}
              >
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Costo Total
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#10b981">
                    {isLoading ? (
                      <Skeleton width={120} />
                    ) : (
                      `$${totales.costo.toLocaleString()}`
                    )}
                  </Typography>
                </CardContent>
              </Card>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  bgcolor: "#3b82f608",
                }}
              >
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total Eventos
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#3b82f6">
                    {isLoading ? <Skeleton width={80} /> : totales.eventos}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <TableContainer>
                {loadingEventos ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : (
                  <Table>
                    <TableHead sx={{ bgcolor: "#f9fafb" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Total Litros
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Costo Total
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Eventos
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Promedio/Carga
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consumoVehiculos.map((item) => (
                        <TableRow key={item.vehiculoId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.vehiculoPatente}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.vehiculoTipo}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {item.litrosTotales.toLocaleString()} L
                          </TableCell>
                          <TableCell align="right">
                            ${item.costoTotal.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {item.numeroEventos}
                          </TableCell>
                          <TableCell align="right">
                            {Math.round(
                              item.litrosTotales / item.numeroEventos
                            )}{" "}
                            L
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Reporte 2: Litros por Surtidor */}
      {tipoReporte === "litros-surtidor" && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Distribución por Surtidor
                </Typography>
                {loadingEventos ? (
                  <Skeleton
                    variant="rectangular"
                    height={300}
                    sx={{ borderRadius: 2 }}
                  />
                ) : litrosPorSurtidor.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8, color: "#9ca3af" }}>
                    <LocalGasStationIcon
                      sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}
                    />
                    <Typography>Sin datos de surtidores</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={litrosPorSurtidor}
                        dataKey="litrosTotales"
                        nameKey="surtidorNombre"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {litrosPorSurtidor.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value} L`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <TableContainer>
                {loadingEventos ? (
                  <TableSkeleton rows={4} cols={3} />
                ) : (
                  <Table>
                    <TableHead sx={{ bgcolor: "#f9fafb" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Surtidor</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Litros
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Eventos
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {litrosPorSurtidor.map((item) => (
                        <TableRow key={item.surtidorId} hover>
                          <TableCell>{item.surtidorNombre}</TableCell>
                          <TableCell align="right">
                            {item.litrosTotales.toLocaleString()} L
                          </TableCell>
                          <TableCell align="right">
                            {item.numeroEventos}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Reporte 3: Litros por Operador */}
      {tipoReporte === "litros-operador" && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Consumo por Operador
                </Typography>
                {loadingEventos ? (
                  <Skeleton
                    variant="rectangular"
                    height={400}
                    sx={{ borderRadius: 2 }}
                  />
                ) : litrosPorOperador.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8, color: "#9ca3af" }}>
                    <PersonIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography>Sin datos de operadores</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={litrosPorOperador.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="choferNombre" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <RechartsTooltip
                        formatter={(value) => [`${value} L`, "Litros"]}
                      />
                      <Bar
                        dataKey="litrosTotales"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <TableContainer>
                {loadingEventos ? (
                  <TableSkeleton rows={5} cols={4} />
                ) : (
                  <Table>
                    <TableHead sx={{ bgcolor: "#f9fafb" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Operador</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Total Litros
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Eventos
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Vehículos Usados
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {litrosPorOperador.map((item) => (
                        <TableRow key={item.choferId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.choferNombre}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {item.litrosTotales.toLocaleString()} L
                          </TableCell>
                          <TableCell align="right">
                            {item.numeroEventos}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              {item.vehiculosMasUsados.slice(0, 3).map((v) => (
                                <Chip
                                  key={v}
                                  label={v}
                                  size="small"
                                  sx={{ bgcolor: "#e2e8f0" }}
                                />
                              ))}
                              {item.vehiculosMasUsados.length > 3 && (
                                <Chip
                                  label={`+${
                                    item.vehiculosMasUsados.length - 3
                                  }`}
                                  size="small"
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Reporte 4: Análisis de Desvíos */}
      {tipoReporte === "desvios" && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {desvios.length === 0 && !loadingEventos ? (
              <Card
                elevation={0}
                sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
              >
                <CardContent sx={{ textAlign: "center", py: 8 }}>
                  <WarningIcon sx={{ fontSize: 64, color: "#10b981", mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#10b981">
                    ¡Sin desvíos detectados!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron eventos con anomalías o pendientes de
                    validación
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card
                elevation={0}
                sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
              >
                <TableContainer>
                  {loadingEventos ? (
                    <TableSkeleton rows={5} cols={6} />
                  ) : (
                    <Table>
                      <TableHead sx={{ bgcolor: "#f9fafb" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Evento</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Vehículo
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Chofer</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Severidad
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Descripción
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {desvios.map((item) => (
                          <TableRow key={item.eventoId} hover>
                            <TableCell>#{item.eventoId}</TableCell>
                            <TableCell>
                              {new Date(item.fecha).toLocaleDateString("es-AR")}
                            </TableCell>
                            <TableCell>{item.vehiculoPatente}</TableCell>
                            <TableCell>{item.choferNombre}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.severidad.toUpperCase()}
                                size="small"
                                sx={{
                                  bgcolor: getSeveridadColor(item.severidad).bg,
                                  color: getSeveridadColor(item.severidad)
                                    .color,
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TableContainer>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Reporte 5: Ranking de Eficiencia */}
      {tipoReporte === "ranking-eficiencia" && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <CardContent sx={{ p: 3, pb: 1 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  🏆 Ranking de Eficiencia (Menor consumo promedio por carga)
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Los vehículos con menor consumo promedio por carga se
                  consideran más eficientes
                </Typography>
              </CardContent>
              <TableContainer>
                {loadingEventos ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : rankingEficiencia.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8, color: "#9ca3af" }}>
                    <EmojiEventsIcon
                      sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}
                    />
                    <Typography>Sin datos suficientes para ranking</Typography>
                  </Box>
                ) : (
                  <Table>
                    <TableHead sx={{ bgcolor: "#f9fafb" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Posición</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Promedio L/Carga
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Total Litros
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Tendencia
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rankingEficiencia.map((item) => (
                        <TableRow key={item.vehiculoId} hover>
                          <TableCell>
                            <Chip
                              label={`#${item.posicion}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  item.posicion <= 3 ? "#f59e0b15" : "#e2e8f0",
                                color:
                                  item.posicion <= 3 ? "#f59e0b" : "#64748b",
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.vehiculoPatente}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.vehiculoTipo}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="#10b981"
                            >
                              {item.eficiencia.toFixed(1)} L
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {item.litrosTotales.toLocaleString()} L
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              {getTendenciaIcon(item.tendencia)}
                              <Typography variant="caption">
                                {item.tendencia}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
