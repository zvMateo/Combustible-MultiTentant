import { useState } from "react";
import {
  Box,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
  Chip,
  SelectChangeEvent,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import { useTenant } from "../../hooks/useTenant";
import { useAuth } from "../../hooks/useAuth";

export default function TenantSelector() {
  const { user } = useAuth();
  const { currentTenant, tenants, isLoading, switchTenant } = useTenant();
  const [switching, setSwitching] = useState(false);

  // Solo visible para SuperAdmin
  if (user?.rol !== "SuperAdmin") {
    return null;
  }

  const handleChange = async (event: SelectChangeEvent<number>) => {
    const tenantId = Number(event.target.value);
    setSwitching(true);
    await switchTenant(tenantId);
    setSwitching(false);
  };

  if (isLoading || !currentTenant) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Cargando...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1,
        bgcolor: "rgba(255,255,255,0.05)",
        borderRadius: 2,
      }}
    >
      <BusinessIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 20 }} />
      <Box sx={{ minWidth: 200 }}>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block", mb: 0.5 }}>
          Empresa Activa
        </Typography>
        <Select
          value={currentTenant.id}
          onChange={handleChange}
          disabled={switching || tenants.length === 0}
          size="small"
          sx={{
            color: "white",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.2)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.3)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.4)",
            },
            "& .MuiSvgIcon-root": {
              color: "rgba(255,255,255,0.7)",
            },
          }}
          fullWidth
        >
          {tenants.map((tenant) => (
            <MenuItem key={tenant.id} value={tenant.id}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {tenant.nombre}
                </Typography>
                <Chip
                  label={tenant.tipoMercado}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    bgcolor: tenant.tipoMercado === "Agro" ? "#10b98115" : "#3b82f615",
                    color: tenant.tipoMercado === "Agro" ? "#10b981" : "#3b82f6",
                  }}
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </Box>
      {switching && <CircularProgress size={16} sx={{ color: "white" }} />}
    </Box>
  );
}

