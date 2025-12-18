/**
 * MovementTypesTab - Gestión de Tipos de Movimiento
 * Implementa patrón CRUD con useCrudPage
 */
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Shuffle, TriangleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  useMovementTypes,
  useCreateMovementType,
  useUpdateMovementType,
  useDeactivateMovementType,
} from "@/hooks/queries";
import { useIdBusinessUnit, useIdCompany } from "@/stores/auth.store";
import { useUnidadActivaId } from "@/stores/unidad.store";
import { useCrudPage } from "@/hooks/useCrudPage";
import {
  createMovementTypeSchema,
  type CreateMovementTypeFormData,
} from "@/schemas";
import type {
  MovementType,
  CreateMovementTypeRequest,
  UpdateMovementTypeRequest,
} from "@/types/api.types";

// ============================================
// HELPERS
// ============================================
const movementTypeToFormData = (
  type: MovementType
): CreateMovementTypeFormData => ({
  name: type.name,
  idCompany: type.idCompany ?? 0,
  idBusinessUnit: type.idBusinessUnit ?? undefined,
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function MovementTypesTab() {
  const companyId = useIdCompany() ?? 0;
  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = useIdBusinessUnit();
  const businessUnitId = activeBusinessUnitId ?? userBusinessUnitId ?? null;

  // Estado para toggle (activar/desactivar)
  const [openToggleDialog, setOpenToggleDialog] = useState(false);
  const [toggleType, setToggleType] = useState<MovementType | null>(null);

  const deactivateMutation = useDeactivateMovementType();

  // Hook CRUD genérico
  const crud = useCrudPage<
    MovementType,
    CreateMovementTypeFormData,
    CreateMovementTypeRequest,
    UpdateMovementTypeRequest
  >({
    useListQuery: useMovementTypes,
    createMutation: useCreateMovementType(),
    updateMutation: useUpdateMovementType(),
    deleteMutation: deactivateMutation,
    schema: createMovementTypeSchema,
    defaultValues: {
      name: "",
      idCompany: companyId,
      idBusinessUnit: businessUnitId ?? undefined,
    },
    entityToFormData: movementTypeToFormData,
    prepareCreateData: (data) => ({
      name: data.name,
      idCompany: companyId,
      idBusinessUnit: data.idBusinessUnit ?? businessUnitId ?? undefined,
    }),
    prepareUpdateData: (data, type) => ({
      id: type.id,
      name: data.name,
      idCompany: companyId,
      idBusinessUnit: data.idBusinessUnit ?? businessUnitId ?? null,
    }),
  });

  const { form } = crud;
  const movementTypes = crud.items;

  const handleToggleActive = async (id: number) => {
    try {
      await deactivateMutation.mutateAsync(id);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleToggleClick = (type: MovementType) => {
    setToggleType(type);
    setOpenToggleDialog(true);
  };

  if (crud.isLoading) {
    return (
      <SectionCard>
        <div className="flex items-center gap-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Cargando tipos de movimiento...
          </span>
        </div>
      </SectionCard>
    );
  }

  if (crud.error) {
    return (
      <SectionCard>
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error al cargar tipos de movimiento:{" "}
            {crud.error instanceof Error
              ? crud.error.message
              : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Tipos de Movimiento"
        description="Maestro de tipos de movimiento de stock"
        actions={
          <Button onClick={crud.handleNew} disabled={crud.isSaving} size="sm">
            <Plus className="size-4" />
            Nuevo Tipo
          </Button>
        }
      >
        {movementTypes.length === 0 ? (
          <EmptyState
            icon={<Shuffle className="size-10" />}
            title="No hay tipos de movimiento configurados"
            description='Haz clic en "Nuevo Tipo" para crear el primero'
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="w-[140px] text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-mono text-xs">
                      {type.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shuffle className="size-4 text-blue-600" />
                        <span className="font-medium">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          type.active !== false ? "secondary" : "outline"
                        }
                      >
                        {type.active !== false ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => crud.handleEdit(type)}
                          disabled={crud.isSaving}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Switch
                          checked={type.active !== false}
                          onCheckedChange={() => handleToggleClick(type)}
                          disabled={deactivateMutation.isPending}
                          aria-label={
                            type.active !== false ? "Desactivar" : "Activar"
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={(open) => !open && crud.closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {crud.isEditing
                ? "Editar Tipo de Movimiento"
                : "Nuevo Tipo de Movimiento"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(crud.onSubmit)}
            className="grid gap-2"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                {...form.register("name")}
                placeholder="Ej: Carga, Consumo, Transferencia"
                autoFocus
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={crud.closeDialog}>
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(crud.onSubmit)}
              disabled={crud.isSaving}
            >
              {crud.isSaving
                ? "Guardando..."
                : crud.isEditing
                ? "Guardar Cambios"
                : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={openToggleDialog}
        onOpenChange={(open) => {
          setOpenToggleDialog(open);
          if (!open) setToggleType(null);
        }}
        title={
          toggleType?.active !== false
            ? "Confirmar desactivación"
            : "Confirmar activación"
        }
        description={
          <>
            ¿Estás seguro de{" "}
            {toggleType?.active !== false ? "desactivar" : "activar"} el tipo de
            movimiento <strong>{toggleType?.name}</strong>?
          </>
        }
        confirmLabel={
          deactivateMutation.isPending
            ? "Procesando..."
            : toggleType?.active !== false
            ? "Desactivar"
            : "Activar"
        }
        onConfirm={async () => {
          if (!toggleType) return;
          await handleToggleActive(toggleType.id);
          setOpenToggleDialog(false);
          setToggleType(null);
        }}
        confirmDisabled={deactivateMutation.isPending}
      />
    </>
  );
}
