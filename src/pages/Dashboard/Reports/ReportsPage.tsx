// src/pages/Dashboard/Reports/ReportsPage.tsx
import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  AlertTriangle,
  Download,
  Fuel,
  Landmark,
  RefreshCcw,
  Trophy,
  Truck,
  User,
} from "lucide-react";
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
      <TableHeader>
        <TableRow>
          {Array.from({ length: cols }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton
                  className={colIndex === 0 ? "h-4 w-28" : "h-4 w-16"}
                />
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
  const loads = loadsData;
  const vehicles = vehiclesData;
  const drivers = driversData;
  const trips = tripsData;
  const allResources = resourcesData;
  const businessUnits = businessUnitsData;

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

      const typeArray = vehicle.type ?? [];
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
      const typeArray = r.type ?? [];
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
    <div className="space-y-6">
      <div className="border-b bg-background px-6 py-6">
        <PageHeader
          title="Sistema de Reportes"
          description="Análisis completo de consumo, costos, eficiencia y desvíos"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Período</span>
                <Select
                  value={periodoReporte}
                  onValueChange={(v) => setPeriodoReporte(v as PeriodoReporte)}
                >
                  <SelectTrigger className="h-10 w-[220px]">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODOS_REPORTE.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={isLoading}
                      aria-label="Actualizar datos"
                    >
                      <RefreshCcw className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Actualizar datos</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {showExportButtons ? (
                <Button
                  type="button"
                  onClick={handleExport}
                  disabled={isLoading || loads.length === 0 || !canExport}
                >
                  <Download className="size-4" />
                  Exportar a Excel
                </Button>
              ) : null}
            </div>
          }
        />
      </div>

      <div className="p-6 space-y-4">
        {!isLoading && loads.length === 0 ? (
          <Alert className="mb-4">
            <AlertTriangle className="size-4" />
            <AlertTitle>Sin datos</AlertTitle>
            <AlertDescription>
              No hay cargas de combustible registradas. Los reportes se
              actualizarán automáticamente cuando se registren cargas.
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs
          value={tipoReporte}
          onValueChange={(v) => setTipoReporte(v as TipoReporte)}
          className="w-full"
        >
          <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 rounded-lg border bg-background p-1">
            <TabsTrigger value="consumo-vehiculos" className="h-10">
              <Truck className="size-4" />
              Consumo por Vehículo
            </TabsTrigger>
            <TabsTrigger value="litros-surtidor" className="h-10">
              <Fuel className="size-4" />
              Litros por Surtidor
            </TabsTrigger>
            <TabsTrigger value="litros-operador" className="h-10">
              <User className="size-4" />
              Litros por Operador
            </TabsTrigger>
            <TabsTrigger value="costo-centro" className="h-10">
              <Landmark className="size-4" />
              Costos por Centro
            </TabsTrigger>
            <TabsTrigger value="desvios" className="h-10">
              <AlertTriangle className="size-4" />
              Análisis de Desvíos
            </TabsTrigger>
            <TabsTrigger value="ranking-eficiencia" className="h-10">
              <Trophy className="size-4" />
              Ranking Eficiencia
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-6">
          {/* Reporte 1: Consumo por Vehículo */}
          {tipoReporte === "consumo-vehiculos" && (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Total de Litros por Vehículo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[400px] w-full" />
                    ) : consumoVehiculos.length === 0 ? (
                      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
                        <Truck className="size-10" />
                        <div className="text-sm">Sin datos de consumo</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={consumoVehiculos.slice(0, 10)}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
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

                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardDescription>Total Litros</CardDescription>
                      <CardTitle className="text-xl">
                        {isLoading ? (
                          <Skeleton className="h-7 w-32" />
                        ) : (
                          `${totales.litros.toLocaleString()} L`
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>Costo Total</CardDescription>
                      <CardTitle className="text-xl">
                        {isLoading ? (
                          <Skeleton className="h-7 w-32" />
                        ) : (
                          `$${totales.costo.toLocaleString()}`
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription>Total Eventos</CardDescription>
                      <CardTitle className="text-xl">
                        {isLoading ? (
                          <Skeleton className="h-7 w-20" />
                        ) : (
                          totales.eventos
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <TableSkeleton rows={5} cols={6} />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vehículo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">
                              Total Litros
                            </TableHead>
                            <TableHead className="text-right">
                              Eventos
                            </TableHead>
                            <TableHead className="text-right">
                              Eficiencia (km/L)
                            </TableHead>
                            <TableHead className="text-right">
                              Promedio/Evento
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {consumoVehiculos.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center">
                                No hay datos disponibles
                              </TableCell>
                            </TableRow>
                          ) : (
                            consumoVehiculos.map((item) => (
                              <TableRow
                                key={item.vehiculoId}
                                className="hover:bg-muted/50"
                              >
                                <TableCell className="font-medium">
                                  {item.vehiculoPatente}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {item.vehiculoTipo}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.litrosTotales.toFixed(2)} L
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.numeroEventos}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.eficienciaKmPorLitro
                                    ? item.eficienciaKmPorLitro.toFixed(2)
                                    : "N/A"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.consumoPromedioPorEvento.toFixed(2)} L
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Reporte 2: Litros por Surtidor */}
          {tipoReporte === "litros-surtidor" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Surtidor</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : litrosPorSurtidor.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
                      <Fuel className="size-10" />
                      <div className="text-sm">Sin datos de surtidores</div>
                    </div>
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

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <TableSkeleton rows={4} cols={5} />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Surtidor</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead className="text-right">
                              Litros Totales
                            </TableHead>
                            <TableHead className="text-right">
                              Eventos
                            </TableHead>
                            <TableHead className="text-right">
                              % del Total
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {litrosPorSurtidor.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center">
                                No hay datos disponibles
                              </TableCell>
                            </TableRow>
                          ) : (
                            litrosPorSurtidor.map((item) => (
                              <TableRow
                                key={item.surtidorId}
                                className="hover:bg-muted/50"
                              >
                                <TableCell className="font-medium">
                                  {item.surtidorNombre}
                                </TableCell>
                                <TableCell>{item.surtidorUbicacion}</TableCell>
                                <TableCell className="text-right">
                                  {item.litrosTotales.toFixed(2)} L
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.numeroEventos}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.porcentajeTotal.toFixed(2)}%
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reporte 3: Litros por Operador */}
          {tipoReporte === "litros-operador" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Consumo por Operador</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : litrosPorOperador.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
                      <User className="size-10" />
                      <div className="text-sm">Sin datos de operadores</div>
                    </div>
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

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <TableSkeleton rows={5} cols={4} />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Operador</TableHead>
                            <TableHead className="text-right">
                              Total Litros
                            </TableHead>
                            <TableHead className="text-right">
                              Eventos
                            </TableHead>
                            <TableHead>Vehículos Usados</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {litrosPorOperador.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                No hay datos disponibles
                              </TableCell>
                            </TableRow>
                          ) : (
                            litrosPorOperador
                              .sort((a, b) => b.litrosTotales - a.litrosTotales)
                              .map((item) => (
                                <TableRow
                                  key={item.choferId}
                                  className="hover:bg-muted/50"
                                >
                                  <TableCell className="font-medium">
                                    {item.choferNombre} {item.choferApellido}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.litrosTotales.toFixed(2)} L
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.numeroEventos}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {item.vehiculosMasUsados
                                        .slice(0, 3)
                                        .map((v) => (
                                          <Badge
                                            key={v}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {v}
                                          </Badge>
                                        ))}
                                      {item.vehiculosMasUsados.length > 3 ? (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          +{item.vehiculosMasUsados.length - 3}
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Reporte 4: Costos por Centro de Costos */}
          {tipoReporte === "costo-centro" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Costos por Centro de Costos / Unidad de Negocio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <TableSkeleton rows={5} cols={7} />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Centro de Costo</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">
                            Total Litros
                          </TableHead>
                          <TableHead className="text-right">
                            Costo Total
                          </TableHead>
                          <TableHead className="text-right">Eventos</TableHead>
                          <TableHead className="text-right">
                            Vehículos
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costosPorCentroCosto.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              No hay datos disponibles
                            </TableCell>
                          </TableRow>
                        ) : (
                          costosPorCentroCosto
                            .sort((a, b) => b.litrosTotales - a.litrosTotales)
                            .map((item) => (
                              <TableRow
                                key={item.centroCostoId}
                                className="hover:bg-muted/50"
                              >
                                <TableCell className="font-medium">
                                  {item.centroCostoNombre}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {item.centroCostoCodigo}
                                  </Badge>
                                </TableCell>
                                <TableCell>{item.centroCostoTipo}</TableCell>
                                <TableCell className="text-right">
                                  {item.litrosTotales.toFixed(2)} L
                                </TableCell>
                                <TableCell className="text-right">
                                  ${item.costoTotal.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.numeroEventos}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.vehiculosAsignados}
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reporte 5: Análisis de Desvíos */}
          {tipoReporte === "desvios" && (
            <>
              {desvios.length === 0 && !isLoading ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <div className="text-muted-foreground mx-auto flex max-w-md flex-col items-center gap-2">
                      <AlertTriangle className="size-12 text-emerald-600" />
                      <div className="text-base font-semibold text-emerald-700">
                        ¡Sin desvíos detectados!
                      </div>
                      <div className="text-sm">
                        No se encontraron eventos con anomalías o pendientes de
                        validación
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                      {isLoading ? (
                        <TableSkeleton rows={5} cols={7} />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Vehículo</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">
                                Litros
                              </TableHead>
                              <TableHead>Severidad</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {desvios.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                  No se encontraron desvíos
                                </TableCell>
                              </TableRow>
                            ) : (
                              desvios.map((item) => (
                                <TableRow
                                  key={item.eventoId}
                                  className="hover:bg-muted/50"
                                >
                                  <TableCell>
                                    {new Date(item.fecha).toLocaleDateString(
                                      "es-AR"
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {item.vehiculoPatente}
                                  </TableCell>
                                  <TableCell>{item.tipoDesvio}</TableCell>
                                  <TableCell className="text-right">
                                    {item.litros.toFixed(2)} L
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={
                                        item.severidad === "alta"
                                          ? "bg-red-600 text-white"
                                          : item.severidad === "media"
                                          ? "bg-amber-500 text-white"
                                          : "bg-emerald-600 text-white"
                                      }
                                    >
                                      {item.severidad}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{item.descripcion}</TableCell>
                                  <TableCell>
                                    <Badge
                                      className={
                                        item.resuelto
                                          ? "bg-emerald-600 text-white"
                                          : "bg-amber-500 text-white"
                                      }
                                    >
                                      {item.resuelto ? "Resuelto" : "Pendiente"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Reporte 6: Ranking de Eficiencia */}
          {tipoReporte === "ranking-eficiencia" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Ranking de Eficiencia (Menor consumo promedio por carga)
                </CardTitle>
                <CardDescription>
                  Los vehículos con menor consumo promedio por carga se
                  consideran más eficientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <TableSkeleton rows={5} cols={6} />
                  ) : rankingEficiencia.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
                      <Trophy className="size-10" />
                      <div className="text-sm">
                        Sin datos suficientes para ranking
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Posición</TableHead>
                          <TableHead>Vehículo</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">
                            Eficiencia (km/L)
                          </TableHead>
                          <TableHead className="text-right">
                            Total Litros
                          </TableHead>
                          <TableHead>Tendencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankingEficiencia.map((item) => (
                          <TableRow
                            key={item.vehiculoId}
                            className="hover:bg-muted/50"
                          >
                            <TableCell>
                              <Badge
                                className={
                                  item.posicion <= 3
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-500 text-white"
                                }
                              >
                                #{item.posicion}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.vehiculoPatente}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {item.vehiculoTipo}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">
                              {item.eficiencia.toFixed(2)} km/L
                            </TableCell>
                            <TableCell className="text-right">
                              {item.litrosTotales.toFixed(2)} L
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {item.tendencia}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
