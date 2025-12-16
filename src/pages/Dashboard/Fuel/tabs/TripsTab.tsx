// src/pages/Dashboard/Fuel/tabs/TripsTab.tsx
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Car, Pencil, Plus, TriangleAlert } from "lucide-react";
import {
  useTrips,
  useCreateTrip,
  useUpdateTrip,
  useDrivers,
} from "@/hooks/queries";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type {
  Trip,
  CreateTripRequest,
  UpdateTripRequest,
} from "@/types/api.types";

// Tipo local para el formulario (incluye campos adicionales del UI)
interface TripFormData {
  idDriver: number;
  startDate: string;
  origin: string;
  destination: string;
  distance: number;
  notes: string;
}

export default function TripsTab() {
  const { canEdit, showCreateButtons, showEditButtons, isReadOnly } =
    useRoleLogic();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<TripFormData>({
    idDriver: 0,
    startDate: new Date().toISOString().slice(0, 16),
    origin: "",
    destination: "",
    distance: 0,
    notes: "",
  });
  const [errors, setErrors] = useState({
    idDriver: "",
    origin: "",
    destination: "",
  });

  // React Query hooks
  const { data: trips = [], isLoading, error } = useTrips();
  const { data: drivers = [] } = useDrivers();
  const createMutation = useCreateTrip();
  const updateMutation = useUpdateTrip();

  const handleNew = () => {
    setEditingTrip(null);
    setFormData({
      idDriver: 0,
      startDate: new Date().toISOString().slice(0, 16),
      origin: "",
      destination: "",
      distance: 0,
      notes: "",
    });
    setErrors({ idDriver: "", origin: "", destination: "" });
    setOpenDialog(true);
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      idDriver: trip.idDriver,
      startDate: trip.startDate
        ? new Date(trip.startDate).toISOString().slice(0, 16)
        : trip.createdAt
        ? new Date(trip.createdAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      origin: trip.origin || trip.initialLocation || "",
      destination: trip.destination || trip.finalLocation || "",
      distance: trip.distance || trip.totalKm || 0,
      notes: trip.notes || "",
    });
    setErrors({ idDriver: "", origin: "", destination: "" });
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors = {
      idDriver: "",
      origin: "",
      destination: "",
    };

    if (!formData.idDriver || formData.idDriver === 0)
      newErrors.idDriver = "El conductor es obligatorio";
    if (!formData.origin?.trim()) newErrors.origin = "El origen es obligatorio";
    if (!formData.destination?.trim())
      newErrors.destination = "El destino es obligatorio";

    setErrors(newErrors);
    return !Object.values(newErrors).some((err) => err);
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      // Preparar datos para la API (mapear campos del formulario a la estructura de la API)
      const apiData: CreateTripRequest = {
        idDriver: formData.idDriver,
        initialLocation: formData.origin || "",
        finalLocation: formData.destination || "",
        totalKm: formData.distance || 0,
      };

      if (editingTrip) {
        const updateData: UpdateTripRequest = {
          id: editingTrip.id,
          ...apiData,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(apiData);
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  if (isLoading) {
    return (
      <SectionCard>
        <div className="flex items-center gap-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Cargando viajes...
          </span>
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard>
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error al cargar viajes:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Viajes"
        description="Gestión de viajes y recorridos"
        actions={
          showCreateButtons ? (
            <Button
              onClick={handleNew}
              disabled={createMutation.isPending || isReadOnly}
              size="sm"
            >
              <Plus className="size-4" />
              Nuevo Viaje
            </Button>
          ) : null
        }
      >
        {trips.length === 0 ? (
          <EmptyState
            icon={<Car className="size-10" />}
            title="No hay viajes registrados"
            description={
              showCreateButtons && !isReadOnly
                ? 'Haz clic en "Nuevo Viaje" para agregar uno'
                : "No hay datos para mostrar"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="w-[140px]">Distancia (km)</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono text-xs">
                      {trip.id}
                    </TableCell>
                    <TableCell>
                      {trip.nameDriver ||
                        drivers.find((d) => d.id === trip.idDriver)?.name ||
                        `Driver #${trip.idDriver}`}
                    </TableCell>
                    <TableCell>{trip.initialLocation || "-"}</TableCell>
                    <TableCell>{trip.finalLocation || "-"}</TableCell>
                    <TableCell>{trip.totalKm || "-"}</TableCell>
                    <TableCell className="text-right">
                      {!isReadOnly && showEditButtons ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(trip)}
                          disabled={updateMutation.isPending || !canEdit}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTrip ? "Editar Viaje" : "Nuevo Viaje"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Conductor *</label>
              <Select
                value={String(formData.idDriver)}
                onValueChange={(value) =>
                  setFormData({ ...formData, idDriver: Number(value) })
                }
              >
                <SelectTrigger aria-invalid={!!errors.idDriver}>
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Seleccionar conductor</SelectItem>
                  {drivers
                    .filter((driver) => driver.active !== false)
                    .map((driver) => (
                      <SelectItem key={driver.id} value={String(driver.id)}>
                        {driver.name} {driver.dni ? `(${driver.dni})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.idDriver ? (
                <p className="text-destructive text-xs">{errors.idDriver}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origen *</label>
                <Input
                  value={formData.origin}
                  onChange={(e) =>
                    setFormData({ ...formData, origin: e.target.value })
                  }
                  aria-invalid={!!errors.origin}
                />
                {errors.origin ? (
                  <p className="text-destructive text-xs">{errors.origin}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Destino *</label>
                <Input
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  aria-invalid={!!errors.destination}
                />
                {errors.destination ? (
                  <p className="text-destructive text-xs">
                    {errors.destination}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de Inicio</label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Distancia (km)</label>
                <Input
                  type="number"
                  value={String(formData.distance)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      distance: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Guardando..."
                : editingTrip
                ? "Guardar Cambios"
                : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
