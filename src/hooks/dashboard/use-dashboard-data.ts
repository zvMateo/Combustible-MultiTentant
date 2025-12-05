import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

type PeriodoType = "semana" | "mes" | "trimestre" | "anio";

interface ConsumoMensualData {
  mes: string;
  litros: number;
  costo: number;
}

interface ConsumoPorTipoData {
  tipo: string;
  litros: number;
  porcentaje: number;
}

interface KPIData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  color: string;
}

// Datos Mock (Migrados de combustible-multitenant)
const mockConsumoMensual: ConsumoMensualData[] = [
  { mes: "Ene", litros: 4500, costo: 6750 },
  { mes: "Feb", litros: 5200, costo: 7800 },
  { mes: "Mar", litros: 4800, costo: 7200 },
  { mes: "Abr", litros: 5500, costo: 8250 },
  { mes: "May", litros: 6000, costo: 9000 },
  { mes: "Jun", litros: 5800, costo: 8700 },
];

const mockConsumoPorTipo: ConsumoPorTipoData[] = [
  { tipo: "Camión", litros: 3200, porcentaje: 45 },
  { tipo: "Tractor", litros: 2400, porcentaje: 34 },
  { tipo: "Otros", litros: 1500, porcentaje: 21 },
];

const mockKPIs: KPIData[] = [
  { label: "Consumo Total", value: "32,450 L", change: "+12%", trend: "up", color: "#1E2C56" },
  { label: "Costo Total", value: "$48,675", change: "+8%", trend: "up", color: "#10b981" },
  { label: "Vehículos Activos", value: "24", change: "+2", trend: "up", color: "#4A90E2" },
  { label: "Alertas Pendientes", value: "3", change: "-5", trend: "down", color: "#f59e0b" },
];

export function useDashboardData() {
  const { user } = useAuthStore();
  const [data, setData] = useState({
    consumoMensual: [] as ConsumoMensualData[],
    consumoPorTipo: [] as ConsumoPorTipoData[],
    kpis: [] as KPIData[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoType>("mes");

  useEffect(() => {
    // Si no hay usuario o tenant, no cargamos nada
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Lógica futura: Filtrar datos por user.empresaId si no es SuperAdmin
      console.log(`Cargando dashboard para Empresa ID: ${user.empresaId} / Rol: ${user.role}`);

      // Devolvemos los datos mockeados
      setData({
        consumoMensual: mockConsumoMensual,
        consumoPorTipo: mockConsumoPorTipo,
        kpis: mockKPIs
      });
      setIsLoading(false);
    };

    loadData();
  }, [periodo, user]);

  return {
    ...data,
    isLoading,
    periodo,
    setPeriodo,
  };
}
