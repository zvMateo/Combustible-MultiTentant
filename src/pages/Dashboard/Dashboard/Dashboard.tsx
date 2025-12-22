import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Fuel,
  MapPin,
  RefreshCw,
  User,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

import {
  useLoadLitersScoped,
  useDrivers,
  loadLitersKeys,
  resourcesKeys,
  driversKeys,
} from "@/hooks/queries";
import { useUnidadActivaNombre, useUnidadActiva } from "@/stores/unidad.store";
import type { Driver, LoadLiters } from "@/types/api.types";
import { toast } from "sonner";

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

function FuelPricesCard() {
  type CiudadSearchItem = {
    nombre: string;
    lat: number;
    long: number;
  };

  type PrecioBaseResponse = Record<
    string,
    {
      coordenadas: { latitud: number; longitud: number };
      horario: string;
      empresas: Record<
        string,
        Record<string, { precio: number; fecha_vigencia: string }>
      >;
    }
  >;

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (typeof window === "undefined") return "CORDOBA";
    return window.localStorage.getItem("naftas:selectedCity") || "CORDOBA";
  });

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CiudadSearchItem[]>([]);

  const [precioLoading, setPrecioLoading] = useState(false);
  const [precioError, setPrecioError] = useState<string | null>(null);
  const [precioData, setPrecioData] = useState<
    PrecioBaseResponse[string] | null
  >(null);
  const precioRequestSeq = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("naftas:selectedCity", selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    if (!locationDialogOpen) return;
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  }, [locationDialogOpen]);

  useEffect(() => {
    if (!locationDialogOpen) return;

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);

        const { data } = await axiosInstance.get<{
          cities?: CiudadSearchItem[];
        }>("/naftaAPI/Search", {
          params: { q },
          signal: controller.signal,
        });
        setSearchResults(data?.cities ?? []);
      } catch (e) {
        if (controller.signal.aborted) return;
        setSearchError(
          e instanceof Error
            ? e.message
            : "Error desconocido al buscar ciudades"
        );
        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [locationDialogOpen, searchQuery]);

  const fetchPrecios = useCallback(
    async (city: string, signal?: AbortSignal) => {
      const { data } = await axiosInstance.get<PrecioBaseResponse>(
        "/naftaAPI/GetData",
        {
          params: { ciudad: city },
          signal,
        }
      );
      const cityKey = Object.keys(data ?? {})[0];
      if (!cityKey || !data?.[cityKey])
        throw new Error("Respuesta inválida de precios");
      return data[cityKey];
    },
    []
  );

  useEffect(() => {
    const seq = ++precioRequestSeq.current;
    const controller = new AbortController();

    (async () => {
      try {
        setPrecioLoading(true);
        setPrecioError(null);
        const data = await fetchPrecios(selectedCity, controller.signal);
        if (seq !== precioRequestSeq.current) return;
        setPrecioData(data);
      } catch (e) {
        if (controller.signal.aborted) return;
        if (seq !== precioRequestSeq.current) return;
        const message =
          e instanceof Error
            ? e.message
            : "Error desconocido al cargar precios";
        setPrecioError(message);
        setPrecioData(null);
        toast.error(message);
      } finally {
        if (seq === precioRequestSeq.current) {
          setPrecioLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [fetchPrecios, selectedCity]);

  const formatRelativeTimeEs = (iso: string) => {
    const now = Date.now();
    const dt = new Date(iso).getTime();
    if (Number.isNaN(dt)) return "";
    const diffMs = Math.max(0, now - dt);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    const plural = (n: number, s: string) => (n === 1 ? s : `${s}s`);

    if (minutes < 1) return "Actualizado recién";
    if (minutes < 60)
      return `Actualizado hace ${minutes} ${plural(minutes, "minuto")}`;
    if (hours < 24) return `Actualizado hace ${hours} ${plural(hours, "hora")}`;
    if (days < 30) return `Actualizado hace ${days} ${plural(days, "día")}`;
    if (days < 365)
      return `Actualizado hace ${months} ${plural(months, "mes")}`;
    return `Actualizado hace ${years} ${plural(years, "año")}`;
  };

  const brandStyles: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    YPF: { bg: "bg-blue-600", text: "text-white", label: "YPF" },
    PUMA: { bg: "bg-red-600", text: "text-white", label: "PUMA" },
    AXION: { bg: "bg-purple-600", text: "text-white", label: "AXION" },
    "SHELL C.A.P.S.A.": {
      bg: "bg-red-600",
      text: "text-white",
      label: "SHELL",
    },
  };

  const empresas = useMemo(() => {
    const e = precioData?.empresas ?? {};
    return Object.entries(e).map(([empresa, combustibles]) => {
      const fuels = Object.entries(combustibles).map(([nombre, info]) => ({
        nombre,
        precio: info.precio,
        fecha_vigencia: info.fecha_vigencia,
      }));
      const avg =
        fuels.length > 0
          ? fuels.reduce(
              (acc, f) => acc + (typeof f.precio === "number" ? f.precio : 0),
              0
            ) / fuels.length
          : 0;
      return { empresa, fuels, avgPrice: avg };
    });
  }, [precioData]);

  const getUnit = (fuelName: string) => {
    return fuelName.toUpperCase().includes("GNC") ? "m³" : "l";
  };

  return (
    <Card className="lg:col-span-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">
            Precios de Combustible
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Precios promedio por empresa y tipo (referencial)
          </p>
        </div>

        <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2"
            onClick={() => setLocationDialogOpen(true)}
          >
            <MapPin className="size-4" />
            <span className="hidden sm:inline">Mostrando</span>
            <span className="font-semibold">{selectedCity}</span>
            <ChevronDown className="size-4" />
          </Button>

          <DialogContent className="max-w-[560px] p-0">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle>Configuración</DialogTitle>
              </DialogHeader>
            </div>

            <div className="px-6 pb-6">
              <div className="mt-4 flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocationDialogOpen(false)}
                  aria-label="Volver"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="text-sm font-semibold">Buscar ubicación</div>
              </div>

              <div className="mt-3">
                <Command className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <CommandInput
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    placeholder="Buscar ciudad..."
                    className="border-b border-slate-100"
                  />
                  <CommandList className="max-h-[280px]">
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Spinner />
                      </div>
                    ) : null}
                    {searchError ? (
                      <div className="text-muted-foreground px-3 py-3 text-sm">
                        {searchError}
                      </div>
                    ) : null}
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                      {searchQuery.trim().length < 2
                        ? "Escribí al menos 2 letras"
                        : "Sin resultados"}
                    </CommandEmpty>
                    <CommandGroup className="p-2">
                      {searchResults.map((c) => (
                        <CommandItem
                          key={c.nombre}
                          value={c.nombre}
                          onSelect={() => {
                            setSelectedCity(c.nombre);
                            setLocationDialogOpen(false);
                          }}
                          className="rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-slate-100"
                        >
                          <MapPin className="size-4 text-slate-400" />
                          <span className="font-medium">{c.nombre}</span>
                          <ChevronRight className="ml-auto size-4 text-slate-300" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <Alert className="border-gray-200">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Los valores son referenciales (promedios por empresa/ciudad) y
            pueden variar por estación.
          </AlertDescription>
        </Alert>

        {precioError ? (
          <Alert className="mt-4" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <div className="flex items-center justify-between gap-3">
                <span>{precioError}</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      setPrecioLoading(true);
                      setPrecioError(null);
                      const data = await fetchPrecios(selectedCity);
                      setPrecioData(data);
                    } catch (e) {
                      const message =
                        e instanceof Error
                          ? e.message
                          : "Error desconocido al cargar precios";
                      setPrecioError(message);
                      setPrecioData(null);
                    } finally {
                      setPrecioLoading(false);
                    }
                  }}
                >
                  Reintentar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6">
          {precioLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {empresas.map((e) => {
                const brand = brandStyles[e.empresa] || {
                  bg: "bg-muted",
                  text: "text-foreground",
                  label: e.empresa,
                };
                return (
                  <Card key={e.empresa} className="border-border">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`${brand.bg} ${brand.text} flex h-11 w-11 items-center justify-center rounded-lg text-xs font-bold`}
                          >
                            {brand.label}
                          </div>
                          <div>
                            <div className="font-semibold">
                              {brand.label === e.empresa
                                ? e.empresa
                                : brand.label}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {selectedCity}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 divide-y divide-gray-200 ">
                        {e.fuels.map((f) => (
                          <button
                            key={`${e.empresa}:${f.nombre}`}
                            type="button"
                            className="hover:bg-muted/40 flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">
                                {f.nombre}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatRelativeTimeEs(f.fecha_vigencia)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold whitespace-nowrap">
                                ${f.precio.toLocaleString("es-AR")} /{" "}
                                {getUnit(f.nombre)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
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
          <FuelPricesCard />

          {/* Consumo por Tipo - Donut Chart */}
          <Card className="lg:col-span-4 h-fit">
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
