// src/pages/Dashboard/Reports/ReportsPage.tsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Hooks
import {
  useLoadLiters,
  useVehicles,
  useDrivers,
  useTrips,
  useResources,
  useBusinessUnits,
  loadLitersKeys,
} from "@/hooks/queries";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type {
  ConsumoVehiculoData,
  LitrosSurtidorData,
  LitrosOperadorData,
  CostoCentroCostoData,
  DesvioData,
  RankingEficienciaData,
  PeriodoReporte,
} from "@/types/reportes";
import { PERIODOS_REPORTE } from "@/types/reportes";

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

export default function ReportsPage() {
  const { canExport, showExportButtons } = useRoleLogic();

  const [tipoReporte, setTipoReporte] =
    useState<TipoReporte>("consumo-vehiculos");
  const [periodoReporte, setPeriodoReporte] = useState<PeriodoReporte>("mes");
  const queryClient = useQueryClient();

  // React Query hooks
  const { data: loadsData = [], isLoading: loadingLoads } = useLoadLiters();
  const { data: vehiclesData = [], isLoading: loadingVehiculos } =
    useVehicles();
  const { data: driversData = [], isLoading: loadingChoferes } = useDrivers();
  const { data: tripsData = [], isLoading: loadingTrips } = useTrips();
  const { data: resourcesData = [], isLoading: loadingResources } =
    useResources();
  const { data: businessUnitsData = [], isLoading: loadingBusinessUnits } =
    useBusinessUnits();

  // Extraer datos
  const loads = loadsData || [];
  const vehicles = vehiclesData || [];
  const drivers = driversData || [];
  const trips = tripsData || [];
  const allResources = resourcesData || [];
  const businessUnits = businessUnitsData || [];

  // 1. Calcular Consumo por Vehículo (L/100km, L/hora)
  const consumoVehiculos = useMemo((): ConsumoVehiculoData[] => {
    const consumoMap = new Map<number, ConsumoVehiculoData>();

    vehicles.forEach((vehicle) => {
      const vehicleLoads = loads.filter(
        (load) => load.idResource === vehicle.id
      );
      const vehicleTrips = trips.filter(
        (trip) => trip.idVehicle === vehicle.id
      );

      const litrosTotales = vehicleLoads.reduce(
        (sum, load) => sum + (load.totalLiters || 0),
        0
      );
      const totalKm = vehicleTrips.reduce(
        (sum, trip) => sum + (trip.totalKm || 0),
        0
      );

      const eficienciaKmPorLitro =
        totalKm > 0 && litrosTotales > 0 ? totalKm / litrosTotales : undefined;

      const typeArray = (vehicle as any).type || [];
      const vehicleTypeName = typeArray.length > 0 ? typeArray[0] : "Vehículo";

      consumoMap.set(vehicle.id, {
        vehiculoId: vehicle.id,
        vehiculoPatente: vehicle.identifier || vehicle.name,
        vehiculoTipo: vehicleTypeName,
        litrosTotales,
        costoTotal: 0, // TODO: Calcular con precios
        numeroEventos: vehicleLoads.length,
        eficienciaKmPorLitro,
        eficienciaLitrosPorHora: undefined, // TODO: Calcular con horómetro
        consumoPromedioPorEvento:
          vehicleLoads.length > 0 ? litrosTotales / vehicleLoads.length : 0,
      });
    });

    return Array.from(consumoMap.values()).sort(
      (a, b) => b.litrosTotales - a.litrosTotales
    );
  }, [vehicles, loads, trips]);

  // 2. Calcular Litros por Surtidor/Tanque
  const litrosPorSurtidor = useMemo((): LitrosSurtidorData[] => {
    const surtidores = allResources.filter((r) => {
      const typeArray = (r as any).type || [];
      const typeName = typeArray.length > 0 ? typeArray[0] : "";
      return (
        typeName.toLowerCase().includes("surtidor") ||
        typeName.toLowerCase().includes("dispenser") ||
        typeName.toLowerCase().includes("tanque")
      );
    });

    const totalLitros = loads.reduce(
      (sum, load) => sum + (load.totalLiters || 0),
      0
    );

    return surtidores.map((surtidor) => {
      const surtidorLoads = loads.filter(
        (load) => load.idResource === surtidor.id
      );
      const litrosTotales = surtidorLoads.reduce(
        (sum, load) => sum + (load.totalLiters || 0),
        0
      );

      return {
        surtidorId: surtidor.id,
        surtidorNombre: surtidor.name,
        surtidorUbicacion: surtidor.identifier || "",
        litrosTotales,
        costoTotal: 0,
        numeroEventos: surtidorLoads.length,
        porcentajeTotal:
          totalLitros > 0 ? (litrosTotales / totalLitros) * 100 : 0,
      };
    });
  }, [allResources, loads]);

  // 3. Calcular Costos por Centro de Costos (Business Units)
  const costosPorCentroCosto = useMemo((): CostoCentroCostoData[] => {
    return businessUnits.map((bu) => {
      // Obtener recursos de esta unidad de negocio
      const buResources = allResources.filter(
        (r) => r.idBusinessUnit === bu.id
      );
      const resourceIds = new Set(buResources.map((r) => r.id));

      // Obtener cargas de estos recursos
      const buLoads = loads.filter((load) => resourceIds.has(load.idResource));

      const litrosTotales = buLoads.reduce(
        (sum, load) => sum + (load.totalLiters || 0),
        0
      );

      // Obtener vehículos asignados a esta unidad
      const buVehicles = vehicles.filter((v) => v.idBusinessUnit === bu.id);

      return {
        centroCostoId: bu.id,
        centroCostoCodigo: bu.name.substring(0, 3).toUpperCase() || "N/A",
        centroCostoNombre: bu.name,
        centroCostoTipo: "Unidad de Negocio",
        litrosTotales,
        costoTotal: 0, // TODO: Calcular con precios
        numeroEventos: buLoads.length,
        vehiculosAsignados: buVehicles.length,
      };
    });
  }, [businessUnits, allResources, loads, vehicles]);

  // 4. Calcular Litros por Operador (chofer)
  const litrosPorOperador = useMemo((): LitrosOperadorData[] => {
    return drivers.map((driver) => {
      const driverTrips = trips.filter((trip) => trip.idDriver === driver.id);
      const vehicleIds = new Set(
        driverTrips.map((trip) => trip.idVehicle).filter(Boolean) as number[]
      );

      const driverLoads = loads.filter((load) =>
        vehicleIds.has(load.idResource)
      );

      const litrosTotales = driverLoads.reduce(
        (sum, load) => sum + (load.totalLiters || 0),
        0
      );

      const vehiculosMasUsados = Array.from(vehicleIds)
        .map((vid) => vehicles.find((v) => v.id === vid)?.name || "")
        .filter(Boolean);

      return {
        choferId: driver.id,
        choferNombre: driver.name.split(" ")[0] || "",
        choferApellido: driver.name.split(" ").slice(1).join(" ") || "",
        litrosTotales,
        costoTotal: 0,
        numeroEventos: driverLoads.length,
        vehiculosMasUsados,
      };
    });
  }, [drivers, trips, loads, vehicles]);

  // 4. Análisis de Desvíos (fuera de rango, anomalías)
  const desvios = useMemo((): DesvioData[] => {
    const desviosList: DesvioData[] = [];

    loads.forEach((load) => {
      // Detectar cargas muy grandes (> 500L)
      if (load.totalLiters > 500) {
        const vehicle = vehicles.find((v) => v.id === load.idResource);
        const trip = trips.find((t) => t.idVehicle === load.idResource);
        desviosList.push({
          eventoId: load.id,
          fecha: load.loadDate,
          vehiculoPatente: vehicle?.identifier || vehicle?.name || "N/A",
          choferNombre: trip?.nameDriver || load.nameResource || "N/A",
          litros: load.totalLiters,
          tipoDesvio: "Carga excesiva",
          severidad: load.totalLiters > 1000 ? "alta" : "media",
          descripcion: `Carga de ${load.totalLiters}L excede el umbral normal`,
          resuelto: false,
        });
      }

      // Detectar cargas negativas o cero
      if (load.totalLiters <= 0 && load.initialLiters > 0) {
        const vehicle = vehicles.find((v) => v.id === load.idResource);
        const trip = trips.find((t) => t.idVehicle === load.idResource);
        desviosList.push({
          eventoId: load.id,
          fecha: load.loadDate,
          vehiculoPatente: vehicle?.identifier || vehicle?.name || "N/A",
          choferNombre: trip?.nameDriver || load.nameResource || "N/A",
          litros: load.totalLiters,
          tipoDesvio: "Carga inválida",
          severidad: "alta",
          descripcion: "Carga con total de litros inválido",
          resuelto: false,
        });
      }
    });

    return desviosList;
  }, [loads, vehicles, trips]);

  // 6. Ranking de Eficiencia
  const rankingEficiencia = useMemo((): RankingEficienciaData[] => {
    return consumoVehiculos
      .filter((c) => c.eficienciaKmPorLitro !== undefined)
      .map((consumo, index) => ({
        posicion: index + 1,
        vehiculoId: consumo.vehiculoId,
        vehiculoPatente: consumo.vehiculoPatente,
        vehiculoTipo: consumo.vehiculoTipo,
        eficiencia: consumo.eficienciaKmPorLitro || 0,
        litrosTotales: consumo.litrosTotales,
        tendencia: "estable" as const,
        variacion: 0,
      }))
      .sort((a, b) => b.eficiencia - a.eficiencia)
      .slice(0, 10)
      .map((item, index) => ({
        ...item,
        posicion: index + 1,
      }));
  }, [consumoVehiculos]);

  const isLoading =
    loadingLoads ||
    loadingVehiculos ||
    loadingChoferes ||
    loadingTrips ||
    loadingResources ||
    loadingBusinessUnits;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: loadLitersKeys.all });
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
          "Eficiencia (km/L)": item.eficienciaKmPorLitro
            ? item.eficienciaKmPorLitro.toFixed(2)
            : "N/A",
          "Promedio por Evento": item.consumoPromedioPorEvento.toFixed(2),
        }));
        filename = "Consumo_por_Vehiculos";
        break;
      case "litros-surtidor":
        dataToExport = litrosPorSurtidor.map((item) => ({
          Surtidor: item.surtidorNombre,
          Ubicación: item.surtidorUbicacion,
          "Total Litros": item.litrosTotales,
          "Total Costo": item.costoTotal,
          Eventos: item.numeroEventos,
          "% del Total": item.porcentajeTotal.toFixed(2),
        }));
        filename = "Litros_por_Surtidor";
        break;
      case "litros-operador":
        dataToExport = litrosPorOperador.map((item) => ({
          Operador: `${item.choferNombre} ${item.choferApellido}`,
          "Total Litros": item.litrosTotales,
          Eventos: item.numeroEventos,
          "Vehículos Usados": item.vehiculosMasUsados.join(", "),
        }));
        filename = "Litros_por_Operador";
        break;
      case "costo-centro":
        dataToExport = costosPorCentroCosto.map((item) => ({
          "Centro de Costo": item.centroCostoNombre,
          Código: item.centroCostoCodigo,
          Tipo: item.centroCostoTipo,
          "Total Litros": item.litrosTotales,
          "Costo Total": item.costoTotal,
          Eventos: item.numeroEventos,
          "Vehículos Asignados": item.vehiculosAsignados,
        }));
        filename = "Costos_por_Centro_Costo";
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
          Estado: item.resuelto ? "Resuelto" : "Pendiente",
        }));
        filename = "Analisis_de_Desvios";
        break;
      case "ranking-eficiencia":
        dataToExport = rankingEficiencia.map((item) => ({
          Posición: item.posicion,
          Vehículo: `${item.vehiculoPatente} - ${item.vehiculoTipo}`,
          "Eficiencia (km/L)": item.eficiencia.toFixed(2),
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
    XLSX.writeFile(
      wb,
      `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Reporte exportado correctamente");
  };

  // Totales calculados
  const totales = useMemo(
    () => ({
      litros: loads.reduce((sum, load) => sum + (load.totalLiters || 0), 0),
      costo: 0, // TODO: Calcular con precios
      eventos: loads.length,
    }),
    [loads]
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
            <FormControl size="small" sx={{ minWidth: 200, ml: 2 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={periodoReporte}
                label="Período"
                onChange={(e) =>
                  setPeriodoReporte(e.target.value as PeriodoReporte)
                }
              >
                {PERIODOS_REPORTE.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          {showExportButtons && (
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={isLoading || loads.length === 0 || !canExport}
              sx={{
                bgcolor: "#10b981",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              Exportar a Excel
            </Button>
          )}
        </Box>
      </Box>

      {/* Mensaje si no hay datos */}
      {!isLoading && loads.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay cargas de combustible registradas. Los reportes se actualizarán
          automáticamente cuando se registren cargas.
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
          value="costo-centro"
          icon={<AccountBalanceIcon />}
          iconPosition="start"
          label="Costos por Centro"
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
          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Total de Litros por Vehículo
                </Typography>
                {isLoading ? (
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

          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
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

          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <TableContainer>
                {isLoading ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : (
                  <Table>
                    <TableHead sx={{ bgcolor: "#f9fafb" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Total Litros
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Eventos
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Eficiencia (km/L)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Promedio/Evento
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consumoVehiculos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No hay datos disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        consumoVehiculos.map((item) => (
                          <TableRow key={item.vehiculoId} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {item.vehiculoPatente}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.vehiculoTipo}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {item.litrosTotales.toFixed(2)} L
                            </TableCell>
                            <TableCell align="right">
                              {item.numeroEventos}
                            </TableCell>
                            <TableCell align="right">
                              {item.eficienciaKmPorLitro
                                ? item.eficienciaKmPorLitro.toFixed(2)
                                : "N/A"}
                            </TableCell>
                            <TableCell align="right">
                              {item.consumoPromedioPorEvento.toFixed(2)} L
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Distribución por Surtidor
                </Typography>
                {isLoading ? (
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

          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <TableContainer>
                {isLoading ? (
                  <TableSkeleton rows={4} cols={5} />
                ) : (
                  <Table>
                    <TableHead sx={{ bgcolor: "#f9fafb" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Surtidor</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Ubicación
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Litros Totales
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Eventos
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          % del Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {litrosPorSurtidor.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No hay datos disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        litrosPorSurtidor.map((item) => (
                          <TableRow key={item.surtidorId} hover>
                            <TableCell>{item.surtidorNombre}</TableCell>
                            <TableCell>{item.surtidorUbicacion}</TableCell>
                            <TableCell align="right">
                              {item.litrosTotales.toFixed(2)} L
                            </TableCell>
                            <TableCell align="right">
                              {item.numeroEventos}
                            </TableCell>
                            <TableCell align="right">
                              {item.porcentajeTotal.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Consumo por Operador
                </Typography>
                {isLoading ? (
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

          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <TableContainer>
                {isLoading ? (
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
                      {litrosPorOperador.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No hay datos disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        litrosPorOperador
                          .sort((a, b) => b.litrosTotales - a.litrosTotales)
                          .map((item) => (
                            <TableRow key={item.choferId} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                  {item.choferNombre} {item.choferApellido}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {item.litrosTotales.toFixed(2)} L
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
                                  {item.vehiculosMasUsados
                                    .slice(0, 3)
                                    .map((v) => (
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
                          ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Reporte 4: Costos por Centro de Costos */}
      {tipoReporte === "costo-centro" && (
        <Grid container spacing={3}>
          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Costos por Centro de Costos / Unidad de Negocio
                </Typography>
                <TableContainer>
                  {isLoading ? (
                    <TableSkeleton rows={5} cols={7} />
                  ) : (
                    <Table>
                      <TableHead sx={{ bgcolor: "#f9fafb" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Centro de Costo
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
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
                            Vehículos
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {costosPorCentroCosto.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              No hay datos disponibles
                            </TableCell>
                          </TableRow>
                        ) : (
                          costosPorCentroCosto
                            .sort((a, b) => b.litrosTotales - a.litrosTotales)
                            .map((item) => (
                              <TableRow key={item.centroCostoId} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>
                                    {item.centroCostoNombre}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.centroCostoCodigo}
                                    size="small"
                                    sx={{ bgcolor: "#e2e8f0" }}
                                  />
                                </TableCell>
                                <TableCell>{item.centroCostoTipo}</TableCell>
                                <TableCell align="right">
                                  {item.litrosTotales.toFixed(2)} L
                                </TableCell>
                                <TableCell align="right">
                                  ${item.costoTotal.toLocaleString()}
                                </TableCell>
                                <TableCell align="right">
                                  {item.numeroEventos}
                                </TableCell>
                                <TableCell align="right">
                                  {item.vehiculosAsignados}
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Reporte 5: Análisis de Desvíos */}
      {tipoReporte === "desvios" && (
        <Grid container spacing={3}>
          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
          <Grid item xs={12}>
            {desvios.length === 0 && !isLoading ? (
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
                  {isLoading ? (
                    <TableSkeleton rows={5} cols={7} />
                  ) : (
                    <Table>
                      <TableHead sx={{ bgcolor: "#f9fafb" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Vehículo
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Litros
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Severidad
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Descripción
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {desvios.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              No se encontraron desvíos
                            </TableCell>
                          </TableRow>
                        ) : (
                          desvios.map((item) => (
                            <TableRow key={item.eventoId} hover>
                              <TableCell>
                                {new Date(item.fecha).toLocaleDateString(
                                  "es-AR"
                                )}
                              </TableCell>
                              <TableCell>{item.vehiculoPatente}</TableCell>
                              <TableCell>{item.tipoDesvio}</TableCell>
                              <TableCell align="right">
                                {item.litros.toFixed(2)} L
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.severidad}
                                  size="small"
                                  sx={{
                                    bgcolor:
                                      item.severidad === "alta"
                                        ? "#dc2626"
                                        : item.severidad === "media"
                                        ? "#f59e0b"
                                        : "#10b981",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                />
                              </TableCell>
                              <TableCell>{item.descripcion}</TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    item.resuelto ? "Resuelto" : "Pendiente"
                                  }
                                  size="small"
                                  sx={{
                                    bgcolor: item.resuelto
                                      ? "#10b981"
                                      : "#f59e0b",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </TableContainer>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Reporte 6: Ranking de Eficiencia */}
      {tipoReporte === "ranking-eficiencia" && (
        <Grid container spacing={3}>
          {/* @ts-expect-error - MUI v7 Grid type incompatibility */}
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
                {isLoading ? (
                  <TableSkeleton rows={5} cols={6} />
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
                          Eficiencia (km/L)
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
                                  item.posicion <= 3 ? "#10b981" : "#64748b",
                                color: "white",
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.vehiculoPatente}
                            </Typography>
                          </TableCell>
                          <TableCell>
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
                              {item.eficiencia.toFixed(2)} km/L
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {item.litrosTotales.toFixed(2)} L
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.tendencia}
                              size="small"
                              sx={{
                                bgcolor: "#f1f5f9",
                                fontWeight: 600,
                              }}
                            />
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
