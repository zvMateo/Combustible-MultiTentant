// src/pages/Dashboard/Fuel/tabs/FuelTypesTab.tsx
import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  TextField,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import CategoryIcon from "@mui/icons-material/Category";
import { toast } from "sonner";
import { useFuelTypes } from "@/hooks/queries";

export default function FuelTypesTab() {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  const { data: fuelTypes = [], isLoading } = useFuelTypes();

  const handleSave = () => {
    // TODO: Implementar create/update mutation
    toast.success("Tipo de combustible guardado");
    setOpenDialog(false);
    setFormData({ name: "" });
  };

  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Tipos de Combustible
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maestro de tipos de combustible disponibles
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            size="small"
          >
            Nuevo Tipo
          </Button>
        </Box>

        {/* Tabla */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fuelTypes.map((type) => (
                <TableRow key={type.id} hover>
                  <TableCell>{type.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CategoryIcon sx={{ fontSize: 20, color: "#f59e0b" }} />
                      <Typography fontWeight={600}>{type.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={type.active ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        bgcolor: type.active ? "#10b98115" : "#f3f4f6",
                        color: type.active ? "#10b981" : "#6b7280",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: "#f3f4f6",
                          "&:hover": { bgcolor: "#e5e7eb" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: type.active ? "#fee2e2" : "#dcfce7",
                          color: type.active ? "#dc2626" : "#10b981",
                          "&:hover": {
                            bgcolor: type.active ? "#fecaca" : "#bbf7d0",
                          },
                        }}
                      >
                        {type.active ? (
                          <ToggleOffIcon fontSize="small" />
                        ) : (
                          <ToggleOnIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {fuelTypes.length === 0 && !isLoading && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CategoryIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay tipos de combustible configurados
            </Typography>
          </Box>
        )}
      </Box>

      {/* Dialog Crear/Editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Nuevo Tipo de Combustible</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              fullWidth
              size="small"
              placeholder="Ej: Nafta Super, Diesel Premium"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
