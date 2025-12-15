import { useState, useMemo } from "react";
import {
  useBusinessUnits,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeactivateBusinessUnit,
  useCompanies,
} from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type {
  BusinessUnit,
  CreateBusinessUnitRequest,
} from "@/types/api.types";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Plus,
  Edit,
  Trash2,
  Search,
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

const initialFormData: CreateBusinessUnitRequest = {
  idCompany: 0,
  name: "",
  detail: "",
};

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

  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] =
    useState<CreateBusinessUnitRequest>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const effectiveCompanyId = idCompany || companies[0]?.id || 0;
  const {
    data: businessUnitsAll = [],
    isLoading: loadingUnits,
    error: unitsError,
  } = useBusinessUnits(effectiveCompanyId);

  const createMutation = useCreateBusinessUnit();
  const updateMutation = useUpdateBusinessUnit();
  const deactivateMutation = useDeactivateBusinessUnit();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const businessUnits = useMemo(
    () => (Array.isArray(businessUnitsAll) ? businessUnitsAll : []),
    [businessUnitsAll]
  );

  const filteredUnits = useMemo(() => {
    let filtered = businessUnits;
    if (idCompany > 0)
      filtered = filtered.filter((u) => u.idCompany === idCompany);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          (u.detail && u.detail.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [businessUnits, searchTerm, idCompany]);

  const handleNew = () => {
    if (!effectiveCompanyId) {
      toast.error("No hay una empresa activa para crear unidades de negocio");
      return;
    }
    setEditingUnit(null);
    setFormData({ idCompany: effectiveCompanyId, name: "", detail: "" });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (unit: BusinessUnit) => {
    setEditingUnit(unit);
    setFormData({
      idCompany: unit.idCompany,
      name: unit.name,
      detail: unit.detail || "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDelete = (unit: BusinessUnit) => {
    setDeleteUnit(unit);
    setOpenDeleteDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrors({ name: "El nombre es obligatorio" });
      return;
    }

    const finalCompanyId = formData.idCompany || effectiveCompanyId;
    if (!finalCompanyId) {
      setErrors({
        idCompany: "Debe existir una empresa para crear/editar la unidad",
      });
      toast.error("Debe existir una empresa para guardar la unidad");
      return;
    }

    try {
      if (editingUnit) {
        await updateMutation.mutateAsync({
          id: editingUnit.id,
          ...formData,
          idCompany: finalCompanyId,
        });
      } else {
        await createMutation.mutateAsync({
          ...formData,
          idCompany: finalCompanyId,
        });
      }
      setOpenDialog(false);
    } catch {
      toast.error("Error al procesar la solicitud");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUnit) return;
    try {
      await deactivateMutation.mutateAsync(deleteUnit.id);
      setOpenDeleteDialog(false);
      setDeleteUnit(null);
    } catch {
      toast.error("Error al desactivar");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredUnits);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Unidades");
    XLSX.writeFile(wb, "unidades_negocio.xlsx");
  };

  if (loadingUnits) {
    return (
      <div className="space-y-6">
        <div className="px-6 py-6">
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

  if (unitsError) {
    return (
      <div className="space-y-6">
        <div className="px-6 py-6">
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
    <div className="space-y-6">
      <div className="bg-background px-6 py-6">
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
                    isSaving ||
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

      <div className="p-6 space-y-4">
        <SectionCard>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar unidad por nombre..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </SectionCard>

        <SectionCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
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
            <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100">
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
                                onClick={() => handleEdit(unit)}
                                disabled={!canEdit || isSaving}
                              >
                                <Edit size={14} className="mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(unit)}
                                disabled={
                                  !canDelete || deactivateMutation.isPending
                                }
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
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="bg-primary px-6 py-8 text-primary-foreground">
            <DialogTitle className="text-xl font-bold">
              {editingUnit ? "Editar Unidad" : "Nueva Unidad de Negocio"}
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-1 font-medium">
              Configurá los detalles básicos del punto operativo.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5 bg-white">
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
                  errors.name ? "border-rose-500 ring-rose-50" : ""
                }`}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              {errors.name && (
                <p className="text-[10px] font-bold text-rose-500 ml-1">
                  {errors.name}
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
                value={formData.detail || ""}
                onChange={(e) =>
                  setFormData({ ...formData, detail: e.target.value })
                }
              />
            </div>

            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 flex gap-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                Esta unidad será vinculada automáticamente a tu empresa
                principal para el reporte de cargas de combustible.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpenDialog(false)}
              disabled={isSaving}
              className="rounded-xl font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || loadingCompanies || !effectiveCompanyId}
              className="rounded-xl bg-primary font-bold px-6 shadow-lg hover:bg-primary/90"
            >
              {editingUnit ? "Guardar Cambios" : "Crear Unidad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="¿Desactivar unidad?"
        description={
          <>
            La unidad <strong>"{deleteUnit?.name}"</strong> dejará de estar
            disponible para nuevas cargas, pero mantendrá su historial.
          </>
        }
        confirmLabel="Sí, desactivar"
        cancelLabel="No, cancelar"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
