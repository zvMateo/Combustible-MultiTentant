import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  AlertTriangle,
  //Calendar,
  //Camera,
  Car,
  CheckCircle2,
  Droplet,
  DollarSign,
  Fuel,
  //MapPin,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
// import {
//   APIProvider,
//   Map,
//   Marker,
//   InfoWindow,
// } from "@vis.gl/react-google-maps";

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
      <Card className="rounded-lg border border-slate-100 bg-white">
        <CardContent className="p-6">
          <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-2 h-8 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="rounded-lg border border-slate-100 bg-white transition-all duration-300 hover:-translate-y-0.5"
      style={{
        boxShadow: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(30,44,86,0.1)";
        (
          e.currentTarget as HTMLDivElement
        ).style.borderColor = `${kpi.color}40`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#f1f5f9";
      }}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: kpi.bgColor, color: kpi.color }}
          >
            {kpi.icon}
          </div>

          <Badge
            className="h-6 gap-1 rounded-md px-2 text-[11px] font-bold"
            style={{
              backgroundColor:
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
              borderColor: "transparent",
            }}
          >
            {kpi.trend === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : kpi.trend === "down" ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
            {kpi.change}
          </Badge>
        </div>

        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.5px] text-slate-500">
          {kpi.label}
        </div>
        <div className="text-2xl font-bold tracking-[-0.5px] text-slate-800">
          {kpi.value}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<PeriodoType>("mes");
  // const [selectedCarga, setSelectedCarga] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const unidadNombre = useUnidadActivaNombre();
  const unidadActiva = useUnidadActiva();
  const { user } = useAuthStore();

  // API Key de Google Maps (puede venir de variables de entorno)
  // const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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

  // const cargasConUbicacion = useMemo(() => {
  //   // Coordenadas base en Argentina (Buenos Aires)
  //   const baseLat = -34.6037;
  //   const baseLng = -58.3816;

  //   return loads.map((load) => {
  //     // Generar coordenadas aleatorias cerca de Buenos Aires
  //     const lat = baseLat + (Math.random() - 0.5) * 0.5; // ±0.25 grados (~27km)
  //     const lng = baseLng + (Math.random() - 0.5) * 0.5;

  //     return {
  //       id: load.id,
  //       lat,
  //       lng,
  //       nombre: (load as { nameResource?: string }).nameResource || "Carga",
  //       litros: (load as { totalLiters?: number }).totalLiters || 0,
  //       fecha: (load as { loadDate: string }).loadDate,
  //       recurso:
  //         (load as { resource?: { name?: string; identifier?: string } })
  //           .resource?.name ||
  //         (load as { resource?: { name?: string; identifier?: string } })
  //           .resource?.identifier ||
  //         "N/A",
  //     };
  //   });
  // }, [loads]);

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
        icon: <Fuel className="h-6 w-6" />,
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
        icon: <DollarSign className="h-6 w-6" />,
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
        icon: <Minus className="h-6 w-6" />,
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
        icon: <Droplet className="h-6 w-6" />,
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
        icon: <CheckCircle2 className="h-6 w-6" />,
        color: "#10b981",
        bgColor: "#10b98115",
        loading: loadingLoads,
      },
      {
        label: "Alertas Abiertas",
        value: outliers.length.toString(),
        change: outliers.length > 0 ? "Requieren atención" : "Sin alertas",
        trend: outliers.length > 0 ? "up" : "down",
        icon: <AlertTriangle className="h-6 w-6" />,
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
        icon: <User className="h-6 w-6" />,
        color: "#8b5cf6",
        bgColor: "#8b5cf615",
        loading: loadingChoferes,
      },
      {
        label: "Eventos Validados",
        value: resumen?.eventosValidados?.toString() || "0",
        change: `${resumen?.eventosTotales || 0} total`,
        trend: "neutral",
        icon: <CheckCircle2 className="h-6 w-6" />,
        color: "#10b981",
        bgColor: "#10b98115",
        loading: loadingLoads,
      },
    ],
    [drivers, resumen, loadingChoferes, loadingLoads]
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: loadLitersKeys.all });
    queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
    queryClient.invalidateQueries({ queryKey: driversKeys.all });
  };

  const isLoading = loadingLoads || loadingChoferes || loadingResources;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="-mt-8 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900">Dashboard</div>
          {unidadActiva && (
            <Badge
              className="mt-2 h-6 rounded-md border-0 px-2 text-[12px] font-semibold"
              style={{ backgroundColor: "#1E2C5615", color: "#1E2C56" }}
            >
              📍 {unidadNombre}
            </Badge>
          )}
          {!unidadActiva && user?.role === "admin" && (
            <div className="mt-2 text-sm text-slate-500">
              Mostrando datos de todas las unidades
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-9 w-9 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>Actualizar datos</TooltipContent>
          </Tooltip>

          <div className="min-w-[160px] rounded-lg bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
            <Select
              value={periodo}
              onValueChange={(v) => setPeriodo(v as PeriodoType)}
            >
              <SelectTrigger className="h-9 w-full border-slate-200">
                <SelectValue placeholder="Este mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="anio">Año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alerta si no hay datos */}
      {!isLoading && eventos.length === 0 && (
        <Alert className="mb-4 border-slate-200 bg-white">
          <AlertDescription>
            No hay eventos registrados{" "}
            {unidadActiva ? `para ${unidadNombre}` : ""}. Los datos del
            dashboard se actualizarán cuando se registren cargas de combustible.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs Principales - 6 KPIs en grid responsive */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* KPIs Secundarios */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpisSecundarios.map((kpi, index) => (
          <KPICard key={index} kpi={kpi} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Consumo Mensual */}
        <Card className="rounded-lg border border-slate-100 bg-white lg:col-span-7">
          <CardContent className="p-6">
            <div className="mb-6 text-lg font-bold text-slate-900">
              Consumo y Costo Mensual
            </div>
            {loadingLoads ? (
              <Skeleton className="h-[350px] w-full rounded-lg" />
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
        <Card className="rounded-lg border border-slate-100 bg-white lg:col-span-5">
          <CardContent className="p-6">
            <div className="mb-6 text-lg font-bold text-slate-900">
              Consumo por Tipo de Vehículo
            </div>
            {loadingLoads ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : consumoPorTipo.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Fuel className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <div className="text-sm font-medium">Sin datos de consumo</div>
              </div>
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

                <div className="mt-4">
                  {consumoPorTipo.map((item, index) => (
                    <div
                      key={index}
                      className="mb-2 flex items-center justify-between rounded-md p-2 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <div className="text-sm font-semibold text-slate-700">
                          {item.tipo}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {item.litros.toLocaleString()} L
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consumo por Vehículo */}
      <Card className="rounded-lg border border-slate-100 bg-white">
        <CardContent className="p-6">
          <div className="mb-6 text-lg font-bold text-slate-900">
            Top 5 Vehículos por Consumo
          </div>
          {loadingLoads ? (
            <Skeleton className="h-[320px] w-full rounded-lg" />
          ) : consumoPorVehiculo.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Car className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <div className="text-sm font-medium">Sin datos de vehículos</div>
            </div>
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

      {/* Mapa de Cargas y Outliers
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-lg border border-slate-100 bg-white">
          <CardContent className="p-6">
            <div className="mb-6 text-lg font-bold text-slate-900">Mapa de Cargas</div>

            {loadingLoads ? (
              <Skeleton className="h-[400px] w-full rounded-lg" />
            ) : cargasConUbicacion.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <MapPin className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <div className="text-sm font-medium">No hay cargas con ubicación registrada</div>
              </div>
            ) : !googleMapsApiKey ? (
              <div className="flex h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
                <div className="p-6 text-center">
                  <MapPin className="mx-auto mb-3 h-16 w-16 text-slate-400" />
                  <div className="mb-1 text-base font-semibold text-slate-600">
                    Configuración Requerida
                  </div>
                  <div className="mb-3 text-sm text-slate-500">
                    Para mostrar el mapa, configura VITE_GOOGLE_MAPS_API_KEY en tu archivo .env
                  </div>
                  <div className="text-xs text-slate-400">
                    {cargasConUbicacion.length} carga
                    {cargasConUbicacion.length !== 1 ? "s" : ""} con ubicación mockeada
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] overflow-hidden rounded-lg border border-slate-200">
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
                        const carga = cargasConUbicacion.find((c) => c.id === selectedCarga);
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
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-100 bg-white">
          <CardContent className="p-6">
            <div className="mb-6 text-lg font-bold text-slate-900">Anomalías Detectadas</div>

            {loadingLoads ? (
              <Skeleton className="h-[400px] w-full rounded-lg" />
            ) : outliers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-emerald-500/60" />
                <div className="text-sm font-medium">No se detectaron anomalías</div>
                <div className="mt-2 text-xs text-slate-400">
                  Todas las cargas están dentro de los rangos normales
                </div>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-1">
                {outliers.map((outlier) => {
                  const sevStyles =
                    outlier.severidad === "alta"
                      ? { bg: "#fee2e215", badgeBg: "#ef444415", badgeText: "#ef4444" }
                      : outlier.severidad === "media"
                        ? { bg: "#fef3c715", badgeBg: "#f59e0b15", badgeText: "#f59e0b" }
                        : { bg: "#f0fdf415", badgeBg: "#10b98115", badgeText: "#10b981" };

                  return (
                    <Card
                      key={outlier.id}
                      className="mb-4 rounded-lg border border-slate-200"
                      style={{ backgroundColor: sevStyles.bg }}
                    >
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {outlier.tipo}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(outlier.fecha).toLocaleDateString()}
                            </div>
                          </div>

                          <Badge
                            className="h-6 rounded-md border-0 px-2 text-xs font-semibold capitalize"
                            style={{
                              backgroundColor: sevStyles.badgeBg,
                              color: sevStyles.badgeText,
                            }}
                          >
                            {outlier.severidad}
                          </Badge>
                        </div>

                        <div className="text-sm text-slate-700">
                          <strong>Recurso:</strong> {outlier.recurso}
                        </div>
                        <div className="text-sm text-slate-700">
                          <strong>Litros:</strong> {outlier.litros.toLocaleString()} L
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div> */}

      {/* Trazabilidad de Fotos
      <Card className="rounded-lg border border-slate-100 bg-white">
        <CardContent className="p-6">
          <div className="mb-6 text-lg font-bold text-slate-900">
            Trazabilidad de Evidencias
          </div>
          {loadingLoads ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : loads.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Camera className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <div className="text-sm font-medium">
                No hay evidencias registradas
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-slate-500">
                {loads.length} carga{loads.length !== 1 ? "s" : ""} con
                evidencias disponibles
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                      className="overflow-hidden rounded-lg border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    >
                      <div className="relative flex h-[120px] items-center justify-center bg-slate-50">
                        <Camera className="h-12 w-12 text-slate-300" />
                        <Badge
                          className="absolute right-2 top-2 rounded-md border-0 px-2 text-[10px] font-semibold"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.9)",
                            color: "#334155",
                          }}
                        >
                          {loadData.nameResource || "N/A"}
                        </Badge>
                      </div>

                      <CardContent className="p-4">
                        <div className="mb-1 text-xs text-slate-500">
                          {new Date(loadData.loadDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm font-semibold text-slate-700">
                          {loadData.totalLiters || 0} L
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {loads.length > 8 && (
                <div className="mt-4 text-center text-sm text-slate-500">
                  Y {loads.length - 8} carga{loads.length - 8 !== 1 ? "s" : ""}{" "}
                  más...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}
