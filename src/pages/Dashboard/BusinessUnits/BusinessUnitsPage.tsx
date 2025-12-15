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
  const [formData, setFormData] = useState<CreateBusinessUnitRequest>(initialFormData);
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

  const businessUnits = useMemo(() => (Array.isArray(businessUnitsAll) ? businessUnitsAll : []), [businessUnitsAll]);

  const filteredUnits = useMemo(() => {
    let filtered = businessUnits;
    if (idCompany > 0) filtered = filtered.filter((u) => u.idCompany === idCompany);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(term) || (u.detail && u.detail.toLowerCase().includes(term)));
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
    setFormData({ idCompany: unit.idCompany, name: unit.name, detail: unit.detail || "" });
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
      setErrors({ idCompany: "Debe existir una empresa para crear/editar la unidad" });
      toast.error("Debe existir una empresa para guardar la unidad");
      return;
    }

    try {
      if (editingUnit) {
        await updateMutation.mutateAsync({ id: editingUnit.id, ...formData, idCompany: finalCompanyId });
      } else {
        await createMutation.mutateAsync({ ...formData, idCompany: finalCompanyId });
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
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (unitsError) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error al cargar unidades de negocio.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Sección */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Unidades de Negocio</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Gestioná las sedes, campos y puntos de carga de la organización.</p>
        </div>

        <div className="flex items-center gap-3">
          {showExportButtons && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredUnits.length === 0}
              className="h-10 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              <Download className="mr-2 h-4 w-4 text-slate-400" />
              Exportar
            </Button>
          )}
          {showCreateButtons && canManageBusinessUnits && (
            <Button
              onClick={handleNew}
              disabled={isReadOnly || isSaving || loadingCompanies || !effectiveCompanyId}
              className="h-10 rounded-xl bg-[#1E2C56] font-semibold text-white shadow-lg transition-all hover:bg-[#2a3c74] active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Unidad
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar unidad por nombre..."
          className="h-12 pl-11 rounded-2xl border-none bg-white shadow-sm focus-visible:ring-primary/20 text-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Building size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
              <p className="text-2xl font-bold text-slate-800 tracking-tight">{filteredUnits.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#1E2C56]/10 flex items-center justify-center text-[#1E2C56]">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Activas</p>
              <p className="text-2xl font-bold text-slate-800 tracking-tight">{filteredUnits.filter(u => u.isActive !== false).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Contenido */}
      {filteredUnits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => {
            const isActive = unit.active !== false && unit.isActive !== false;
            return (
              <Card key={unit.id} className={`group border-none bg-white shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden ${!isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                <div className="h-1.5 w-full" style={{ backgroundColor: isActive ? '#10b981' : '#cbd5e1' }} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-slate-50 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Store size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800 leading-tight">{unit.name}</h3>
                        <p className="text-[11px] font-bold text-primary/60 uppercase tracking-wider mt-0.5">ID: #{unit.id}</p>
                      </div>
                    </div>
                    
                    {!isReadOnly && canManageBusinessUnits && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical size={16} className="text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                          <DropdownMenuItem
                            onClick={() => handleEdit(unit)}
                            disabled={!canEdit || isSaving}
                            className="cursor-pointer gap-2 text-sm font-medium py-2"
                          >
                            <Edit size={14} className="text-blue-500" /> Editar unidad
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(unit)}
                            disabled={!canDelete || deactivateMutation.isPending}
                            className="cursor-pointer gap-2 text-sm font-medium py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                          >
                            <Trash2 size={14} /> Desactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] font-medium leading-relaxed">
                    {unit.detail || "Sin descripción adicional registrada para esta unidad."}
                  </p>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                    <Badge variant="outline" className={`rounded-md px-2 py-0 h-6 text-[10px] font-bold border-none uppercase tracking-widest ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {isActive ? 'Operativa' : 'Inactiva'}
                    </Badge>
                    <div className="flex items-center text-slate-300 gap-1">
                        <Briefcase size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Empresa #{unit.idCompany}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <Store size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No hay resultados</h3>
            <p className="text-slate-500 max-w-sm mt-2 font-medium">No encontramos unidades de negocio que coincidan con tu búsqueda o filtros actuales.</p>
            <Button onClick={handleNew} variant="outline" className="mt-8 rounded-xl font-bold px-8 border-slate-300">Crear Nueva Unidad</Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogo Guardar/Editar - Refactorizado */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="bg-[#1E2C56] px-6 py-8 text-white">
            <DialogTitle className="text-xl font-bold">{editingUnit ? 'Editar Unidad' : 'Nueva Unidad de Negocio'}</DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-1 font-medium">Configurá los detalles básicos del punto operativo.</DialogDescription>
          </div>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Nombre de la Unidad</Label>
              <Input 
                id="name" 
                placeholder="Ej: Sucursal Centro / Campo Norte" 
                className={`h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all ${errors.name ? 'border-rose-500 ring-rose-50' : ''}`}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              {errors.name && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Detalle / Notas</Label>
              <Textarea 
                id="detail" 
                placeholder="Descripción opcional de la ubicación o función..." 
                className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all min-h-[100px] resize-none"
                value={formData.detail || ""}
                onChange={e => setFormData({...formData, detail: e.target.value})}
              />
            </div>

            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 flex gap-3">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                    Esta unidad será vinculada automáticamente a tu empresa principal para el reporte de cargas de combustible.
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
              className="rounded-xl bg-[#1E2C56] font-bold px-6 shadow-lg shadow-blue-900/10 hover:bg-[#2a3c74]"
            >
              {editingUnit ? 'Guardar Cambios' : 'Crear Unidad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Eliminar - Más amigable */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-none p-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">¿Desactivar unidad?</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium mt-2">
              La unidad <span className="text-slate-800 font-bold">"{deleteUnit?.name}"</span> dejará de estar disponible para nuevas cargas, pero mantendrá su historial.
            </DialogDescription>
          </div>
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-12 font-bold border-slate-200"
              onClick={() => setOpenDeleteDialog(false)}
              disabled={deactivateMutation.isPending}
            >
              No, cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-rose-200"
              onClick={handleConfirmDelete}
              disabled={deactivateMutation.isPending}
            >
              Sí, desactivar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}