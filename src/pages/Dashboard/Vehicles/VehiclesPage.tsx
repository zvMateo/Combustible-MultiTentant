/**
 * VehiclesPage - Gestión de Flota de Vehículos
 * Implementa patrón CRUD con useCrudPage
 */
import { useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Car,
  Edit,
  Trash2,
  Download,
  Droplets,
  Building2,
  MoreVertical,
  Hash,
  Scale,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import { useCrudPage } from "@/hooks/useCrudPage";
import { createResourceSchema, type CreateResourceFormData } from "@/schemas";
import {
  useVehicles,
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
  useBusinessUnits,
  useResourceTypes,
  useCreateResourceType,
} from "@/hooks/queries";
import type { Resource, UpdateResourceRequest } from "@/types/api.types";

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SearchInput } from "@/components/common/DataTable";

// ============================================
// HELPERS
// ============================================
const DEFAULT_FORM_VALUES: CreateResourceFormData = {
  idType: 0,
  idCompany: 0,
  idBusinessUnit: undefined,
  nativeLiters: undefined,
  initialLiters: undefined,
  name: "",
  identifier: "",
};

const filterVehicle = (vehicle: Resource, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase();
  return (
    vehicle.name.toLowerCase().includes(term) ||
    vehicle.identifier.toLowerCase().includes(term)
  );
};

const vehicleToFormData = (vehicle: Resource): CreateResourceFormData => ({
  idType: vehicle.idType,
  idCompany: vehicle.idCompany,
  idBusinessUnit: vehicle.idBusinessUnit,
  nativeLiters: vehicle.nativeLiters,
  initialLiters: vehicle.initialLiters,
  name: vehicle.name,
  identifier: vehicle.identifier,
});

