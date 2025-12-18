/**
 * TanksPage - Gestión de Tanques de Combustible
 *
 * Implementa el patrón CRUD usando el hook useCrudPage
 * Principios Clean Code aplicados:
 * - Single Responsibility: Componentes separados por responsabilidad
 * - DRY: Lógica CRUD centralizada en hook
 * - Composition: UI compuesta de componentes reutilizables
 */
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { SearchInput } from "@/components/common/DataTable";
import {
  Download,
  Fuel,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useCrudPage, useExcelExport } from "@/hooks";
import { createResourceSchema, type CreateResourceFormData } from "@/schemas";
import {
  useTanks,
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
  useCompanies,
  useBusinessUnits,
} from "@/hooks/queries";
import type { Resource, UpdateResourceRequest } from "@/types/api.types";
import { RESOURCE_TYPES } from "@/types/api.types";

// ============================================
// CONSTANTES
// ============================================
const DEFAULT_FORM_VALUES: CreateResourceFormData = {
  idType: RESOURCE_TYPES.TANK,
  idCompany: 0,
  idBusinessUnit: undefined,
  nativeLiters: undefined,
  name: "",
  identifier: "",
};

// ============================================
// HELPERS
// ============================================
/** Filtra tanques por término de búsqueda */
const filterTank = (tank: Resource, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase();
  return (
    tank.name.toLowerCase().includes(term) ||
    tank.identifier.toLowerCase().includes(term)
  );
};

/** Convierte un tanque a datos del formulario */
const tankToFormData = (tank: Resource): CreateResourceFormData => ({
  idType: tank.idType,
  idCompany: tank.idCompany,
  idBusinessUnit: tank.idBusinessUnit,
  nativeLiters: tank.nativeLiters,
  name: tank.name,
  identifier: tank.identifier,
});

