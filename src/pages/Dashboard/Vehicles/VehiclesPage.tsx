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
} from "@/hooks/queries";
import { RESOURCE_TYPES } from "@/types/api.types";
import type { Resource, CreateResourceRequest, UpdateResourceRequest } from "@/types/api.types";

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

  const getInitialFormData = (): CreateResourceRequest => ({
    idType: RESOURCE_TYPES.VEHICLE,
    idCompany: user?.idCompany || 2,
    idBusinessUnit: undefined,
    nativeLiters: undefined,
    actualLiters: undefined,
    name: "",
    identifier: "",
  });

  const [formData, setFormData] = useState<CreateResourceRequest>({
    idType: RESOURCE_TYPES.VEHICLE,
    idCompany: user?.idCompany || 2,
    idBusinessUnit: undefined,
    nativeLiters: undefined,
    actualLiters: undefined,
    name: "",
    identifier: "",
  });

  const { data: vehicles = [], isLoading } = useVehicles();
  const { data: businessUnits = [] } = useBusinessUnits();
  
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deactivateMutation = useDeactivateResource();

  const filteredVehicles = useMemo(() => {
    let filtered = Array.isArray(vehicles) ? vehicles : [];
    filtered = filtered.filter(v => v.active !== false && v.isActive !== false);
    if (companyIdFilter && companyIdFilter > 0) filtered = filtered.filter(v => v.idCompany === companyIdFilter);
    if ((isSupervisor || isAuditor) && unidadIdsFilter?.length) {
      filtered = filtered.filter(v => v.idBusinessUnit && unidadIdsFilter.includes(v.idBusinessUnit));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => v.name.toLowerCase().includes(term) || v.identifier.toLowerCase().includes(term));
    }
    return filtered;
  }, [vehicles, searchTerm, companyIdFilter, isSupervisor, isAuditor, unidadIdsFilter]);

  const handleEdit = (v: Resource) => {
    setEditingVehicle(v);
    setFormData({
      idType: v.idType,
      idCompany: v.idCompany,
      idBusinessUnit: v.idBusinessUnit,
      nativeLiters: v.nativeLiters,
      actualLiters: v.actualLiters,
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

    const payload: CreateResourceRequest = {
      ...formData,
      nativeLiters: formData.nativeLiters ?? 0,
      actualLiters: formData.actualLiters ?? 0,
    };

    try {
      if (editingVehicle) {
        await updateMutation.mutateAsync({ id: editingVehicle.id, ...payload } as UpdateResourceRequest);
        toast.success("Vehículo actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Vehículo registrado");
      }
      setOpenDialog(false);
    } catch { toast.error("Error al guardar"); }
  };

  const handleDelete = async () => {
    if (!deleteVehicle) return;
    try {
      await deactivateMutation.mutateAsync(deleteVehicle.id);
      toast.success("Vehículo eliminado");
      setOpenDeleteDialog(false);
    } catch { toast.error("No se pudo eliminar"); }
  };

  if (isLoading) return <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER: Limpio y elegante */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Flota de Vehículos</h1>
          <p className="text-slate-500 font-medium mt-1">Administración de activos y unidades de transporte.</p>
        </div>
        <div className="flex items-center gap-3">
          {showExportButtons && (
            <Button variant="outline" onClick={() => {}} className="rounded-xl border-slate-200 font-semibold text-slate-600 bg-white shadow-sm">
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          )}
          {showCreateButtons && canManageVehicles && (
            <Button 
              onClick={() => {
                setEditingVehicle(null);
                setFormData(getInitialFormData());
                setOpenDialog(true);
              }}
              className="rounded-xl bg-[#1E2C56] hover:bg-[#2a3c74] text-white font-semibold shadow-lg shadow-blue-900/20 px-6"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Vehículo
            </Button>
          )}
        </div>
      </div>

      {/* SEARCH BAR: Estilo Search moderno */}
      <div className="relative max-w-xl px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar por patente, modelo o marca..." 
          className="pl-11 h-12 rounded-2xl border-none bg-white shadow-sm font-medium focus-visible:ring-primary/20"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GRID: Tarjetas compactas con jerarquía */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
        {filteredVehicles.map((v) => (
          <Card key={v.id} className="group border-none bg-white shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {/* Header de la tarjeta */}
              <div className="p-5 flex items-start justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#1E2C56] flex items-center justify-center text-white shadow-inner">
                    <Car size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight uppercase tracking-tight">{v.identifier}</h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate max-w-[140px]">{v.name}</p>
                  </div>
                </div>
                {!isReadOnly && canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-white rounded-full">
                        <MoreVertical size={16}/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl p-1">
                      <DropdownMenuItem onClick={() => handleEdit(v)} className="cursor-pointer font-medium text-xs gap-2 py-2">
                        <Edit size={14} className="text-blue-500" /> Editar Ficha
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setDeleteVehicle(v); setOpenDeleteDialog(true); }} className="cursor-pointer font-medium text-xs gap-2 py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600">
                        <Trash2 size={14} /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Cuerpo de la tarjeta */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacidad</span>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Scale size={14} className="text-slate-400" />
                      <span className="text-sm font-semibold">{v.nativeLiters || 0} L</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Litros actuales</span>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Droplets size={14} className="text-slate-400" />
                      <span className="text-sm font-semibold">
                        {typeof v.actualLiters === "number" ? `${v.actualLiters} L` : "N/D"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-blue-600">
                  <CheckCircle2 size={14} />
                  <span className="text-xs font-semibold">Activo</span>
                </div>

                <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                  <Building2 size={14} className="text-slate-300" />
                  <span className="text-[11px] font-medium text-slate-500 truncate">
                    {businessUnits.find(b => b.id === v.idBusinessUnit)?.name || "Sin unidad asignada"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
          <div className="bg-[#1E2C56] px-6 py-8 text-white">
            <DialogTitle className="text-xl font-semibold">Configuración de Vehículo</DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-1 font-medium">Completá la información técnica del recurso.</DialogDescription>
          </div>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Patente / ID</Label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <Input value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})} className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200" placeholder="Ej: AA123BB" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Nombre / Modelo</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-10 rounded-xl bg-slate-50/50 border-slate-200" placeholder="Ej: Scania G410" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Capacidad Tanque</Label>
                <div className="relative">
                  <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <Input type="number" value={formData.nativeLiters ?? ""} onChange={e => setFormData({...formData, nativeLiters: e.target.value ? Number(e.target.value) : undefined})} className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200" placeholder="Litros" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Litros actuales</Label>
                <div className="relative">
                  <Droplets size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <Input type="number" value={formData.actualLiters ?? ""} onChange={e => setFormData({...formData, actualLiters: e.target.value ? Number(e.target.value) : undefined})} className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-200" placeholder="Litros" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Unidad de Negocio</Label>
              <Select value={formData.idBusinessUnit ? String(formData.idBusinessUnit) : "none"} onValueChange={v => setFormData({...formData, idBusinessUnit: v === "none" ? undefined : Number(v)})}>
                <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {businessUnits.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setOpenDialog(false)} className="rounded-xl font-semibold text-slate-400 hover:text-slate-600">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl bg-[#1E2C56] text-white font-semibold px-8 shadow-lg shadow-blue-900/20">
              {editingVehicle ? "Guardar Cambios" : "Registrar Vehículo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-8 text-center border-none">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4"><Trash2 size={32} /></div>
            <DialogTitle className="text-xl font-bold text-slate-800">¿Eliminar vehículo?</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium mt-2">
              Se desactivará el vehículo <span className="text-slate-900 font-bold">{deleteVehicle?.identifier}</span>. Esta acción no se puede deshacer.
            </DialogDescription>
          </div>
          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1 rounded-xl h-11 font-semibold border-slate-200" onClick={() => setOpenDeleteDialog(false)}>No, cancelar</Button>
            <Button variant="destructive" className="flex-1 rounded-xl h-11 font-semibold shadow-lg shadow-rose-200" onClick={handleDelete}>Sí, eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}