const prepareUpdateData = (
  data: CreateResourceFormData,
  vehicle: Resource
): UpdateResourceRequest => ({
  id: vehicle.id,
  ...data,
  nativeLiters: data.nativeLiters ?? 0,
  initialLiters: data.initialLiters ?? 0,
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function VehiclesPage() {
  const { user } = useAuthStore();
  const {
    isSupervisor,
    isAuditor,
    canManageVehicles,
    canEdit,
    showCreateButtons,
    showExportButtons,
    isReadOnly,
    unidadIdsFilter,
    companyIdFilter,
  } = useRoleLogic();

  const { data: resourceTypes = [] } = useResourceTypes();
  const { data: businessUnits = [] } = useBusinessUnits();
  const createResourceTypeMutation = useCreateResourceType();

  // Buscar el idType de "Vehiculo" dinámicamente
  const vehicleTypeId = useMemo(() => {
    const vehicleType = resourceTypes.find(
      (rt) =>
        rt.name.toLowerCase().includes("vehiculo") ||
        rt.name.toLowerCase().includes("vehicle")
    );
    return vehicleType?.id ?? 0;
  }, [resourceTypes]);

  // Hook CRUD genérico
  const crud = useCrudPage<
    Resource,
    CreateResourceFormData,
    CreateResourceFormData,
    UpdateResourceRequest
  >({
    useListQuery: useVehicles,
    createMutation: useCreateResource(),
    updateMutation: useUpdateResource(),
    deleteMutation: useDeactivateResource(),
    schema: createResourceSchema,
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      idType: vehicleTypeId,
      idCompany: user?.idCompany || 0,
    },
    filterFn: filterVehicle,
    entityToFormData: vehicleToFormData,
    prepareCreateData: (data) => ({
      ...data,
      idType: data.idType || vehicleTypeId,
      idCompany: data.idCompany || user?.idCompany || 0,
      nativeLiters: data.nativeLiters ?? 0,
      initialLiters: data.initialLiters ?? 0,
    }),
    prepareUpdateData,
    onCreateSuccess: () => toast.success("Vehículo registrado"),
    onUpdateSuccess: () => toast.success("Vehículo actualizado"),
    onDeleteSuccess: () => toast.success("Vehículo eliminado"),
  });

  // Filtrar por empresa y unidad de negocio
  const filteredVehicles = useMemo(() => {
    let filtered = crud.filteredItems.filter(
      (v) => v.active !== false && v.isActive !== false
    );
    if (companyIdFilter && companyIdFilter > 0) {
      filtered = filtered.filter((v) => v.idCompany === companyIdFilter);
    }
    if ((isSupervisor || isAuditor) && unidadIdsFilter?.length) {
      filtered = filtered.filter(
        (v) => v.idBusinessUnit && unidadIdsFilter.includes(v.idBusinessUnit)
      );
    }
    return filtered;
  }, [
    crud.filteredItems,
    companyIdFilter,
    isSupervisor,
    isAuditor,
    unidadIdsFilter,
  ]);

  const { form } = crud;

  const handleCreateVehicleType = async () => {
    const companyId = user?.idCompany || 0;
    if (!companyId) {
      toast.error("No se pudo determinar la empresa");
      return;
    }
    try {
      await createResourceTypeMutation.mutateAsync({
        name: "Vehiculo",
        idCompany: companyId,
      });
      toast.success("Tipo 'Vehículo' creado. Ya podés agregar vehículos.");
    } catch {
      toast.error("Error al crear el tipo de recurso");
    }
  };

  // Validar tipo antes de crear
  const handleNew = () => {
    if (!vehicleTypeId || vehicleTypeId === 0) {
      toast.error(
        "No existe el tipo 'Vehículo' en tu empresa. Crealo primero."
      );
      return;
    }
    crud.handleNew();
  };

  if (crud.isLoading)
    return (
      <div className="space-y-4">
        <div className="bg-background px-6 pt-4 pb-2">
          <PageHeader
            title="Flota de Vehículos"
            description="Administración de activos y unidades de transporte"
          />
        </div>
        <div className="p-6">
          <SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </SectionCard>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="bg-background px-6 pt-4 pb-2">
        <PageHeader
          title="Flota de Vehículos"
          description="Administración de activos y unidades de transporte"
          actions={
            <div className="flex items-center gap-3">
              {showExportButtons && (
                <Button variant="outline" onClick={() => {}}>
                  <Download className="mr-2 h-4 w-4" /> Exportar
                </Button>
              )}
              {showCreateButtons && canManageVehicles && !vehicleTypeId && (
                <Button
                  variant="outline"
                  onClick={handleCreateVehicleType}
                  disabled={createResourceTypeMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createResourceTypeMutation.isPending
                    ? "Creando..."
                    : "Crear tipo Vehículo"}
                </Button>
              )}
              {showCreateButtons && canManageVehicles && vehicleTypeId > 0 && (
                <Button onClick={handleNew}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Vehículo
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="px-6 pb-6 space-y-4">
        <SectionCard>
          <SearchInput
            value={crud.searchTerm}
            onChange={crud.setSearchTerm}
            placeholder="Buscar por patente, modelo o marca..."
            className="max-w-xl"
          />
        </SectionCard>

        <SectionCard>
          {filteredVehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="size-10" />}
              title="No hay vehículos registrados"
              description={
                showCreateButtons && !isReadOnly
                  ? 'Haz clic en "Nuevo Vehículo" para agregar uno'
                  : "No hay datos para mostrar"
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVehicles.map((v) => (
                <Card
                  key={v.id}
                  className="group hover:shadow-md transition-all"
                >
                  <CardContent className="p-0">
                    <div className="p-5 flex items-start justify-between bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                          <Car size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm uppercase tracking-tight">
                            {v.identifier}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {v.name}
                          </p>
                        </div>
                      </div>
                      {!isReadOnly && canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => crud.handleEdit(v)}
                            >
                              <Edit size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => crud.handleDelete(v)}
                              className="text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" /> Desactivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Capacidad
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Scale
                              size={14}
                              className="text-muted-foreground"
                            />
                            <span className="text-sm font-semibold">
                              {v.nativeLiters || 0} L
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Litros actuales
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Droplets
                              size={14}
                              className="text-muted-foreground"
                            />
                            <span className="text-sm font-semibold">
                              {typeof v.actualLiters === "number"
                                ? `${v.actualLiters} L`
                                : typeof v.initialLiters === "number"
                                ? `${v.initialLiters} L`
                                : "N/D"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <StatusBadge active={true} />

                      <div className="pt-3 border-t flex items-center gap-2">
                        <Building2
                          size={14}
                          className="text-muted-foreground"
                        />
                        <span className="text-xs text-muted-foreground truncate">
                          {businessUnits.find((b) => b.id === v.idBusinessUnit)
                            ?.name || "Sin unidad asignada"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* DIALOG: Formulario compacto */}
      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={(open) => !open && crud.closeDialog()}
      >
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <div className="bg-primary px-6 py-8 text-primary-foreground">
            <DialogTitle className="text-xl font-semibold">
              Configuración de Vehículo
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-1 font-medium">
              Completá la información técnica del recurso.
            </DialogDescription>
          </div>

          <form
            onSubmit={form.handleSubmit(crud.onSubmit)}
            className="p-6 space-y-5 bg-white"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                  Patente / ID
                </Label>
                <div className="relative">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <Input
                    {...form.register("identifier")}
                    className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200"
                    placeholder="Ej: AA123BB"
                  />
                </div>
                {form.formState.errors.identifier && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.identifier.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                  Nombre / Modelo
                </Label>
                <Input
                  {...form.register("name")}
                  className="h-10 rounded-xl bg-slate-50/50 border-slate-200"
                  placeholder="Ej: Scania G410"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                  Capacidad Tanque
                </Label>
                <div className="relative">
                  <Scale
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <Input
                    type="number"
                    {...form.register("nativeLiters", { valueAsNumber: true })}
                    className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200"
                    placeholder="Litros"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                  Litros actuales
                </Label>
                <div className="relative">
                  <Droplets
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <Input
                    type="number"
                    {...form.register("initialLiters", { valueAsNumber: true })}
                    className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200"
                    placeholder="Litros"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                Unidad de Negocio
              </Label>
              <Select
                value={String(form.watch("idBusinessUnit") || "none")}
                onValueChange={(v) =>
                  form.setValue(
                    "idBusinessUnit",
                    v === "none" ? undefined : Number(v)
                  )
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {businessUnits.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={crud.closeDialog}
              className="rounded-xl font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(crud.onSubmit)}
              disabled={crud.isSaving}
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-8 shadow-lg hover:bg-primary/90"
            >
              {crud.isSaving
                ? "Guardando..."
                : crud.isEditing
                ? "Guardar Cambios"
                : "Registrar Vehículo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={crud.isDeleteDialogOpen}
        onOpenChange={(open) => !open && crud.closeDeleteDialog()}
        title="¿Eliminar vehículo?"
        description={
          <>
            Se desactivará el vehículo{" "}
            <strong>{crud.deletingItem?.identifier}</strong>. Esta acción no se
            puede deshacer.
          </>
        }
        confirmLabel={crud.isDeleting ? "Eliminando..." : "Sí, eliminar"}
        cancelLabel="No, cancelar"
        onConfirm={crud.confirmDelete}
        confirmDisabled={crud.isDeleting}
      />
    </div>
  );
}