/** Prepara datos para actualización */
const prepareUpdateData = (
  data: CreateResourceFormData,
  tank: Resource
): UpdateResourceRequest => ({
  id: tank.id,
  ...data,
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function TanksPage() {
  const { user } = useAuthStore();
  const idCompany = user?.idCompany ?? 0;

  // Queries auxiliares
  const { data: companies = [] } = useCompanies();
  const { data: businessUnits = [] } = useBusinessUnits();

  // Hook CRUD genérico
  const crud = useCrudPage<
    Resource,
    CreateResourceFormData,
    CreateResourceFormData,
    UpdateResourceRequest
  >({
    useListQuery: useTanks,
    createMutation: useCreateResource(),
    updateMutation: useUpdateResource(),
    deleteMutation: useDeactivateResource(),
    schema: createResourceSchema,
    defaultValues: { ...DEFAULT_FORM_VALUES, idCompany },
    filterFn: filterTank,
    entityToFormData: tankToFormData,
    prepareUpdateData,
  });

  // Filtrar por empresa del usuario
  const filteredByCompany = crud.filteredItems.filter(
    (t) => !idCompany || t.idCompany === idCompany
  );

  // Export handler
  const { exportToExcel } = useExcelExport<Resource>();

  const handleExport = () => {
    exportToExcel(filteredByCompany, {
      fileName: "tanques",
      sheetName: "Tanques",
      transform: (t) => ({
        Nombre: t.name,
        Identificador: t.identifier,
        "Capacidad (L)": t.nativeLiters || 0,
        Empresa: companies.find((c) => c.id === t.idCompany)?.name || "",
        "Unidad de Negocio":
          businessUnits.find((bu) => bu.id === t.idBusinessUnit)?.name || "",
        Estado: t.isActive !== false ? "Activo" : "Inactivo",
      }),
    });
  };

  // Loading state
  if (crud.isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-background px-6 pt-4 pb-2">
          <PageHeader title="Tanques" description="Cargando tanques..." />
        </div>
        <div className="p-6">
          <SectionCard>
            <div className="flex items-center gap-2">
              <Spinner className="size-4" />
              <span className="text-sm text-muted-foreground">
                Cargando tanques...
              </span>
            </div>
          </SectionCard>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (crud.error) {
    return (
      <div className="space-y-4">
        <div className="bg-background px-6 pt-4 pb-2">
          <PageHeader title="Tanques" description="No se pudieron cargar" />
        </div>
        <div className="p-6">
          <SectionCard>
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Error al cargar tanques: {crud.error.message}
              </AlertDescription>
            </Alert>
          </SectionCard>
        </div>
      </div>
    );
  }

  // Desestructurar form del crud para acceso más limpio
  const { form } = crud;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-background px-6 pt-4 pb-2">
        <PageHeader
          title="Tanques"
          description={`${filteredByCompany.length} ${
            filteredByCompany.length === 1 ? "tanque" : "tanques"
          } registrados`}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={filteredByCompany.length === 0}
                className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Download className="mr-2 h-4 w-4 text-slate-400" />
                Exportar
              </Button>
              <Button
                type="button"
                onClick={crud.handleNew}
                disabled={crud.isSaving}
                className="h-10 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95"
              >
                <Plus className="mr-2 h-4 w-4 text-white" />
                Nuevo Tanque
              </Button>
            </>
          }
        />
      </div>

      <div className="p-6 space-y-4">
        {/* Búsqueda */}
        <SectionCard>
          <SearchInput
            value={crud.searchTerm}
            onChange={crud.setSearchTerm}
            placeholder="Buscar por nombre o identificador..."
            className="max-w-md"
          />
        </SectionCard>

        {/* Grid de tanques */}
        <SectionCard>
          {filteredByCompany.length === 0 ? (
            <EmptyState
              icon={<Fuel className="size-10" />}
              title="No hay tanques registrados"
              description='Haz clic en "Nuevo Tanque" para agregar uno'
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filteredByCompany.map((tank) => (
                <TankCard
                  key={tank.id}
                  tank={tank}
                  company={companies.find((c) => c.id === tank.idCompany)}
                  businessUnit={businessUnits.find(
                    (bu) => bu.id === tank.idBusinessUnit
                  )}
                  onEdit={() => crud.handleEdit(tank)}
                  onDelete={() => crud.handleDelete(tank)}
                  isUpdating={crud.isSaving}
                  isDeleting={crud.isDeleting}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Dialog de crear/editar */}
        <Dialog
          open={crud.isDialogOpen}
          onOpenChange={(open) => !open && crud.closeDialog()}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {crud.isEditing ? "Editar Tanque" : "Nuevo Tanque"}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(crud.onSubmit)}
              className="grid gap-4 sm:grid-cols-2"
            >
              {companies.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Empresa *</label>
                  <Select
                    value={String(form.watch("idCompany") || "")}
                    onValueChange={(value) =>
                      form.setValue("idCompany", Number(value))
                    }
                  >
                    <SelectTrigger
                      aria-invalid={!!form.formState.errors.idCompany}
                    >
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.idCompany && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.idCompany.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Unidad de Negocio (opcional)
                </label>
                <Select
                  value={String(form.watch("idBusinessUnit") || "none")}
                  onValueChange={(value) =>
                    form.setValue(
                      "idBusinessUnit",
                      value === "none" ? undefined : Number(value)
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {businessUnits
                      .filter((bu) => bu.idCompany === form.watch("idCompany"))
                      .map((bu) => (
                        <SelectItem key={bu.id} value={String(bu.id)}>
                          {bu.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nombre del Tanque *
                </label>
                <Input
                  {...form.register("name")}
                  aria-invalid={!!form.formState.errors.name}
                  autoFocus
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Identificador *</label>
                <Input
                  {...form.register("identifier")}
                  aria-invalid={!!form.formState.errors.identifier}
                />
                {form.formState.errors.identifier && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.identifier.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Capacidad (Litros)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    {...form.register("nativeLiters", { valueAsNumber: true })}
                  />
                  <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    L
                  </div>
                </div>
              </div>
            </form>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={crud.closeDialog}
              >
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
                  : "Crear Tanque"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmación de eliminación */}
        <ConfirmDialog
          open={crud.isDeleteDialogOpen}
          onOpenChange={(open) => !open && crud.closeDeleteDialog()}
          title="Confirmar Desactivación"
          description={
            <>
              ¿Estás seguro de desactivar el tanque{" "}
              <strong>{crud.deletingItem?.name}</strong>? Esta acción no se
              puede deshacer.
            </>
          }
          confirmLabel={crud.isDeleting ? "Desactivando..." : "Desactivar"}
          onConfirm={crud.confirmDelete}
          confirmDisabled={crud.isDeleting}
        />
      </div>
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface TankCardProps {
  tank: Resource;
  company?: { name: string };
  businessUnit?: { name: string };
  onEdit: () => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

/** Tarjeta individual de tanque - Componente puro */
function TankCard({
  tank,
  company,
  businessUnit,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting,
}: TankCardProps) {
  return (
    <Card className="border-border transition-shadow hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-3 pt-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
            <Fuel className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{tank.name}</div>
            <Badge variant="outline" className="mt-1">
              {tank.identifier}
            </Badge>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {tank.nativeLiters && (
            <Badge variant="secondary">{tank.nativeLiters} L</Badge>
          )}
          <Badge
            variant="secondary"
            className={
              tank.isActive !== false
                ? "text-emerald-700 bg-emerald-100"
                : "text-amber-700 bg-amber-100"
            }
          >
            {tank.isActive !== false ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        {/* Info */}
        <div className="text-muted-foreground space-y-1 text-xs">
          {company && <div className="truncate">{company.name}</div>}
          {businessUnit && <div className="truncate">{businessUnit.name}</div>}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onEdit}
            disabled={isUpdating}
            aria-label="Editar"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Desactivar"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
