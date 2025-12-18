/**
 * BusinessUnitsPage - Gestión de Unidades de Negocio
 * Implementa patrón CRUD con useCrudPage
 */
import { useMemo } from "react";
import {
  useBusinessUnits,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeactivateBusinessUnit,
  useCompanies,
} from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import { useCrudPage, useExcelExport } from "@/hooks";
import {
  createBusinessUnitSchema,
  type CreateBusinessUnitFormData,
} from "@/schemas";
import type {
  BusinessUnit,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
} from "@/types/api.types";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Store,
  Download,
  Building,
  CheckCircle2,
  AlertCircle,
  Info,
  MoreVertical,
  Briefcase,
} from "lucide-react";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
const DEFAULT_FORM_VALUES: CreateBusinessUnitFormData = {
  idCompany: 0,
  name: "",
  detail: "",
};

const filterBusinessUnit = (
  unit: BusinessUnit,
  searchTerm: string
): boolean => {
  const term = searchTerm.toLowerCase();
  return (
    unit.name.toLowerCase().includes(term) ||
    Boolean(unit.detail && unit.detail.toLowerCase().includes(term))
  );
};

const unitToFormData = (unit: BusinessUnit): CreateBusinessUnitFormData => ({
  idCompany: unit.idCompany,
  name: unit.name,
  detail: unit.detail || "",
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function BusinessUnitsPage() {
  const { user } = useAuthStore();
  const {
    canManageBusinessUnits,
    canEdit,
    canDelete,
    showCreateButtons,
    showExportButtons,
    isReadOnly,
    companyIdFilter,
  } = useRoleLogic();

  const idCompany = user?.empresaId ?? companyIdFilter ?? 0;
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const effectiveCompanyId = idCompany || companies[0]?.id || 0;

  // Hook CRUD genérico
  const crud = useCrudPage<
    BusinessUnit,
    CreateBusinessUnitFormData,
    CreateBusinessUnitRequest,
    UpdateBusinessUnitRequest
  >({
    useListQuery: () => useBusinessUnits(effectiveCompanyId),
    createMutation: useCreateBusinessUnit(),
    updateMutation: useUpdateBusinessUnit(),
    deleteMutation: useDeactivateBusinessUnit(),
    schema: createBusinessUnitSchema,
    defaultValues: { ...DEFAULT_FORM_VALUES, idCompany: effectiveCompanyId },
    filterFn: filterBusinessUnit,
    entityToFormData: unitToFormData,
    prepareCreateData: (data) => ({
      idCompany: data.idCompany || effectiveCompanyId,
      name: data.name,
      detail: data.detail || undefined,
    }),
    prepareUpdateData: (data, unit) => ({
      id: unit.id,
      idCompany: data.idCompany,
      name: data.name,
      detail: data.detail || undefined,
    }),
    onCreateSuccess: () => toast.success("Unidad creada correctamente"),
    onUpdateSuccess: () => toast.success("Unidad actualizada correctamente"),
    onDeleteSuccess: () => toast.success("Unidad desactivada"),
  });

  // Filtrar por empresa
  const filteredUnits = useMemo(() => {
    let filtered = crud.filteredItems;
    if (idCompany > 0) {
      filtered = filtered.filter((u) => u.idCompany === idCompany);
    }
    return filtered;
  }, [crud.filteredItems, idCompany]);

  const { form } = crud;

  // Validar empresa antes de crear
  const handleNew = () => {
    if (!effectiveCompanyId) {
      toast.error("No hay una empresa activa para crear unidades de negocio");
      return;
    }
    crud.handleNew();
  };

  const { exportToExcel } = useExcelExport<BusinessUnit>();

  const handleExport = () => {
    exportToExcel(filteredUnits, {
      fileName: "unidades_negocio",
      sheetName: "Unidades",
      transform: (u) => ({
        ID: u.id,
        Nombre: u.name,
        Detalle: u.detail || "",
        Estado: u.isActive !== false ? "Activo" : "Inactivo",
      }),
    });
  };

  if (crud.isLoading) {
    return (
      <div className="space-y-4">
        <div className="px-6 pt-4 pb-2">
          <PageHeader
            title="Unidades de Negocio"
            description="Gestioná las sedes, campos y puntos de carga de la organización"
          />
        </div>
        <div className="p-6">
          <SectionCard>
            <div className="space-y-4">
              <Skeleton className="h-10 w-64 rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (crud.error) {
    return (
      <div className="space-y-4">
        <div className="px-6 pt-4 pb-2">
          <PageHeader
            title="Unidades de Negocio"
            description="Gestioná las sedes, campos y puntos de carga de la organización"
          />
        </div>
        <div className="p-6">
          <SectionCard>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Error al cargar unidades de negocio.
              </AlertDescription>
            </Alert>
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-background px-6 pt-4 pb-2">
        <PageHeader
          title="Unidades de Negocio"
          description="Gestioná las sedes, campos y puntos de carga de la organización"
          actions={
            <div className="flex items-center gap-3">
              {showExportButtons && (
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={filteredUnits.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              )}
              {showCreateButtons && canManageBusinessUnits && (
                <Button
                  onClick={handleNew}
                  disabled={
                    isReadOnly ||
                    crud.isSaving ||
                    loadingCompanies ||
                    !effectiveCompanyId
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Unidad
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
            placeholder="Buscar unidad por nombre..."
            className="max-w-md"
          />
        </SectionCard>

        <SectionCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-4 p-5 rounded-xl bg-linear-to-br from-blue-50 to-blue-100/50 border border-blue-100">
              <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-sm">
                <Building size={26} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-blue-600/70 uppercase tracking-widest leading-none mb-1.5">
                  Total Unidades
                </p>
                <p className="text-3xl font-bold tracking-tight text-blue-900">
                  {filteredUnits.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100">
              <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none mb-1.5">
                  Activas
                </p>
                <p className="text-3xl font-bold tracking-tight text-emerald-900">
                  {filteredUnits.filter((u) => u.isActive !== false).length}
                </p>
              </div>
            </div>
          </div>

          {filteredUnits.length === 0 ? (
            <EmptyState
              icon={<Store className="size-10" />}
              title="No hay unidades de negocio"
              description={
                showCreateButtons && !isReadOnly
                  ? 'Haz clic en "Nueva Unidad" para agregar una'
                  : "No hay datos para mostrar"
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUnits.map((unit) => {
                const isActive =
                  unit.active !== false && unit.isActive !== false;
                return (
                  <Card
                    key={unit.id}
                    className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-sm ${
                      !isActive ? "opacity-60 grayscale-[0.4]" : ""
                    }`}
                  >
                    <div
                      className="h-2 w-full rounded-t-xl"
                      style={{
                        background: isActive
                          ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                          : "#e2e8f0",
                      }}
                    />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              isActive
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            <Store size={20} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold leading-tight">
                              {unit.name}
                            </h3>
                            <p className="text-[11px] font-bold text-primary/60 uppercase tracking-wider mt-0.5">
                              ID: #{unit.id}
                            </p>
                          </div>
                        </div>

                        {!isReadOnly && canManageBusinessUnits && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => crud.handleEdit(unit)}
                                disabled={!canEdit || crud.isSaving}
                              >
                                <Edit size={14} className="mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => crud.handleDelete(unit)}
                                disabled={!canDelete || crud.isDeleting}
                                className="text-destructive"
                              >
                                <Trash2 size={14} className="mr-2" /> Desactivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <p className="text-sm text-foreground/70 line-clamp-2 min-h-[44px] leading-relaxed">
                        {unit.detail ||
                          "Sin descripción adicional registrada para esta unidad."}
                      </p>

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-muted/50">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-1 text-[11px] font-bold border-none uppercase tracking-wide ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isActive ? "✓ Operativa" : "Inactiva"}
                        </Badge>
                        <div className="flex items-center text-muted-foreground/70 gap-1.5">
                          <Briefcase size={13} />
                          <span className="text-[11px] font-semibold">
                            Empresa #{unit.idCompany}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Dialogo Guardar/Editar - Refactorizado */}
      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={(open) => !open && crud.closeDialog()}
      >
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="bg-primary px-6 py-8 text-primary-foreground">
            <DialogTitle className="text-xl font-bold">
              {crud.isEditing ? "Editar Unidad" : "Nueva Unidad de Negocio"}
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-1 font-medium">
              Configurá los detalles básicos del punto operativo.
            </DialogDescription>
          </div>

          <form
            onSubmit={form.handleSubmit(crud.onSubmit)}
            className="p-6 space-y-5 bg-white"
          >
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1"
              >
                Nombre de la Unidad
              </Label>
              <Input
                id="name"
                placeholder="Ej: Sucursal Centro / Campo Norte"
                className={`h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all ${
                  form.formState.errors.name
                    ? "border-rose-500 ring-rose-50"
                    : ""
                }`}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-[10px] font-bold text-rose-500 ml-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="detail"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1"
              >
                Detalle / Notas
              </Label>
              <Textarea
                id="detail"
                placeholder="Descripción opcional de la ubicación o función..."
                className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all min-h-[100px] resize-none"
                {...form.register("detail")}
              />
            </div>

            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 flex gap-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                Esta unidad será vinculada automáticamente a tu empresa
                principal para el reporte de cargas de combustible.
              </p>
            </div>
          </form>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={crud.closeDialog}
              disabled={crud.isSaving}
              className="rounded-xl font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(crud.onSubmit)}
              disabled={
                crud.isSaving || loadingCompanies || !effectiveCompanyId
              }
              className="rounded-xl bg-primary font-bold px-6 shadow-lg hover:bg-primary/90"
            >
              {crud.isSaving
                ? "Guardando..."
                : crud.isEditing
                ? "Guardar Cambios"
                : "Crear Unidad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={crud.isDeleteDialogOpen}
        onOpenChange={(open) => !open && crud.closeDeleteDialog()}
        title="¿Desactivar unidad?"
        description={
          <>
            La unidad <strong>"{crud.deletingItem?.name}"</strong> dejará de
            estar disponible para nuevas cargas, pero mantendrá su historial.
          </>
        }
        confirmLabel={crud.isDeleting ? "Desactivando..." : "Sí, desactivar"}
        cancelLabel="No, cancelar"
        onConfirm={crud.confirmDelete}
        confirmDisabled={crud.isDeleting}
      />
    </div>
  );
}
