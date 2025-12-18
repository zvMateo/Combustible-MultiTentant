// src/pages/Dashboard/Fuel/tabs/StockMovementsTab.tsx
import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
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
import {
  ArrowUpDown,
  Download,
  Pencil,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  useFuelStockMovements,
  useCreateFuelStockMovement,
  useUpdateFuelStockMovement,
  useResources,
  useFuelTypes,
  useMovementTypes,
  useBusinessUnits,
  useCompany,
} from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import { useZodForm } from "@/hooks/useZodForm";
import {
  createFuelStockMovementSchema,
  type CreateFuelStockMovementFormData,
} from "@/schemas";
import type {
  FuelStockMovement,
  UpdateFuelStockMovementRequest,
} from "@/types/api.types";

export default function StockMovementsTab() {
  const { user } = useAuthStore();
  const idCompany = user?.idCompany ?? 0;
  const idBusinessUnit = user?.idBusinessUnit ?? 0;

  const [openDialog, setOpenDialog] = useState(false);
  const [editingMovement, setEditingMovement] =
    useState<FuelStockMovement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useZodForm<CreateFuelStockMovementFormData>(
    createFuelStockMovementSchema,
    {
      defaultValues: {
        idFuelType: 0,
        idResource: 0,
        date: new Date().toISOString().split("T")[0],
        idMovementType: 0,
        idCompany: idCompany,
        idBusinessUnit: idBusinessUnit || undefined,
        liters: 0,
      },
    }
  );

  // React Query hooks
  const { data: movements = [], isLoading, error } = useFuelStockMovements();
  const { data: resources = [] } = useResources();
  const { data: fuelTypes = [] } = useFuelTypes();
  const { data: movementTypes = [] } = useMovementTypes();
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: company } = useCompany(idCompany);

  // Helper para obtener nombre de ubicación (BU o Company)
  const getLocationName = (movement: FuelStockMovement): string => {
    // Buscar el recurso en la lista para obtener su idBusinessUnit si no viene en movement
    const resourceFromList = resources.find(
      (r) => r.id === movement.idResource
    );
    const buId =
      movement.idBusinessUnit ??
      movement.resource?.idBusinessUnit ??
      resourceFromList?.idBusinessUnit;

    // Si tiene unidad de negocio, buscar el nombre
    if (buId) {
      const bu = businessUnits.find((b) => b.id === buId);
      if (bu?.name) return bu.name;
    }
    // Si el recurso tiene businessUnit como string/array
    if (movement.resource?.businessUnit) {
      const buArr = movement.resource.businessUnit;
      if (Array.isArray(buArr) && buArr[0]) return String(buArr[0]);
      if (typeof buArr === "string" && buArr) return buArr;
    }
    // Fallback: nombre de la empresa
    return company?.name || user?.empresaNombre || "Sin asignar";
  };
  const createMutation = useCreateFuelStockMovement();
  const updateMutation = useUpdateFuelStockMovement();

  // Filtrar movimientos
  const filteredMovements = useMemo(() => {
    let filtered = movements;

    if (idCompany) {
      filtered = filtered.filter((m) => m.idCompany === idCompany);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((m) => {
        const fuelTypeName =
          m.fuelType?.name ||
          fuelTypes.find((ft) => ft.id === m.idFuelType)?.name ||
          "";
        const resourceName =
          m.resource?.name ||
          resources.find((r) => r.id === m.idResource)?.name ||
          "";
        const resourceIdentifier =
          m.resource?.identifier ||
          resources.find((r) => r.id === m.idResource)?.identifier ||
          "";
        const movementTypeName =
          m.movementType?.name ||
          movementTypes.find((mt) => mt.id === m.idMovementType)?.name ||
          "";

        return (
          resourceName.toLowerCase().includes(term) ||
          resourceIdentifier.toLowerCase().includes(term) ||
          fuelTypeName.toLowerCase().includes(term) ||
          movementTypeName.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }, [movements, searchTerm, idCompany, fuelTypes, resources, movementTypes]);

  const handleNew = () => {
    setEditingMovement(null);
    form.reset({
      idFuelType: fuelTypes[0]?.id || 0,
      idResource: resources[0]?.id || 0,
      date: new Date().toISOString().split("T")[0],
      idMovementType: movementTypes[0]?.id || 0,
      idCompany: idCompany,
      idBusinessUnit: idBusinessUnit || undefined,
      liters: 0,
    });
    setOpenDialog(true);
  };

  const handleEdit = (movement: FuelStockMovement) => {
    setEditingMovement(movement);
    form.reset({
      idFuelType: movement.idFuelType,
      idResource: movement.idResource,
      date: movement.date.split("T")[0],
      idMovementType: movement.idMovementType,
      idCompany: movement.idCompany,
      idBusinessUnit: movement.idBusinessUnit || undefined,
      liters: movement.liters,
    });
    setOpenDialog(true);
  };

  const onSubmit = async (data: CreateFuelStockMovementFormData) => {
    const finalIdCompany = idCompany || user?.idCompany || user?.empresaId || 0;

    try {
      if (editingMovement) {
        const updateData: UpdateFuelStockMovementRequest = {
          id: editingMovement.id,
          ...data,
          date: new Date(data.date).toISOString(),
          idCompany: finalIdCompany,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync({
          ...data,
          date: new Date(data.date).toISOString(),
          idCompany: finalIdCompany,
        });
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = filteredMovements.map((m) => ({
      Fecha: new Date(m.date).toLocaleDateString(),
      "Tipo Combustible":
        m.fuelType?.name ||
        fuelTypes.find((ft) => ft.id === m.idFuelType)?.name ||
        "-",
      Recurso:
        m.resource?.name ||
        resources.find((r) => r.id === m.idResource)?.name ||
        "-",
      Movimiento:
        m.movementType?.name ||
        movementTypes.find((mt) => mt.id === m.idMovementType)?.name ||
        "-",
      Empresa: getLocationName(m),
      Litros: m.liters,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(
      wb,
      `movimientos_stock_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Archivo exportado correctamente");
  };

  if (isLoading) {
    return (
      <SectionCard>
        <div className="flex items-center gap-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Cargando movimientos de stock...
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
            Error al cargar movimientos:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Movimientos de Stock"
      description={`${filteredMovements.length} ${
        filteredMovements.length === 1 ? "movimiento" : "movimientos"
      } registrados`}
      actions={
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={filteredMovements.length === 0}
            size="sm"
          >
            <Download className="size-4" />
            Exportar
          </Button>
          <Button
            type="button"
            onClick={handleNew}
            disabled={createMutation.isPending}
            size="sm"
          >
            <Plus className="size-4" />
            Nuevo Movimiento
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por recurso, combustible o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {filteredMovements.length === 0 ? (
          <EmptyState
            icon={<ArrowUpDown className="size-10" />}
            title="No hay movimientos registrados"
            description='Haz clic en "Nuevo Movimiento" para agregar uno'
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Combustible</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Tipo Movimiento</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {movement.fuelType?.name ||
                        fuelTypes.find((ft) => ft.id === movement.idFuelType)
                          ?.name ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {movement.resource?.name ||
                        resources.find((r) => r.id === movement.idResource)
                          ?.name ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {movement.movementType?.name ||
                          movementTypes.find(
                            (mt) => mt.id === movement.idMovementType
                          )?.name ||
                          "Sin tipo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getLocationName(movement)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{movement.liters} L</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(movement)}
                        disabled={updateMutation.isPending}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingMovement(null);
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMovement
                ? "Editar Movimiento"
                : "Nuevo Movimiento de Stock"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo de Combustible *
              </label>
              <Select
                value={String(form.watch("idFuelType") || "")}
                onValueChange={(value) =>
                  form.setValue("idFuelType", Number(value))
                }
              >
                <SelectTrigger
                  aria-invalid={!!form.formState.errors.idFuelType}
                >
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((ft) => (
                    <SelectItem key={ft.id} value={String(ft.id)}>
                      {ft.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.idFuelType && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.idFuelType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Recurso *</label>
              <Select
                value={String(form.watch("idResource") || "")}
                onValueChange={(value) =>
                  form.setValue("idResource", Number(value))
                }
              >
                <SelectTrigger
                  aria-invalid={!!form.formState.errors.idResource}
                >
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.identifier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.idResource && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.idResource.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" {...form.register("date")} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo de Movimiento *
              </label>
              <Select
                value={String(form.watch("idMovementType") || "")}
                onValueChange={(value) =>
                  form.setValue("idMovementType", Number(value))
                }
              >
                <SelectTrigger
                  aria-invalid={!!form.formState.errors.idMovementType}
                >
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map((mt) => (
                    <SelectItem key={mt.id} value={String(mt.id)}>
                      {mt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.idMovementType && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.idMovementType.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Litros *</label>
              <div className="relative">
                <Input
                  type="number"
                  {...form.register("liters", { valueAsNumber: true })}
                  aria-invalid={!!form.formState.errors.liters}
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  L
                </div>
              </div>
              {form.formState.errors.liters && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.liters.message}
                </p>
              )}
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
                : editingMovement
                ? "Guardar Cambios"
                : "Crear Movimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
