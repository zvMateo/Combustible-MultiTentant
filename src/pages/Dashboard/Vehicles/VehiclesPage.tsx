import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Car,
  Edit,
  Trash2,
  Download,
  Droplets,
  Building2,
  MoreVertical,
  CheckCircle2,
  Hash,
  Scale,
} from "lucide-react";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import {
  useVehicles,
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
  useBusinessUnits,
  useResourceTypes,
  useCreateResourceType,
} from "@/hooks/queries";
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
} from "@/types/api.types";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Resource | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Resource | null>(null);

  const { data: resourceTypes = [] } = useResourceTypes();

  // Buscar el idType de "Vehiculo" dinámicamente
  const vehicleTypeId = useMemo(() => {
    const vehicleType = resourceTypes.find((rt) =>
      rt.name.toLowerCase().includes("vehiculo") ||
      rt.name.toLowerCase().includes("vehicle")
    );
    return vehicleType?.id ?? 0;
  }, [resourceTypes]);

  const getInitialFormData = (): CreateResourceRequest => ({
    idType: vehicleTypeId,
    idCompany: user?.idCompany || 0,
    idBusinessUnit: undefined,
    nativeLiters: undefined,
    initialLiters: undefined,
    name: "",
    identifier: "",
  });

  const [formData, setFormData] = useState<CreateResourceRequest>({
    idType: 0,
    idCompany: user?.idCompany || 0,
    idBusinessUnit: undefined,
    nativeLiters: undefined,
    initialLiters: undefined,
    name: "",
    identifier: "",
  });

  const { data: vehicles = [], isLoading } = useVehicles();
  const { data: businessUnits = [] } = useBusinessUnits();

  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deactivateMutation = useDeactivateResource();
  const createResourceTypeMutation = useCreateResourceType();

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

  const filteredVehicles = useMemo(() => {
    let filtered = Array.isArray(vehicles) ? vehicles : [];
    filtered = filtered.filter(
      (v) => v.active !== false && v.isActive !== false
    );
    if (companyIdFilter && companyIdFilter > 0)
      filtered = filtered.filter((v) => v.idCompany === companyIdFilter);
    if ((isSupervisor || isAuditor) && unidadIdsFilter?.length) {
      filtered = filtered.filter(
        (v) => v.idBusinessUnit && unidadIdsFilter.includes(v.idBusinessUnit)
      );
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.identifier.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [
    vehicles,
    searchTerm,
    companyIdFilter,
    isSupervisor,
    isAuditor,
    unidadIdsFilter,
  ]);

  const handleEdit = (v: Resource) => {
    setEditingVehicle(v);
    setFormData({
      idType: v.idType,
      idCompany: v.idCompany,
      idBusinessUnit: v.idBusinessUnit,
      nativeLiters: v.nativeLiters,
      initialLiters: v.initialLiters,
      name: v.name,
      identifier: v.identifier,
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.identifier.trim()) {
      toast.error("Faltan datos obligatorios");
      return;
    }

    const finalIdType = formData.idType || vehicleTypeId;
    if (!finalIdType || finalIdType === 0) {
      toast.error("No existe el tipo 'Vehículo' en tu empresa. Crealo primero en Recursos.");
      return;
    }

    const payload: CreateResourceRequest = {
      ...formData,
      idType: finalIdType,
      idCompany: formData.idCompany || user?.idCompany || 0,
      nativeLiters: formData.nativeLiters ?? 0,
      initialLiters: formData.initialLiters ?? 0,
    };

    try {
      if (editingVehicle) {
        await updateMutation.mutateAsync({
          id: editingVehicle.id,
          ...payload,
        } as UpdateResourceRequest);
        toast.success("Vehículo actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Vehículo registrado");
      }
      setOpenDialog(false);
    } catch {
      toast.error("Error al guardar");
    }
  };

  const handleDelete = async () => {
    if (!deleteVehicle) return;
    try {
      await deactivateMutation.mutateAsync(deleteVehicle.id);
      toast.success("Vehículo eliminado");
      setOpenDeleteDialog(false);
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  if (isLoading)
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
                  {createResourceTypeMutation.isPending ? "Creando..." : "Crear tipo Vehículo"}
                </Button>
              )}
              {showCreateButtons && canManageVehicles && vehicleTypeId > 0 && (
                <Button
                  onClick={() => {
                    setEditingVehicle(null);
                    setFormData(getInitialFormData());
                    setOpenDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Vehículo
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="px-6 pb-6 space-y-4">
        <SectionCard>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por patente, modelo o marca..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                            <DropdownMenuItem onClick={() => handleEdit(v)}>
                              <Edit size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteVehicle(v);
                                setOpenDeleteDialog(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" /> Eliminar
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

                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-semibold">Activo</span>
                      </div>

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
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingVehicle(null);
            setFormData(getInitialFormData());
          }
        }}
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

          <div className="p-6 space-y-5 bg-white">
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
                    value={formData.identifier}
                    onChange={(e) =>
                      setFormData({ ...formData, identifier: e.target.value })
                    }
                    className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200"
                    placeholder="Ej: AA123BB"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                  Nombre / Modelo
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-10 rounded-xl bg-slate-50/50 border-slate-200"
                  placeholder="Ej: Scania G410"
                />
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
                    value={formData.nativeLiters ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nativeLiters: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
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
                    value={formData.initialLiters ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        initialLiters: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
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
                value={
                  formData.idBusinessUnit
                    ? String(formData.idBusinessUnit)
                    : "none"
                }
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    idBusinessUnit: v === "none" ? undefined : Number(v),
                  })
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
          </div>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setOpenDialog(false)}
              className="rounded-xl font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-8 shadow-lg hover:bg-primary/90"
            >
              {editingVehicle ? "Guardar Cambios" : "Registrar Vehículo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="¿Eliminar vehículo?"
        description={
          <>
            Se desactivará el vehículo{" "}
            <strong>{deleteVehicle?.identifier}</strong>. Esta acción no se
            puede deshacer.
          </>
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="No, cancelar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
