import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Fuel,
  Minus,
  RefreshCw,
  User,
} from "lucide-react";
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
  if (loading) return <Skeleton className="h-36 w-full rounded-2xl" />;

  return (
    <Card className="group border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${color}12`, color: color }}
          >
            <Icon size={24} strokeWidth={2} />
          </div>
          <Badge
            variant="outline"
            className="border-none font-bold text-[10px] px-2.5 py-1 rounded-lg"
            style={{
              backgroundColor:
                trend === "up"
                  ? "#10b98115"
                  : trend === "down"
                  ? "#ef444415"
                  : "#f1f5f9",
              color:
                trend === "up"
                  ? "#10b981"
                  : trend === "down"
                  ? "#ef4444"
                  : "#64748b",
            }}
          >
            {trend === "up" ? "↑ " : trend === "down" ? "↓ " : ""}
            {change}
          </Badge>
        </div>
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
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
      <div className="space-y-6 animate-fade-in">
        {/* Header Dashboard */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Resumen Operativo
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {unidadActiva
                ? `Visualizando ${unidadNombre}`
                : "Resumen consolidado de flota"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="rounded-xl"
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingLoads ? "animate-spin" : ""}`}
              />
            </Button>
            <Select
              value={periodo}
              onValueChange={(value) => setPeriodo(value as PeriodoType)}
            >
              <SelectTrigger className="w-44 rounded-xl">
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

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            label="Consumo Prom"
            value="450 L"
            change="2%"
            trend="down"
            icon={Minus}
            color="#3b82f6"
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
          <KPICard
            label="Validación"
            value="98%"
            change="1.2%"
            trend="up"
            icon={CheckCircle2}
            color="#10b981"
            loading={loadingLoads}
          />
          <KPICard
            label="Alertas"
            value="4"
            change="3 hoy"
            trend="up"
            icon={AlertTriangle}
            color="#ef4444"
            loading={loadingLoads}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Consumo Line Chart */}
          <Card className="border-none shadow-sm lg:col-span-8 rounded-xl bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Histórico de Consumo y Costo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={consumoMensual}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="mes"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="litros"
                      stroke="#1E2C56"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#1E2C56",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Consumo por Tipo Pie Chart */}
          <Card className="border-none shadow-sm lg:col-span-4 rounded-xl bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Consumo por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={consumoPorTipo}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
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
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {consumoPorTipo.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS[i] }}
                      />
                      <span className="font-medium text-slate-600">
                        {item.tipo}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {item.litros} L
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
