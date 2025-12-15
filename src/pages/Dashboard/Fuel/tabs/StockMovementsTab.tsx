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
} from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import type {
  FuelStockMovement,
  CreateFuelStockMovementRequest,
  UpdateFuelStockMovementRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

export default function StockMovementsTab() {
  const { user } = useAuthStore();
  const idCompany = user?.idCompany ?? 0;
  const idBusinessUnit = user?.idBusinessUnit ?? 0;

  const [openDialog, setOpenDialog] = useState(false);
  const [editingMovement, setEditingMovement] =
    useState<FuelStockMovement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CreateFuelStockMovementRequest>({
    idFuelType: 0,
    idResource: 0,
    date: new Date().toISOString(),
    idMovementType: 0,
    idCompany: idCompany,
    idBusinessUnit: idBusinessUnit,
    liters: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: movements = [], isLoading, error } = useFuelStockMovements();
  const { data: resources = [] } = useResources();
  const { data: fuelTypes = [] } = useFuelTypes();
  const { data: movementTypes = [] } = useMovementTypes();
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
    setFormData({
      idFuelType: fuelTypes[0]?.id || 0,
      idResource: resources[0]?.id || 0,
      date: new Date().toISOString(),
      idMovementType: movementTypes[0]?.id || 0,
      idCompany: idCompany,
      idBusinessUnit: idBusinessUnit,
      liters: 0,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (movement: FuelStockMovement) => {
    setEditingMovement(movement);
    setFormData({
      idFuelType: movement.idFuelType,
      idResource: movement.idResource,
      date: movement.date,
      idMovementType: movement.idMovementType,
      idCompany: movement.idCompany,
      idBusinessUnit: movement.idBusinessUnit,
      liters: movement.liters,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.idFuelType || formData.idFuelType === 0) {
      newErrors.idFuelType = "Debe seleccionar un tipo de combustible";
    }
    if (!formData.idResource || formData.idResource === 0) {
      newErrors.idResource = "Debe seleccionar un recurso";
    }
    if (!formData.idMovementType || formData.idMovementType === 0) {
      newErrors.idMovementType = "Debe seleccionar un tipo de movimiento";
    }
    if (formData.liters <= 0) {
      newErrors.liters = "Los litros deben ser mayores a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    // MULTI-TENANT: Usar SIEMPRE el idCompany del usuario autenticado
    const finalIdCompany = idCompany || user?.idCompany || user?.empresaId || 0;

    try {
      if (editingMovement) {
        const updateData: UpdateFuelStockMovementRequest = {
          id: editingMovement.id,
          ...formData,
          idCompany: finalIdCompany, // ✅ Usar idCompany del usuario autenticado
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        // MULTI-TENANT: Usar SIEMPRE el idCompany del usuario autenticado
        const createData: CreateFuelStockMovementRequest = {
          ...formData,
          idCompany: finalIdCompany, // ✅ Usar idCompany del usuario autenticado
        };
        await createMutation.mutateAsync(createData);
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
      Empresa: m.resource?.company?.[0] || "-",
      "Unidad de Negocio": m.resource?.businessUnit?.[0] || "-",
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
                    <TableCell>
                      {movement.resource?.company?.[0] || "-"}
                    </TableCell>
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMovement
                ? "Editar Movimiento"
                : "Nuevo Movimiento de Stock"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo de Combustible *
              </label>
              <Select
                value={String(formData.idFuelType)}
                onValueChange={(value) =>
                  setFormData({ ...formData, idFuelType: Number(value) })
                }
              >
                <SelectTrigger aria-invalid={!!errors.idFuelType}>
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
              {errors.idFuelType ? (
                <p className="text-destructive text-xs">{errors.idFuelType}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Recurso *</label>
              <Select
                value={String(formData.idResource)}
                onValueChange={(value) =>
                  setFormData({ ...formData, idResource: Number(value) })
                }
              >
                <SelectTrigger aria-invalid={!!errors.idResource}>
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
              {errors.idResource ? (
                <p className="text-destructive text-xs">{errors.idResource}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input
                type="datetime-local"
                value={new Date(formData.date).toISOString().slice(0, 16)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: new Date(e.target.value).toISOString(),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo de Movimiento *
              </label>
              <Select
                value={String(formData.idMovementType)}
                onValueChange={(value) =>
                  setFormData({ ...formData, idMovementType: Number(value) })
                }
              >
                <SelectTrigger aria-invalid={!!errors.idMovementType}>
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
              {errors.idMovementType ? (
                <p className="text-destructive text-xs">
                  {errors.idMovementType}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Litros *</label>
              <div className="relative">
                <Input
                  type="number"
                  value={String(formData.liters)}
                  onChange={(e) =>
                    setFormData({ ...formData, liters: Number(e.target.value) })
                  }
                  aria-invalid={!!errors.liters}
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  L
                </div>
              </div>
              {errors.liters ? (
                <p className="text-destructive text-xs">{errors.liters}</p>
              ) : null}
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
