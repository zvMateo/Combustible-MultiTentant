// src/components/pages/_S/Dashboard/Dashboard.tsx
import { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WarningIcon from "@mui/icons-material/Warning";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useQueryClient } from "@tanstack/react-query";

// Hooks
import {
  useEventosResumen,
  useEventosPendientes,
  useEventos,
  useVehiculos,
  useChoferes,
  eventosKeys,
  vehiculosKeys,
  choferesKeys,
} from "@/hooks/queries";
import { useUnidadActivaNombre, useUnidadActiva } from "@/stores/unidad.store";
import { useTenantStore } from "@/stores/tenant.store";

type PeriodoType = "semana" | "mes" | "trimestre" | "anio";

interface KPIData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  loading?: boolean;
}

interface ConsumoPorTipoData {
  tipo: string;
  litros: number;
  porcentaje: number;
}

const COLORS = ["#1E2C56", "#4A90E2", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

// Componente de KPI Card
function KPICard({ kpi }: { kpi: KPIData }) {
  if (kpi.loading) {
    return (
      <Card
        elevation={0}
        sx={{
          background: "white",
          border: "1px solid #f1f5f9",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 2, mb: 1.5 }} />
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="text" width={100} height={32} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        background: "white",
        border: "1px solid #f1f5f9",
        borderRadius: 2,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(30,44,86,0.1)",
          transform: "translateY(-2px)",
          borderColor: kpi.color + "40",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: kpi.bgColor,
              color: kpi.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {kpi.icon}
          </Box>
          <Chip
            icon={
              kpi.trend === "up" ? (
                <TrendingUpIcon sx={{ fontSize: 16 }} />
              ) : kpi.trend === "down" ? (
                <TrendingDownIcon sx={{ fontSize: 16 }} />
              ) : undefined
            }
            label={kpi.change}
            size="small"
            sx={{
              height: 24,
              bgcolor:
                kpi.trend === "up"
                  ? "#10b98118"
                  : kpi.trend === "down"
                  ? "#ef444418"
                  : "#64748b18",
              color:
                kpi.trend === "up"
                  ? "#10b981"
                  : kpi.trend === "down"
                  ? "#ef4444"
                  : "#64748b",
              fontWeight: 700,
              fontSize: "0.75rem",
              "& .MuiChip-icon": {
                color: "inherit",
                fontSize: 16,
              },
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 0.5,
            color: "#64748b",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {kpi.label}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#1e293b",
            letterSpacing: "-0.5px",
          }}
        >
          {kpi.value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<PeriodoType>("mes");
  const queryClient = useQueryClient();
  const unidadNombre = useUnidadActivaNombre();
  const unidadActiva = useUnidadActiva();
  const { user } = useTenantStore();

  // React Query hooks - automáticamente filtran por unidad seleccionada
  const { data: resumenData, isLoading: loadingResumen } = useEventosResumen();
  const { data: pendientesData, isLoading: loadingPendientes } = useEventosPendientes();
  const { data: eventosData, isLoading: loadingEventos } = useEventos({ limit: 100 });
  const { data: vehiculosData, isLoading: loadingVehiculos } = useVehiculos();
  const { data: choferesData, isLoading: loadingChoferes } = useChoferes();

  // Extraer datos
  const resumen = resumenData?.data;
  const pendientes = pendientesData?.data || [];
  const eventos = eventosData?.data || [];
  const vehiculos = vehiculosData?.data || [];
  const choferes = choferesData?.data || [];

  // Calcular consumo por tipo de vehículo
  const consumoPorTipo = useMemo((): ConsumoPorTipoData[] => {
    const porTipo: Record<string, number> = {};
    
    eventos.forEach((evento) => {
      const tipo = evento.vehiculoTipo || "Otro";
      porTipo[tipo] = (porTipo[tipo] || 0) + evento.litros;
    });

    const total = Object.values(porTipo).reduce((sum, litros) => sum + litros, 0);
    
    return Object.entries(porTipo)
      .map(([tipo, litros]) => ({
        tipo,
        litros,
        porcentaje: total > 0 ? Math.round((litros / total) * 100) : 0,
      }))
      .sort((a, b) => b.litros - a.litros)
      .slice(0, 4);
  }, [eventos]);

  // Calcular consumo por vehículo (top 5)
  const consumoPorVehiculo = useMemo(() => {
    const porVehiculo: Record<string, { patente: string; litros: number; eventos: number }> = {};
    
    eventos.forEach((evento) => {
      const patente = evento.vehiculoPatente;
      if (!porVehiculo[patente]) {
        porVehiculo[patente] = { patente, litros: 0, eventos: 0 };
      }
      porVehiculo[patente].litros += evento.litros;
      porVehiculo[patente].eventos += 1;
    });

    return Object.values(porVehiculo)
      .sort((a, b) => b.litros - a.litros)
      .slice(0, 5)
      .map((v) => ({
        vehiculo: v.patente,
        litros: v.litros,
        promedio: v.eventos > 0 ? Math.round(v.litros / v.eventos) : 0,
      }));
  }, [eventos]);

  // Generar datos de consumo mensual (mock mejorado basado en eventos)
  const consumoMensual = useMemo(() => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
    const baseMultiplier = resumen?.litrosTotales ? resumen.litrosTotales / 6 : 1000;
    
    return meses.map((mes, index) => ({
      mes,
      litros: Math.round(baseMultiplier * (0.8 + Math.random() * 0.4)),
      costo: Math.round(baseMultiplier * (0.8 + Math.random() * 0.4) * 850),
    }));
  }, [resumen?.litrosTotales]);

  // Construir KPIs dinámicos
  const kpis: KPIData[] = useMemo(() => [
    {
      label: "Consumo Total",
      value: resumen ? `${resumen.litrosTotales.toLocaleString()} L` : "0 L",
      change: resumen?.tendencia ? `+${resumen.tendencia}%` : "0%",
      trend: (resumen?.tendencia ?? 0) > 0 ? "up" : "neutral",
      icon: <LocalGasStationIcon sx={{ fontSize: 24 }} />,
      color: "#1E2C56",
      bgColor: "#1E2C5615",
      loading: loadingResumen,
    },
    {
      label: "Costo Total",
      value: resumen ? `$${resumen.costoTotal.toLocaleString()}` : "$0",
      change: resumen?.tendencia ? `+${Math.round(resumen.tendencia * 0.8)}%` : "0%",
      trend: (resumen?.tendencia ?? 0) > 0 ? "up" : "neutral",
      icon: <AttachMoneyIcon sx={{ fontSize: 24 }} />,
      color: "#10b981",
      bgColor: "#10b98115",
      loading: loadingResumen,
    },
    {
      label: "Vehículos Activos",
      value: vehiculos.filter((v) => v.activo && v.estado === "activo").length.toString(),
      change: `${vehiculos.length} total`,
      trend: "neutral",
      icon: <DirectionsCarIcon sx={{ fontSize: 24 }} />,
      color: "#4A90E2",
      bgColor: "#4A90E215",
      loading: loadingVehiculos,
    },
    {
      label: "Eventos Pendientes",
      value: pendientes.length.toString(),
      change: pendientes.length > 0 ? "Requieren validación" : "Todo al día",
      trend: pendientes.length > 0 ? "up" : "down",
      icon: <WarningIcon sx={{ fontSize: 24 }} />,
      color: "#f59e0b",
      bgColor: "#f59e0b15",
      loading: loadingPendientes,
    },
  ], [resumen, vehiculos, pendientes, loadingResumen, loadingVehiculos, loadingPendientes]);

  // KPIs secundarios
  const kpisSecundarios: KPIData[] = useMemo(() => [
    {
      label: "Choferes Activos",
      value: choferes.filter((c) => c.activo && c.estado === "activo").length.toString(),
      change: `${choferes.length} registrados`,
      trend: "neutral",
      icon: <PersonIcon sx={{ fontSize: 24 }} />,
      color: "#8b5cf6",
      bgColor: "#8b5cf615",
      loading: loadingChoferes,
    },
    {
      label: "Eventos Validados",
      value: resumen?.validados?.toString() || "0",
      change: `${resumen?.total || 0} total`,
      trend: "neutral",
      icon: <CheckCircleIcon sx={{ fontSize: 24 }} />,
      color: "#10b981",
      bgColor: "#10b98115",
      loading: loadingResumen,
    },
  ], [choferes, resumen, loadingChoferes, loadingResumen]);

  const handlePeriodo = (event: SelectChangeEvent<PeriodoType>) => {
    setPeriodo(event.target.value as PeriodoType);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: eventosKeys.all });
    queryClient.invalidateQueries({ queryKey: vehiculosKeys.all });
    queryClient.invalidateQueries({ queryKey: choferesKeys.all });
  };

  const isLoading = loadingResumen || loadingPendientes || loadingVehiculos;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: -4,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Dashboard
          </Typography>
          {unidadActiva && (
            <Chip
              label={`📍 ${unidadNombre}`}
              size="small"
              sx={{
                mt: 0.5,
                bgcolor: "#1E2C5615",
                color: "#1E2C56",
                fontWeight: 600,
              }}
            />
          )}
          {!unidadActiva && user?.role === "admin" && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Mostrando datos de todas las unidades
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Tooltip title="Actualizar datos">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={isLoading}
              sx={{
                bgcolor: "white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                "&:hover": { bgcolor: "#f8fafc" },
              }}
            >
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <FormControl
            size="small"
            sx={{
              minWidth: 160,
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              "& .MuiOutlinedInput-root": {
                height: 38,
                borderRadius: 2,
                "& fieldset": { borderColor: "#e2e8f0" },
                "&:hover fieldset": { borderColor: "#1E2C56" },
                "&.Mui-focused fieldset": { borderColor: "#1E2C56", borderWidth: 2 },
              },
            }}
          >
            <Select
              value={periodo}
              onChange={handlePeriodo}
              displayEmpty
              sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}
            >
              <MenuItem value="semana">Esta semana</MenuItem>
              <MenuItem value="mes">Este mes</MenuItem>
              <MenuItem value="trimestre">Trimestre</MenuItem>
              <MenuItem value="anio">Año</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Alerta si no hay datos */}
      {!isLoading && eventos.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay eventos registrados {unidadActiva ? `para ${unidadNombre}` : ""}.
          Los datos del dashboard se actualizarán cuando se registren cargas de combustible.
        </Alert>
      )}

      {/* KPIs Principales */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 2,
        }}
      >
        {kpis.map((kpi, index) => (
          <KPICard key={index} kpi={kpi} />
        ))}
      </Box>

      {/* KPIs Secundarios */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {kpisSecundarios.map((kpi, index) => (
          <KPICard key={index} kpi={kpi} />
        ))}
      </Box>

      {/* Gráficos */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* Consumo Mensual */}
        <Card
          elevation={0}
          sx={{
            background: "white",
            border: "1px solid #f1f5f9",
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 3, fontWeight: 700, color: "#1e293b", fontSize: "1.125rem" }}
            >
              Consumo y Costo Mensual
            </Typography>
            {loadingEventos ? (
              <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={consumoMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    stroke="#94a3b8"
                    style={{ fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#1E2C56"
                    style={{ fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    style={{ fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.98)",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: "0.875rem" }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="litros"
                    stroke="#1E2C56"
                    strokeWidth={3}
                    name="Litros"
                    dot={{ fill: "#1E2C56", r: 5, strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="costo"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Costo ($)"
                    dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Consumo por Tipo */}
        <Card
          elevation={0}
          sx={{
            background: "white",
            border: "1px solid #f1f5f9",
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 3, fontWeight: 700, color: "#1e293b", fontSize: "1.125rem" }}
            >
              Consumo por Tipo de Vehículo
            </Typography>
            {loadingEventos ? (
              <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
            ) : consumoPorTipo.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4, color: "#9ca3af" }}>
                <LocalGasStationIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography>Sin datos de consumo</Typography>
              </Box>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={consumoPorTipo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: ConsumoPorTipoData) => `${entry.porcentaje}%`}
                      outerRadius={70}
                      innerRadius={45}
                      dataKey="litros"
                      paddingAngle={2}
                    >
                      {consumoPorTipo.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.98)",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: "0.875rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <Box sx={{ mt: 2 }}>
                  {consumoPorTipo.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                        p: 1,
                        borderRadius: 1.5,
                        transition: "all 0.2s",
                        "&:hover": { bgcolor: "#f8fafc" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: COLORS[index % COLORS.length],
                          }}
                        />
                        <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                          {item.tipo}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} fontSize="0.875rem" sx={{ color: "#1e293b" }}>
                        {item.litros.toLocaleString()} L
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Consumo por Vehículo */}
      <Card
        elevation={0}
        sx={{
          background: "white",
          border: "1px solid #f1f5f9",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: 700, color: "#1e293b", fontSize: "1.125rem" }}
          >
            Top 5 Vehículos por Consumo
          </Typography>
          {loadingEventos ? (
            <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
          ) : consumoPorVehiculo.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, color: "#9ca3af" }}>
              <DirectionsCarIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography>Sin datos de vehículos</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={consumoPorVehiculo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="vehiculo"
                  stroke="#94a3b8"
                  style={{ fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.98)",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: "0.875rem",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: "0.875rem" }} />
                <Bar
                  dataKey="litros"
                  fill="#1E2C56"
                  name="Litros consumidos"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
                <Bar
                  dataKey="promedio"
                  fill="#4A90E2"
                  name="Promedio por carga"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
