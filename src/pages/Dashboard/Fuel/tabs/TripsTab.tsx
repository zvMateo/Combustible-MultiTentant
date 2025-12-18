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
import { useZodForm } from "@/hooks/useZodForm";
import { createTripSchema, type CreateTripFormData } from "@/schemas";
import type { Trip, UpdateTripRequest } from "@/types/api.types";

export default function TripsTab() {
  const { canEdit, showCreateButtons, showEditButtons, isReadOnly } =
    useRoleLogic();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const form = useZodForm<CreateTripFormData>(createTripSchema, {
    defaultValues: {
      idDriver: 0,
      idVehicle: undefined,
      initialLocation: "",
      finalLocation: "",
      totalKm: 0,
      startDate: new Date().toISOString().slice(0, 16),
      notes: "",
    },
  });

  // React Query hooks
  const { data: trips = [], isLoading, error } = useTrips();
  const { data: drivers = [] } = useDrivers();
  const createMutation = useCreateTrip();
  const updateMutation = useUpdateTrip();

  const handleNew = () => {
    setEditingTrip(null);
    form.reset({
      idDriver: 0,
      idVehicle: undefined,
      initialLocation: "",
      finalLocation: "",
      totalKm: 0,
      startDate: new Date().toISOString().slice(0, 16),
      notes: "",
    });
    setOpenDialog(true);
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    form.reset({
      idDriver: trip.idDriver,
      idVehicle: trip.idVehicle || undefined,
      initialLocation: trip.initialLocation || "",
      finalLocation: trip.finalLocation || "",
      totalKm: trip.totalKm || 0,
      startDate: trip.startDate
        ? new Date(trip.startDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      notes: trip.notes || "",
    });
    setOpenDialog(true);
  };

  const onSubmit = async (data: CreateTripFormData) => {
    try {
      if (editingTrip) {
        const updateData: UpdateTripRequest = {
          id: editingTrip.id,
          idDriver: data.idDriver,
          initialLocation: data.initialLocation,
          finalLocation: data.finalLocation,
          totalKm: data.totalKm,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(data);
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

      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingTrip(null);
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTrip ? "Editar Viaje" : "Nuevo Viaje"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Conductor *</label>
              <Select
                value={String(form.watch("idDriver") || "0")}
                onValueChange={(value) =>
                  form.setValue("idDriver", Number(value))
                }
              >
                <SelectTrigger aria-invalid={!!form.formState.errors.idDriver}>
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
              {form.formState.errors.idDriver && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.idDriver.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origen *</label>
                <Input
                  {...form.register("initialLocation")}
                  aria-invalid={!!form.formState.errors.initialLocation}
                />
                {form.formState.errors.initialLocation && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.initialLocation.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Destino *</label>
                <Input
                  {...form.register("finalLocation")}
                  aria-invalid={!!form.formState.errors.finalLocation}
                />
                {form.formState.errors.finalLocation && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.finalLocation.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de Inicio</label>
                <Input type="datetime-local" {...form.register("startDate")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Distancia (km)</label>
                <Input
                  type="number"
                  {...form.register("totalKm", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea {...form.register("notes")} rows={2} />
            </div>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
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
