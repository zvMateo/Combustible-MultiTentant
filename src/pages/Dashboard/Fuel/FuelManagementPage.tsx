// src/pages/Dashboard/Fuel/FuelManagementPage.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Droplet, Layers, Shuffle, Car } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

// Importar los componentes de cada tab
import StockMovementsTab from "../Fuel/tabs/StockMovementsTab";
import LoadLitersTab from "../Fuel/tabs/LoadLitersTab";
import FuelTypesTab from "../Fuel/tabs/FuelTypesTab";
import MovementTypesTab from "../Fuel/tabs/MovementTypesTab";
import TripsTab from "../Fuel/tabs/TripsTab"; // ✅ NUEVO

export default function FuelManagementPage() {
  const [tab, setTab] = useState("stock");

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Gestión de Combustible"
        description="Administración completa de stock, cargas, tipos de combustible, movimientos y viajes"
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-secondary/50 p-1.5">
          <TabsTrigger
            value="stock"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <ArrowUpDown className="size-4" />
            Movimientos de Stock
          </TabsTrigger>
          <TabsTrigger
            value="loads"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Droplet className="size-4" />
            Cargas de Litros
          </TabsTrigger>
          <TabsTrigger
            value="fuelTypes"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Layers className="size-4" />
            Tipos de Combustible
          </TabsTrigger>
          <TabsTrigger
            value="movementTypes"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Shuffle className="size-4" />
            Tipos de Movimiento
          </TabsTrigger>
          <TabsTrigger
            value="trips"
            className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Car className="size-4" />
            Viajes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <StockMovementsTab />
        </TabsContent>
        <TabsContent value="loads">
          <LoadLitersTab />
        </TabsContent>
        <TabsContent value="fuelTypes">
          <FuelTypesTab />
        </TabsContent>
        <TabsContent value="movementTypes">
          <MovementTypesTab />
        </TabsContent>
        <TabsContent value="trips">
          <TripsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
