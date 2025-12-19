import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Fuel, RefreshCw, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useLoadLitersScoped,
  useDrivers,
  loadLitersKeys,
  resourcesKeys,
  driversKeys,
} from "@/hooks/queries";
import { useUnidadActivaNombre, useUnidadActiva } from "@/stores/unidad.store";
import type { Driver, LoadLiters } from "@/types/api.types";

const COLORS = [
  "#1E2C56",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

type PeriodoType = "semana" | "mes" | "anio";
type TrendType = "up" | "down" | "neutral";

type KPICardProps = {
  label: string;
  value: string | number;
  change: string;
  trend: TrendType;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  color: string;
  loading?: boolean;
};

function KPICard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  color,
  loading,
}: KPICardProps) {
  if (loading) return <Skeleton className="h-28 w-full rounded-3xl" />;

  return (
    <div className="group bg-card rounded-3xl p-5 border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {value}
          </p>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
      {change && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`text-xs font-medium ${
              trend === "up"
                ? "text-emerald-600"
                : trend === "down"
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : ""}
            {change}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<PeriodoType>("mes");
  const queryClient = useQueryClient();
  const unidadNombre = useUnidadActivaNombre();
  const unidadActiva = useUnidadActiva();

  const { data: loadsData, isLoading: loadingLoads } = useLoadLitersScoped();
  const { data: driversData, isLoading: loadingChoferes } = useDrivers();

  const toArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === "object") {
      const maybe = value as { result?: unknown };
      if (Array.isArray(maybe.result)) return maybe.result as T[];
    }
    return [];
  };
  const loads = useMemo<LoadLiters[]>(
    () => toArray<LoadLiters>(loadsData),
    [loadsData]
  );
  const drivers = useMemo<Driver[]>(
    () => toArray<Driver>(driversData),
    [driversData]
  );

  // Cálculos de Resumen
  const totalLiters = useMemo(
    () => loads.reduce((sum, l) => sum + (l.totalLiters || 0), 0),
    [loads]
  );

  const consumoPorTipo = useMemo(() => {
    const map: Record<string, number> = {};
    loads.forEach((l) => {
      const tipo = l.resource?.resourceType?.name || "Otros";
      map[tipo] = (map[tipo] || 0) + (l.totalLiters || 0);
    });
    return Object.entries(map)
      .map(([tipo, litros]) => ({ tipo, litros }))
      .sort((a, b) => b.litros - a.litros);
  }, [loads]);

  const consumoMensual = [
    { mes: "Ene", litros: 4500, costo: 3800000 },
    { mes: "Feb", litros: 5200, costo: 4400000 },
    { mes: "Mar", litros: 4800, costo: 4100000 },
    { mes: "Abr", litros: 6100, costo: 5200000 },
    { mes: "May", litros: 5500, costo: 4700000 },
    { mes: "Jun", litros: 5900, costo: 5015000 },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: loadLitersKeys.all });
    queryClient.invalidateQueries({ queryKey: resourcesKeys.all });
    queryClient.invalidateQueries({ queryKey: driversKeys.all });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in px-6 pt-4 pb-6">
        {/* Header Dashboard */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unidadActiva
                ? `Visualizando ${unidadNombre}`
                : "Resumen consolidado de operaciones"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw
                className={`h-4 w-4 ${loadingLoads ? "animate-spin" : ""}`}
              />
            </Button>
            <Select
              value={periodo}
              onValueChange={(value) => setPeriodo(value as PeriodoType)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
                <SelectItem value="anio">Este año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs Principales - Estilo Figma */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <KPICard
            label="Litros Totales"
            value={`${totalLiters.toLocaleString()} L`}
            change="12%"
            trend="up"
            icon={Fuel}
            color="#1E2C56"
            loading={loadingLoads}
          />
          <KPICard
            label="Costo Total"
            value={`$ ${(totalLiters * 850).toLocaleString()}`}
            change="8%"
            trend="up"
            icon={DollarSign}
            color="#10b981"
            loading={loadingLoads}
          />
          <KPICard
            label="Choferes"
            value={drivers.length}
            change="Estable"
            trend="neutral"
            icon={User}
            color="#8b5cf6"
            loading={loadingChoferes}
          />
        </div>

        {/* Gráficos - Estilo Figma */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Statistics - Line Chart Principal */}
          <Card className="lg:col-span-8">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">
                  Estadísticas
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Evolución del consumo de combustible
                </p>
              </div>
              <Select defaultValue="mes">
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                  <SelectItem value="anio">Este año</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={consumoMensual}
                    margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorLitros"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#1E2C56"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1E2C56"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="mes"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      width={50}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
                        padding: "12px 16px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="litros"
                      stroke="#1E2C56"
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: "#1E2C56",
                        strokeWidth: 3,
                        stroke: "#fff",
                      }}
                      activeDot={{
                        r: 7,
                        fill: "#1E2C56",
                        strokeWidth: 3,
                        stroke: "#fff",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Consumo por Tipo - Donut Chart */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">
                Distribución
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Consumo por tipo de recurso
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={consumoPorTipo}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="litros"
                    >
                      {consumoPorTipo.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {consumoPorTipo.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[i] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.tipo}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {item.litros.toLocaleString()} L
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
