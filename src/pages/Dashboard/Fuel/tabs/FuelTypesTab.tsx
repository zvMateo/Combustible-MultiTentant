// src/pages/Dashboard/Fuel/tabs/FuelTypesTab.tsx
import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  Layers,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  TriangleAlert,
} from "lucide-react";
import {
  useFuelTypes,
  useCreateFuelType,
  useUpdateFuelType,
  useDeactivateFuelType,
} from "@/hooks/queries";
import type {
  FuelType,
  CreateFuelTypeRequest,
  UpdateFuelTypeRequest,
} from "@/types/api.types";

export default function FuelTypesTab() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState<FuelType | null>(null);
  const [formData, setFormData] = useState<CreateFuelTypeRequest>({
    name: "",
  });
  const [errors, setErrors] = useState({ name: "" });

  // React Query hooks
  const { data: fuelTypes = [], isLoading, error } = useFuelTypes();
  const createMutation = useCreateFuelType();
  const updateMutation = useUpdateFuelType();
  const deactivateMutation = useDeactivateFuelType();

  const handleNew = () => {
    setEditingType(null);
    setFormData({ name: "" });
    setErrors({ name: "" });
    setOpenDialog(true);
  };

  const handleEdit = (type: FuelType) => {
    setEditingType(type);
    setFormData({ name: type.name });
    setErrors({ name: "" });
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors = { name: "" };

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    setErrors(newErrors);
    return !newErrors.name;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingType) {
        const updateData: UpdateFuelTypeRequest = {
          id: editingType.id,
          name: formData.name,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(formData);
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await deactivateMutation.mutateAsync(id);
    } catch {
      // Error manejado por el mutation
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center gap-2 pt-6">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Cargando tipos de combustible...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Error al cargar tipos de combustible:{" "}
              {error instanceof Error ? error.message : "Error desconocido"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Tipos de Combustible</CardTitle>
          <CardDescription>
            Maestro de tipos de combustible disponibles
          </CardDescription>
        </div>
        <Button
          onClick={handleNew}
          disabled={createMutation.isPending}
          size="sm"
        >
          <Plus className="size-4" />
          Nuevo Tipo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[140px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-mono text-xs">{type.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-amber-500" />
                      <span className="font-medium">{type.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        type.isActive !== false ? "secondary" : "outline"
                      }
                    >
                      {type.isActive !== false ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleEdit(type)}
                        disabled={updateMutation.isPending}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={
                          type.isActive !== false ? "destructive" : "secondary"
                        }
                        size="icon-sm"
                        onClick={() => handleToggleActive(type.id)}
                        disabled={deactivateMutation.isPending}
                        aria-label={
                          type.isActive !== false ? "Desactivar" : "Activar"
                        }
                      >
                        {type.isActive !== false ? (
                          <ToggleLeft className="size-4" />
                        ) : (
                          <ToggleRight className="size-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {fuelTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                      <Layers className="size-8" />
                      <span>No hay tipos de combustible configurados</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType
                ? "Editar Tipo de Combustible"
                : "Nuevo Tipo de Combustible"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Ej: Nafta Super, Diesel Premium"
                autoFocus
                aria-invalid={!!errors.name}
              />
              {errors.name ? (
                <p className="text-destructive text-xs">{errors.name}</p>
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
                : editingType
                ? "Guardar Cambios"
                : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
