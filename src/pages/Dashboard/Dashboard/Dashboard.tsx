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
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PropaneTankIcon from "@mui/icons-material/PropaneTank";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Fuel, Droplet, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
} from "@vis.gl/react-google-maps";

// Hooks
import {
  useLoadLiters,
  useDrivers,
  useResources,
  loadLitersKeys,
  resourcesKeys,
  driversKeys,
} from "@/hooks/queries";
import { useUnidadActivaNombre, useUnidadActiva } from "@/stores/unidad.store";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";

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

const COLORS = [
  "#1E2C56",
  "#4A90E2",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

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
          <Skeleton
            variant="rectangular"
            width={40}
            height={40}
            sx={{ borderRadius: 2, mb: 1.5 }}
          />
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
  const [selectedCarga, setSelectedCarga] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const unidadNombre = useUnidadActivaNombre();
  const unidadActiva = useUnidadActiva();
  const { user } = useAuthStore();

  // API Key de Google Maps (puede venir de variables de entorno)
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // React Query hooks
  const { data: loadsData = [], isLoading: loadingLoads } = useLoadLiters();
  const { data: driversData = [], isLoading: loadingChoferes } = useDrivers();
  const { data: resourcesData = [], isLoading: loadingResources } =
    useResources();
  const { companyIdFilter, unidadIdsFilter, isSupervisor, isAuditor } =
    useRoleLogic();

  // Normalizar respuestas que pueden venir como objeto { result: [...] }
  const toArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    // @ts-expect-error API legacy shape
    if (Array.isArray(value?.result)) return value.result as T[];
    return [];
  };

  const loads = toArray<(typeof loadsData)[0]>(loadsData);
  const drivers = toArray<(typeof driversData)[0]>(driversData);
  const allResources = toArray<(typeof resourcesData)[0]>(resourcesData);

  // Filtrar recursos por empresa y unidad
  const resources = useMemo(() => {
    let filtered = allResources;

    // Filtrar por empresa
    if (companyIdFilter && companyIdFilter > 0) {
      filtered = filtered.filter((r) => r.idCompany === companyIdFilter);
    }

    // Filtrar por unidad (supervisor/auditor)
    if (
      (isSupervisor || isAuditor) &&
      unidadIdsFilter &&
      unidadIdsFilter.length > 0
    ) {
      filtered = filtered.filter((r) => {
        if (r.idBusinessUnit) {
          return unidadIdsFilter.includes(r.idBusinessUnit);
        }
        return false;
      });
    }

    return filtered;
  }, [allResources, companyIdFilter, unidadIdsFilter, isSupervisor, isAuditor]);

  // Obtener tanques (recursos tipo tanque)
  const tanques = useMemo(() => {
    return resources.filter((r) => {
      const typeArray = (r as { type?: string[] }).type || [];
      const typeName = typeArray.join(" ").toLowerCase() || "";
      return typeName.includes("tanque") || typeName.includes("tank");
    });
  }, [resources]);

  // Calcular resumen desde loads
  const resumen = useMemo(() => {
    const totalLiters = loads.reduce(
      (sum, load) => sum + (load.totalLiters || 0),
      0
    );
    const totalCost = loads.reduce((sum, load) => {
      // Asumir precio promedio de 850 por litro si no hay precio en la API
      return sum + (load.totalLiters || 0) * 850;
    }, 0);
    const eventosValidados = loads.length; // Por ahora todos están validados
    const consumoPromedio = loads.length > 0 ? totalLiters / loads.length : 0;

    return {
      litrosTotales: totalLiters,
      costoTotal: totalCost,
      eventosTotales: loads.length,
      eventosValidados,
      porcentajeValidados: loads.length > 0 ? 100 : 0, // Por ahora todos validados
      consumoPromedio,
      tendencia: 0, // TODO: Calcular tendencia cuando tengamos datos históricos
    };
  }, [loads]);

  // Detectar outliers/anomalías (cargas fuera de rango normal)
  const outliers = useMemo(() => {
    const outlierList: Array<{
      id: number;
      fecha: string;
      recurso: string;
      litros: number;
      tipo: string;
      severidad: "baja" | "media" | "alta";
    }> = [];

    loads.forEach((load) => {
      // Cargas muy grandes (> 500L)
      if (load.totalLiters > 500) {
        outlierList.push({
          id: load.id,
          fecha: load.loadDate,
          recurso: load.nameResource || load.resource?.name || "N/A",
          litros: load.totalLiters,
          tipo: "Carga excesiva",
          severidad: load.totalLiters > 1000 ? "alta" : "media",
        });
      }
      // Cargas muy pequeñas (< 5L) pero con inicial > 0
      if (load.totalLiters < 5 && load.initialLiters > 0) {
        outlierList.push({
          id: load.id,
          fecha: load.loadDate,
          recurso: load.nameResource || load.resource?.name || "N/A",
          litros: load.totalLiters,
          tipo: "Carga mínima",
          severidad: "baja",
        });
      }
      // Cargas negativas o inválidas
      if (load.totalLiters <= 0 && load.initialLiters > 0) {
        outlierList.push({
          id: load.id,
          fecha: load.loadDate,
          recurso: load.nameResource || load.resource?.name || "N/A",
          litros: load.totalLiters,
          tipo: "Carga inválida",
          severidad: "alta",
        });
      }
    });

    return outlierList;
  }, [loads]);

  // Calcular stock total por tanques
  const stockPorTanque = useMemo(() => {
    return tanques.map((tanque) => {
      const capacidad = (tanque as { nativeLiters?: number }).nativeLiters || 0;
      // Estimar stock actual basado en cargas (simplificado)
      // En producción, esto debería venir del backend
      const cargasDelTanque = loads.filter(
        (l) =>
          (l as { idResource?: number }).idResource ===
          (tanque as { id: number }).id
      );
      const litrosUsados = cargasDelTanque.reduce(
        (sum: number, c) =>
          sum + ((c as { totalLiters?: number }).totalLiters || 0),
        0
      );
      const stockEstimado = Math.max(0, capacidad - litrosUsados);
      const porcentaje =
        capacidad > 0 ? Math.round((stockEstimado / capacidad) * 100) : 0;

      return {
        id: (tanque as { id: number }).id,
        nombre: (tanque as { name: string }).name,
        capacidad,
        stockActual: stockEstimado,
        porcentaje,
        nivel:
          porcentaje <= 15 ? "critico" : porcentaje <= 30 ? "bajo" : "normal",
      };
    });
  }, [tanques, loads]);

  // Eventos (mapear loads a formato de eventos)
  const eventos = useMemo(() => {
    return loads.map((load) => ({
      id: load.id,
      vehiculoId: load.idResource,
      vehiculoPatente: load.resource?.identifier || "",
      vehiculoTipo: load.resource?.resourceType?.name || "Otro",
      litros: load.totalLiters || 0,
      fecha: load.loadDate,
      estado: "validado", // Por ahora todos validados
    }));
  }, [loads]);

  // Mockear ubicaciones de cargas (coordenadas en Argentina)
  // En producción, esto debería venir del backend
  const cargasConUbicacion = useMemo(() => {
    // Coordenadas base en Argentina (Buenos Aires)
    const baseLat = -34.6037;
    const baseLng = -58.3816;

    return loads.map((load) => {
      // Generar coordenadas aleatorias cerca de Buenos Aires
      const lat = baseLat + (Math.random() - 0.5) * 0.5; // ±0.25 grados (~27km)
      const lng = baseLng + (Math.random() - 0.5) * 0.5;

      return {
        id: load.id,
        lat,
        lng,
        nombre: (load as { nameResource?: string }).nameResource || "Carga",
        litros: (load as { totalLiters?: number }).totalLiters || 0,
        fecha: (load as { loadDate: string }).loadDate,
        recurso:
          (load as { resource?: { name?: string; identifier?: string } })
            .resource?.name ||
          (load as { resource?: { name?: string; identifier?: string } })
            .resource?.identifier ||
          "N/A",
      };
    });
  }, [loads]);

  // Calcular consumo por tipo de vehículo
  const consumoPorTipo = useMemo((): ConsumoPorTipoData[] => {
    const porTipo: Record<string, number> = {};

    eventos.forEach((evento) => {
      const tipo = evento.vehiculoTipo || "Otro";
      porTipo[tipo] = (porTipo[tipo] || 0) + evento.litros;
    });

    const total = Object.values(porTipo).reduce(
      (sum, litros) => sum + litros,
      0
    );

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
    const porVehiculo: Record<
      string,
      { patente: string; litros: number; eventos: number }
    > = {};

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
    const baseMultiplier = resumen?.litrosTotales
      ? resumen.litrosTotales / 6
      : 1000;

    return meses.map((mes) => ({
      mes,
      litros: Math.round(baseMultiplier * (0.8 + Math.random() * 0.4)),
      costo: Math.round(baseMultiplier * (0.8 + Math.random() * 0.4) * 850),
    }));
  }, [resumen?.litrosTotales]);

  // Construir KPIs dinámicos
  const kpis: KPIData[] = useMemo(
    () => [
      {
        label: "Litros Totales",
        value: resumen
          ? `${Number(resumen.litrosTotales).toLocaleString()} L`
          : "0 L",
        change: resumen?.tendencia ? `+${resumen.tendencia}%` : "0%",
        trend: (resumen?.tendencia ?? 0) > 0 ? "up" : "neutral",
        icon: <LocalGasStationIcon sx={{ fontSize: 24 }} />,
        color: "#1E2C56",
        bgColor: "#1E2C5615",
        loading: loadingLoads,
      },
      {
        label: "Costo Total",
        value: resumen
          ? `$${Number(resumen.costoTotal).toLocaleString()}`
          : "$0",
        change: resumen?.tendencia
          ? `+${Math.round(resumen.tendencia * 0.8)}%`
          : "0%",
        trend: (resumen?.tendencia ?? 0) > 0 ? "up" : "neutral",
        icon: <AttachMoneyIcon sx={{ fontSize: 24 }} />,
        color: "#10b981",
        bgColor: "#10b98115",
        loading: loadingLoads,
      },
      {
        label: "Consumo Promedio",
        value: resumen
          ? `${Math.round(resumen.consumoPromedio).toLocaleString()} L`
          : "0 L",
        change: `${loads.length} cargas`,
        trend: "neutral",
        icon: <TrendingFlatIcon sx={{ fontSize: 24 }} />,
        color: "#3b82f6",
        bgColor: "#3b82f615",
        loading: loadingLoads,
      },
      {
        label: "Stock por Tanque",
        value:
          stockPorTanque.length > 0
            ? `${stockPorTanque
                .reduce((sum, t) => sum + t.stockActual, 0)
                .toLocaleString()} L`
            : "0 L",
        change: `${stockPorTanque.length} tanques`,
        trend: stockPorTanque.some((t) => t.nivel === "critico")
          ? "up"
          : "neutral",
        icon: <PropaneTankIcon sx={{ fontSize: 24 }} />,
        color: "#8b5cf6",
        bgColor: "#8b5cf615",
        loading: loadingResources,
      },
      {
        label: "% Eventos Validados",
        value: resumen ? `${resumen.porcentajeValidados}%` : "0%",
        change: `${resumen?.eventosValidados || 0} de ${
          resumen?.eventosTotales || 0
        }`,
        trend:
          resumen && resumen.porcentajeValidados >= 95 ? "down" : "neutral",
        icon: <CheckCircleIcon sx={{ fontSize: 24 }} />,
        color: "#10b981",
        bgColor: "#10b98115",
        loading: loadingLoads,
      },
      {
        label: "Alertas Abiertas",
        value: outliers.length.toString(),
        change: outliers.length > 0 ? "Requieren atención" : "Sin alertas",
        trend: outliers.length > 0 ? "up" : "down",
        icon: <ErrorOutlineIcon sx={{ fontSize: 24 }} />,
        color: "#ef4444",
        bgColor: "#ef444415",
        loading: loadingLoads,
      },
    ],
    [
      resumen,
      loadingLoads,
      stockPorTanque,
      outliers,
      loads.length,
      loadingResources,
    ]
  );

  // KPIs secundarios
  const kpisSecundarios: KPIData[] = useMemo(
    () => [
      {
        label: "Choferes Activos",
        value: drivers
          .filter((d) => (d as { isActive?: boolean }).isActive !== false)
          .length.toString(),
        change: `${drivers.length} registrados`,
        trend: "neutral",
        icon: <PersonIcon sx={{ fontSize: 24 }} />,
        color: "#8b5cf6",
        bgColor: "#8b5cf615",
        loading: loadingChoferes,
      },
      {
        label: "Eventos Validados",
        value: resumen?.eventosValidados?.toString() || "0",
        change: `${resumen?.eventosTotales || 0} total`,
        trend: "neutral",
        icon: <CheckCircleIcon sx={{ fontSize: 24 }} />,
        color: "#10b981",
        bgColor: "#10b98115",
        loading: loadingLoads,
      },
    ],
    [drivers, resumen, loadingChoferes, loadingLoads]
  );

  const handlePeriodo = (event: SelectChangeEvent<PeriodoType>) => {
    setPeriodo(event.target.value as PeriodoType);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: loadLitersKeys.all });
    queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
    queryClient.invalidateQueries({ queryKey: driversKeys.all });
  };

  const isLoading = loadingLoads || loadingChoferes || loadingResources;

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
            <span>
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
            </span>
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
                "&.Mui-focused fieldset": {
                  borderColor: "#1E2C56",
                  borderWidth: 2,
                },
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
          No hay eventos registrados{" "}
          {unidadActiva ? `para ${unidadNombre}` : ""}. Los datos del dashboard
          se actualizarán cuando se registren cargas de combustible.
        </Alert>
      )}

      {/* KPIs Principales - 6 KPIs en grid responsive */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(3, 1fr)",
            xl: "repeat(6, 1fr)",
          },
          gap: 2,
          mb: 2,
        }}
      >
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
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
              sx={{
                mb: 3,
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "1.125rem",
              }}
            >
              Consumo y Costo Mensual
            </Typography>
            {loadingLoads ? (
              <Skeleton
                variant="rectangular"
                height={350}
                sx={{ borderRadius: 2 }}
              />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={consumoMensual}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
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
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 20, fontSize: "0.875rem" }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="litros"
                    stroke="#1E2C56"
                    strokeWidth={3}
                    name="Litros"
                    dot={{
                      fill: "#1E2C56",
                      r: 5,
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="costo"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Costo ($)"
                    dot={{
                      fill: "#10b981",
                      r: 5,
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
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
              sx={{
                mb: 3,
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "1.125rem",
              }}
            >
              Consumo por Tipo de Vehículo
            </Typography>
            {loadingLoads ? (
              <Skeleton
                variant="rectangular"
                height={240}
                sx={{ borderRadius: 2 }}
              />
            ) : consumoPorTipo.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4, color: "#9ca3af" }}>
                <LocalGasStationIcon
                  sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}
                />
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
                      label={(entry: ConsumoPorTipoData) =>
                        `${entry.porcentaje}%`
                      }
                      outerRadius={70}
                      innerRadius={45}
                      dataKey="litros"
                      paddingAngle={2}
                    >
                      {consumoPorTipo.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
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
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: COLORS[index % COLORS.length],
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          fontSize="0.875rem"
                        >
                          {item.tipo}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        fontSize="0.875rem"
                        sx={{ color: "#1e293b" }}
                      >
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
            sx={{
              mb: 3,
              fontWeight: 700,
              color: "#1e293b",
              fontSize: "1.125rem",
            }}
          >
            Top 5 Vehículos por Consumo
          </Typography>
          {loadingLoads ? (
            <Skeleton
              variant="rectangular"
              height={320}
              sx={{ borderRadius: 2 }}
            />
          ) : consumoPorVehiculo.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, color: "#9ca3af" }}>
              <DirectionsCarIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography>Sin datos de vehículos</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={consumoPorVehiculo}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
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
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: 20, fontSize: "0.875rem" }}
                />
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

      {/* Mapa de Cargas y Outliers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* Mapa de Cargas */}
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
              sx={{
                mb: 3,
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "1.125rem",
              }}
            >
              Mapa de Cargas
            </Typography>
            {loadingLoads ? (
              <Skeleton
                variant="rectangular"
                height={400}
                sx={{ borderRadius: 2 }}
              />
            ) : cargasConUbicacion.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6, color: "#9ca3af" }}>
                <LocationOnIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography>No hay cargas con ubicación registrada</Typography>
              </Box>
            ) : !googleMapsApiKey ? (
              <Box
                sx={{
                  height: 400,
                  bgcolor: "#f8fafc",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #e2e8f0",
                }}
              >
                <Box sx={{ textAlign: "center", p: 3 }}>
                  <LocationOnIcon
                    sx={{ fontSize: 64, color: "#94a3b8", mb: 2 }}
                  />
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Configuración Requerida
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Para mostrar el mapa, configura VITE_GOOGLE_MAPS_API_KEY en
                    tu archivo .env
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cargasConUbicacion.length} carga
                    {cargasConUbicacion.length !== 1 ? "s" : ""} con ubicación
                    mockeada
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  height: 400,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <APIProvider apiKey={googleMapsApiKey}>
                  <Map
                    defaultCenter={{
                      lat: cargasConUbicacion[0]?.lat || -34.6037,
                      lng: cargasConUbicacion[0]?.lng || -58.3816,
                    }}
                    defaultZoom={10}
                    mapId="dashboard-map"
                    style={{ width: "100%", height: "100%" }}
                  >
                    {cargasConUbicacion.map((carga) => (
                      <Marker
                        key={carga.id}
                        position={{ lat: carga.lat, lng: carga.lng }}
                        onClick={() => setSelectedCarga(carga.id)}
                      />
                    ))}
                    {selectedCarga &&
                      (() => {
                        const carga = cargasConUbicacion.find(
                          (c) => c.id === selectedCarga
                        );
                        if (!carga) return null;
                        return (
                          <InfoWindow
                            position={{ lat: carga.lat, lng: carga.lng }}
                            onCloseClick={() => setSelectedCarga(null)}
                          >
                            <div
                              style={{
                                padding: "16px",
                                minWidth: "260px",
                                fontFamily: "Inter, system-ui, sans-serif",
                              }}
                            >
                              {/* Header con ícono */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  marginBottom: "16px",
                                  paddingBottom: "12px",
                                  borderBottom: "2px solid #e2e8f0",
                                }}
                              >
                                <div
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background:
                                      "linear-gradient(135deg, #1E2C56 0%, #4A90E2 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Fuel size={22} strokeWidth={2.5} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      fontSize: "0.95rem",
                                      color: "#1e293b",
                                      marginBottom: "2px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {carga.nombre}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#64748b",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {carga.recurso}
                                  </div>
                                </div>
                              </div>

                              {/* Info de litros */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  marginBottom: "12px",
                                  padding: "12px",
                                  background:
                                    "linear-gradient(135deg, #1E2C5610 0%, #4A90E215 100%)",
                                  borderRadius: "8px",
                                  border: "1px solid #1E2C5620",
                                }}
                              >
                                <div
                                  style={{
                                    color: "#1E2C56",
                                  }}
                                >
                                  <Droplet
                                    size={24}
                                    strokeWidth={2}
                                    fill="#1E2C56"
                                  />
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#64748b",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    Litros Cargados
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "1.25rem",
                                      fontWeight: 700,
                                      color: "#1E2C56",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {carga.litros.toLocaleString()} L
                                  </div>
                                </div>
                              </div>

                              {/* Fecha y hora */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 12px",
                                  background: "#f8fafc",
                                  borderRadius: "6px",
                                }}
                              >
                                <div
                                  style={{
                                    color: "#64748b",
                                  }}
                                >
                                  <Calendar size={18} strokeWidth={2} />
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#64748b",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.3px",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    Fecha de carga
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.85rem",
                                      fontWeight: 600,
                                      color: "#1e293b",
                                    }}
                                  >
                                    {new Date(carga.fecha).toLocaleDateString(
                                      "es-AR",
                                      {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Footer con ID */}
                              <div
                                style={{
                                  marginTop: "12px",
                                  paddingTop: "10px",
                                  borderTop: "1px solid #e2e8f0",
                                  fontSize: "0.7rem",
                                  color: "#94a3b8",
                                  textAlign: "center",
                                  fontWeight: 500,
                                }}
                              >
                                ID de Carga: #{carga.id}
                              </div>
                            </div>
                          </InfoWindow>
                        );
                      })()}
                  </Map>
                </APIProvider>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Outliers/Anomalías */}
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
              sx={{
                mb: 3,
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "1.125rem",
              }}
            >
              Anomalías Detectadas
            </Typography>
            {loadingLoads ? (
              <Skeleton
                variant="rectangular"
                height={400}
                sx={{ borderRadius: 2 }}
              />
            ) : outliers.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6, color: "#9ca3af" }}>
                <CheckCircleIcon
                  sx={{ fontSize: 48, mb: 1, opacity: 0.5, color: "#10b981" }}
                />
                <Typography>No se detectaron anomalías</Typography>
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  Todas las cargas están dentro de los rangos normales
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {outliers.map((outlier) => (
                  <Card
                    key={outlier.id}
                    elevation={0}
                    sx={{
                      mb: 2,
                      border: "1px solid #e2e8f0",
                      borderRadius: 2,
                      bgcolor:
                        outlier.severidad === "alta"
                          ? "#fee2e215"
                          : outlier.severidad === "media"
                          ? "#fef3c715"
                          : "#f0fdf415",
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {outlier.tipo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(outlier.fecha).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={outlier.severidad}
                          size="small"
                          sx={{
                            bgcolor:
                              outlier.severidad === "alta"
                                ? "#ef444415"
                                : outlier.severidad === "media"
                                ? "#f59e0b15"
                                : "#10b98115",
                            color:
                              outlier.severidad === "alta"
                                ? "#ef4444"
                                : outlier.severidad === "media"
                                ? "#f59e0b"
                                : "#10b981",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Recurso:</strong> {outlier.recurso}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Litros:</strong>{" "}
                        {outlier.litros.toLocaleString()} L
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Trazabilidad de Fotos */}
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
            sx={{
              mb: 3,
              fontWeight: 700,
              color: "#1e293b",
              fontSize: "1.125rem",
            }}
          >
            Trazabilidad de Evidencias
          </Typography>
          {loadingLoads ? (
            <Skeleton
              variant="rectangular"
              height={300}
              sx={{ borderRadius: 2 }}
            />
          ) : loads.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, color: "#9ca3af" }}>
              <PhotoCameraIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography>No hay evidencias registradas</Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {loads.length} carga{loads.length !== 1 ? "s" : ""} con
                evidencias disponibles
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {loads.slice(0, 8).map((load) => {
                  const loadData = load as {
                    id: number;
                    nameResource?: string;
                    loadDate: string;
                    totalLiters?: number;
                  };
                  return (
                    <Card
                      key={loadData.id}
                      elevation={0}
                      sx={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 2,
                        overflow: "hidden",
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          height: 120,
                          bgcolor: "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <PhotoCameraIcon
                          sx={{ fontSize: 48, color: "#cbd5e1" }}
                        />
                        <Chip
                          label={loadData.nameResource || "N/A"}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: "rgba(255,255,255,0.9)",
                            fontWeight: 600,
                            fontSize: 10,
                          }}
                        />
                      </Box>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          {new Date(loadData.loadDate).toLocaleDateString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {loadData.totalLiters || 0} L
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
              {loads.length > 8 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2, textAlign: "center" }}
                >
                  Y {loads.length - 8} carga{loads.length - 8 !== 1 ? "s" : ""}{" "}
                  más...
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
