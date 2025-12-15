import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Plus,
  Search,
  User,
  Edit,
  Trash2,
  Phone,
  Download,
  IdCard,
  Building2,
  CheckCircle2,
  MoreVertical,
  Briefcase,
} from "lucide-react";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeactivateDriver,
  useCompanies,
} from "@/hooks/queries";
import type { Driver, CreateDriverRequest, UpdateDriverRequest } from "@/types/api.types";

// UI Components
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getAvatarColor = (name: string): string => {
  const colors = ["#1e2c56", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
  return colors[name.charCodeAt(0) % colors.length] || "#1e2c56";
};

const getInitials = (name: string): string => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function DriversPage() {
  const { user } = useAuthStore();
  const {
    canManageDrivers,
    canEdit,
    showCreateButtons,
    showExportButtons,
    isReadOnly,
    companyIdFilter,
  } = useRoleLogic();

  const idCompany = user?.idCompany || user?.empresaId || companyIdFilter || 0;

  const getInitialFormData = (): CreateDriverRequest => ({
    idCompany: idCompany || 0,
    name: "",
    dni: "",
    phoneNumber: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<CreateDriverRequest>(getInitialFormData());

  const { data: driversAll = [], isLoading } = useDrivers();
  const { data: companies = [] } = useCompanies();
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deactivateMutation = useDeactivateDriver();

  const handleExport = () => {
    const dataToExport = filteredDrivers.map((d) => {
      const company = companies.find((c) => c.id === d.idCompany);
      return {
        Nombre: d.name,
        DNI: d.dni,
        Telefono: d.phoneNumber || "",
        Empresa: company?.name || "",
        Estado: d.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Choferes");
    XLSX.writeFile(wb, "choferes.xlsx");
  };

  const filteredDrivers = useMemo(() => {
    let filtered = Array.isArray(driversAll) ? driversAll : [];
    if (companyIdFilter && companyIdFilter > 0) {
      filtered = filtered.filter((d) => d.idCompany === companyIdFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(term) || d.dni.includes(term)
      );
    }
    return filtered;
  }, [driversAll, searchTerm, companyIdFilter]);

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      idCompany: driver.idCompany,
      name: driver.name,
      dni: driver.dni,
      phoneNumber: driver.phoneNumber || "",
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.dni.trim()) {
      toast.error("Nombre y DNI son requeridos");
      return;
    }

    const finalCompanyId = formData.idCompany || idCompany || companies[0]?.id || 0;
    if (!finalCompanyId) {
      toast.error("Debe existir una empresa para guardar el chofer");
      return;
    }

    try {
      if (editingDriver) {
        await updateMutation.mutateAsync({
          id: editingDriver.id,
          ...formData,
          idCompany: finalCompanyId,
        } as UpdateDriverRequest);
        toast.success("Chofer actualizado");
      } else {
        await createMutation.mutateAsync({ ...formData, idCompany: finalCompanyId });
        toast.success("Chofer registrado");
      }
      setOpenDialog(false);
    } catch {
      toast.error("Error en la operación");
    }
  };

  const handleDelete = async () => {
    if (!deleteDriver) return;
    try {
      await deactivateMutation.mutateAsync(deleteDriver.id);
      toast.success("Chofer desactivado");
      setOpenDeleteDialog(false);
      setDeleteDriver(null);
    } catch {
      toast.error("Error al desactivar");
    }
  };

  if (isLoading) return <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-48 rounded-2xl" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Choferes</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Administración del personal de conducción.</p>
        </div>
        <div className="flex items-center gap-3">
          {showExportButtons && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredDrivers.length === 0}
              className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              <Download className="mr-2 h-4 w-4 text-slate-400" /> Exportar
            </Button>
          )}
          {showCreateButtons && canManageDrivers && (
            <Button 
              onClick={() => {
                setEditingDriver(null);
                setFormData(getInitialFormData());
                setOpenDialog(true);
              }}
              className="h-10 rounded-xl bg-[#1E2C56] text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-[#2a3c74] transition-all active:scale-95 px-6"
            >
              <Plus className="mr-2 h-4 w-4 text-white" /> 
              <span className="text-white">Nuevo Chofer</span>
            </Button>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar por nombre o DNI..." 
          className="pl-11 h-12 rounded-2xl border-none bg-white shadow-sm font-medium focus-visible:ring-primary/20 transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-2">
        {filteredDrivers.map((d) => (
          <Card key={d.id} className="group border-none bg-white shadow-sm hover:shadow-xl transition-all rounded-2xl overflow-hidden flex flex-col">
            <CardContent className="p-5 flex-1">
              <div className="flex items-start justify-between mb-4">
                <Avatar className="h-12 w-12 border-2 border-slate-50 shadow-sm">
                  <AvatarFallback style={{ backgroundColor: getAvatarColor(d.name) }} className="text-white text-sm font-bold">
                    {getInitials(d.name)}
                  </AvatarFallback>
                </Avatar>
                
                {!isReadOnly && canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 rounded-full">
                        <MoreVertical size={18}/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl p-1">
                      <DropdownMenuItem onClick={() => handleEdit(d)} className="cursor-pointer font-semibold text-xs py-2">
                        <Edit size={14} className="mr-2 text-blue-500" /> Editar Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setDeleteDriver(d); setOpenDeleteDialog(true); }} className="cursor-pointer font-semibold text-xs py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600">
                        <Trash2 size={14} className="mr-2" /> Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base leading-tight truncate">{d.name}</h3>
                <div className="flex items-center gap-1.5">
                  <IdCard size={12} className="text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{d.dni}</span>
                </div>
              </div>

              <Separator className="my-4 bg-slate-50" />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500">
                  <Phone size={15} className="text-blue-500 shrink-0" />
                  <span className="text-xs font-semibold tracking-tight">{d.phoneNumber || "Sin teléfono"}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Building2 size={15} className="text-slate-300 shrink-0" />
                  <span className="text-[11px] font-medium truncate uppercase tracking-tight">
                    {companies.find(c => c.id === d.idCompany)?.name || "Empresa Logística"}
                  </span>
                </div>
              </div>
            </CardContent>

            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-600">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Habilitado</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Briefcase size={12} />
                <span className="text-[9px] font-bold uppercase">ID #{d.id}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* MODAL CREAR/EDITAR */}
      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingDriver(null);
            setFormData(getInitialFormData());
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
          <div className="bg-[#1E2C56] px-8 py-10 text-white relative">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
              {editingDriver ? "Editar Datos del Chofer" : "Registrar Nuevo Chofer"}
            </DialogTitle>
            <DialogDescription className="text-blue-100/70 text-sm mt-1 font-medium">
              Ingresá los datos identificatorios y de contacto.
            </DialogDescription>
          </div>
          
          <div className="p-8 bg-white space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</Label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white" 
                  placeholder="Ej: Carlos Alberto García" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">DNI / Documento</Label>
                <div className="relative">
                  <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <Input 
                    value={formData.dni} 
                    onChange={e => setFormData({...formData, dni: e.target.value})} 
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white" 
                    placeholder="Solo números" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</Label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <Input 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white" 
                    placeholder="Ej: 11 1234 5678" 
                  />
                </div>
              </div>
            </div>

            {companies.length > 1 && (
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Empresa</Label>
                <Select value={String(formData.idCompany)} onValueChange={v => setFormData({...formData, idCompany: Number(v)})}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                    <SelectValue placeholder="Elegir empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 gap-3">
            <Button variant="ghost" onClick={() => setOpenDialog(false)} className="rounded-xl font-bold text-slate-400">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl bg-[#1E2C56] text-white font-bold px-10 shadow-xl shadow-blue-900/20 hover:bg-[#2a3c74] transition-all">
              {editingDriver ? "Guardar Cambios" : "Confirmar Chofer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-none p-8 text-center bg-white">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800">¿Desactivar chofer?</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium mt-2 leading-relaxed">
              El chofer <span className="text-slate-900 font-bold">"{deleteDriver?.name}"</span> dejará de estar disponible para asignar a nuevas cargas de combustible.
            </DialogDescription>
          </div>
          <div className="flex gap-3 mt-8 w-full">
            <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold border-slate-200" onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-rose-200" onClick={handleDelete}>Sí, desactivar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}