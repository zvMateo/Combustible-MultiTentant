// src/pages/Dashboard/Fuel/FuelManagementPage.tsx
import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import MoveUpIcon from "@mui/icons-material/MoveUp";
import CategoryIcon from "@mui/icons-material/Category";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar"; // ✅ NUEVO

// Importar los componentes de cada tab
import StockMovementsTab from "../Fuel/tabs/StockMovementsTab";
import LoadLitersTab from "../Fuel/tabs/LoadLitersTab";
import FuelTypesTab from "../Fuel/tabs/FuelTypesTab";
import MovementTypesTab from "../Fuel/tabs/MovementTypesTab";
import TripsTab from "../Fuel/tabs/TripsTab"; // ✅ NUEVO

export default function FuelManagementPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, mt: -3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Gestión de Combustible
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administración completa de stock, cargas, tipos de combustible, movimientos y viajes
        </Typography>
      </Box>

      {/* Tabs Navigation */}
      <Tabs
        value={tab}
        onChange={(_, newValue) => setTab(newValue)}
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
          icon={<MoveUpIcon />}
          iconPosition="start"
          label="Movimientos de Stock"
        />
        <Tab
          icon={<LocalGasStationIcon />}
          iconPosition="start"
          label="Cargas de Litros"
        />
        <Tab
          icon={<CategoryIcon />}
          iconPosition="start"
          label="Tipos de Combustible"
        />
        <Tab
          icon={<SwapVertIcon />}
          iconPosition="start"
          label="Tipos de Movimiento"
        />
        <Tab
          icon={<DirectionsCarIcon />}
          iconPosition="start"
          label="Viajes"
        /> 
      </Tabs>

      {/* Tab Content */}
      {tab === 0 && <StockMovementsTab />}
      {tab === 1 && <LoadLitersTab />}
      {tab === 2 && <FuelTypesTab />}
      {tab === 3 && <MovementTypesTab />}
      {tab === 4 && <TripsTab />} 
    </Box>
  );
}
