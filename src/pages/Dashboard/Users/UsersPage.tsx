import { useState, useMemo } from "react";
import {
  Download,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Store,
  ShieldCheck,
  MoreVertical,
  Briefcase,
} from "lucide-react";
import * as XLSX from "xlsx";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/axios";

// Hooks y Store
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useRoles,
  useAddUserRole,
  useBusinessUnits,
} from "@/hooks/queries";
import { userRolesApi } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type { ApiUser, CreateUserRequest, UpdateUserRequest } from "@/types/api.types";

// Helpers Visuales
const getInitials = (firstName?: string, lastName?: string) => {
  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = ["#1e2c56", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
  return colors[name.charCodeAt(0) % colors.length] || "#1e2c56";
};

export default function UsersPage() {
  const { user } = useAuthStore();
  
  // CORRECCIÓN AQUÍ: Agregué showExportButtons y showCreateButtons
  const { 
    canManageUsers, 
    canEdit, 
    isReadOnly, 
    unidadIdsFilter, 
    isSupervisor, 
    isAuditor,
    showExportButtons, // Agregado
    showCreateButtons  // Agregado
  } = useRoleLogic();

  // Estados
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getInitialFormData = (): CreateUserRequest => ({
    firstName: "",
    lastName: "",
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
    idCompany: user?.idCompany || 0,
    idBusinessUnit: undefined,
    phoneNumber: "",
  });

  const [formData, setFormData] = useState<CreateUserRequest>(getInitialFormData());

  // Queries
  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const { data: businessUnits = [] } = useBusinessUnits();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const addRoleMutation = useAddUserRole();

  // Filtrado de búsqueda y roles
  const filteredUsers = useMemo(() => {
    let filtered = Array.isArray(users) ? users : [];
    
    if ((isSupervisor || isAuditor) && unidadIdsFilter?.length) {
      filtered = filtered.filter(u => u.idBusinessUnit && unidadIdsFilter.includes(u.idBusinessUnit));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        `${u.firstName} ${u.lastName} ${u.email} ${u.userName}`.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [users, searchTerm, isSupervisor, isAuditor, unidadIdsFilter]);

  // Handlers
  const handleEdit = async (u: ApiUser) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email,
      userName: u.userName,
      password: "",
      confirmPassword: "",
      idCompany: u.idCompany || user?.idCompany || 0,
      idBusinessUnit: u.idBusinessUnit,
      phoneNumber: u.phoneNumber || "",
    });
    try {
      const rolesData = await userRolesApi.getByUser(u.id);
      setSelectedRoleId(rolesData[0]?.id || "");
    } catch {
      setSelectedRoleId("");
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    setErrors({});
    if (!formData.firstName || !formData.email || !formData.userName) {
      setErrors({ general: "Por favor, completa los campos obligatorios." });
      return;
    }

    try {
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          id: editingUser.id,
          userName: formData.userName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        };

        await updateMutation.mutateAsync({
          userId: editingUser.id,
          data: updateData,
        });
        if (selectedRoleId) {
          await addRoleMutation.mutateAsync({ userId: editingUser.id, data: { roleId: selectedRoleId } });
        }
      } else {
        const newUser = await createMutation.mutateAsync(formData);
        if (selectedRoleId && newUser?.id) {
          await addRoleMutation.mutateAsync({ userId: newUser.id, data: { roleId: selectedRoleId } });
        }
      }
      setOpenDialog(false);
    } catch (err: unknown) {
      setErrors({ general: getErrorMessage(err) });
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredUsers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "listado_usuarios.xlsx");
  };

  if (isLoading) return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Sección */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Usuarios</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Gestioná los accesos y perfiles de tu organización.</p>
        </div>
        <div className="flex items-center gap-3">
          {showExportButtons && (
            <Button variant="outline" onClick={handleExport} className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
              <Download className="mr-2 h-4 w-4 text-slate-400" /> Exportar
            </Button>
          )}
          {showCreateButtons && canManageUsers && (
            <Button 
              onClick={() => {
                setEditingUser(null);
                setSelectedRoleId("");
                setErrors({});
                setFormData(getInitialFormData());
                setOpenDialog(true);
              }}
              className="h-10 rounded-xl bg-[#1E2C56] text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-[#2a3c74] transition-all active:scale-95 px-6"
            >
              <Plus className="mr-2 h-4 w-4 text-white" /> 
              <span className="text-white">Nuevo Usuario</span>
            </Button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar por nombre, usuario o email..." 
          className="pl-11 h-12 rounded-2xl border-none bg-white shadow-sm font-medium focus-visible:ring-primary/20 transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid de Usuarios - Card Compactas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-2">
        {filteredUsers.map((u) => (
          <Card key={u.id} className="group border-none bg-white shadow-sm hover:shadow-xl transition-all rounded-2xl overflow-hidden flex flex-col">
            <CardContent className="p-5 flex-1">
              <div className="flex items-start justify-between mb-4">
                <Avatar className="h-12 w-12 border-2 border-slate-50 shadow-sm">
                  <AvatarFallback style={{ backgroundColor: getAvatarColor(u.userName) }} className="text-white text-sm font-bold">
                    {getInitials(u.firstName, u.lastName)}
                  </AvatarFallback>
                </Avatar>
                
                {!isReadOnly && canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 rounded-full transition-colors">
                        <MoreVertical size={18}/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl p-1">
                      <DropdownMenuItem onClick={() => handleEdit(u)} className="cursor-pointer font-semibold text-xs py-2 rounded-lg">
                        <Pencil size={14} className="mr-2 text-blue-500" /> Editar Datos
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base leading-tight truncate">
                  {u.firstName} {u.lastName}
                </h3>
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[10px] font-bold px-2 py-0">
                  @{u.userName}
                </Badge>
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-3 text-slate-500">
                  <Mail size={15} className="text-slate-300 shrink-0" />
                  <span className="text-xs font-medium truncate tracking-tight">{u.email}</span>
                </div>
                {u.phoneNumber && (
                  <div className="flex items-center gap-3 text-slate-500">
                    <Phone size={15} className="text-slate-300 shrink-0" />
                    <span className="text-xs font-medium tracking-tight">{u.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-500">
                  <Store size={15} className="text-slate-300 shrink-0" />
                  <span className="text-xs font-medium truncate tracking-tight italic">
                    {businessUnits.find(b => b.id === u.idBusinessUnit)?.name || "Acceso Global"}
                  </span>
                </div>
              </div>
            </CardContent>

            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-600">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Activo</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Briefcase size={12} />
                <span className="text-[9px] font-bold">EMPRESA #{u.idCompany}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialogo Refactorizado - Contrastes Altos */}
      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingUser(null);
            setSelectedRoleId("");
            setErrors({});
            setFormData(getInitialFormData());
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
          <div className="bg-[#1E2C56] px-8 py-10 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <DialogTitle className="text-2xl font-bold text-white relative z-10">
              {editingUser ? "Actualizar Usuario" : "Registro de Usuario"}
            </DialogTitle>
            <DialogDescription className="text-blue-100/70 text-sm mt-2 font-medium relative z-10">
              Ingresá las credenciales y definí el nivel de acceso al sistema.
            </DialogDescription>
          </div>
          
          <div className="p-8 bg-white space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {errors.general && (
              <Alert variant="destructive" className="rounded-xl border-none bg-rose-50 text-rose-600">
                <AlertDescription className="text-xs font-bold">{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre</Label>
                <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" placeholder="Ej: Juan" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Apellido</Label>
                <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" placeholder="Ej: Pérez" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" placeholder="email@empresa.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario</Label>
                <Input value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" placeholder="jperez" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rol de Sistema</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Elegir rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.id} value={r.id} className="font-medium">{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!editingUser && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contraseña</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-10 rounded-lg border-slate-200 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Repetir</Label>
                  <Input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="h-10 rounded-lg border-slate-200 bg-white" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unidad Asignada</Label>
              <Select 
                value={formData.idBusinessUnit ? String(formData.idBusinessUnit) : "none"} 
                onValueChange={v => setFormData({...formData, idBusinessUnit: v === "none" ? undefined : Number(v)})}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Sin unidad (Acceso Total)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-bold text-primary italic">Acceso Global (Todas las unidades)</SelectItem>
                  {businessUnits.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setOpenDialog(false)} 
              className="rounded-xl font-bold text-slate-400 hover:bg-slate-200/50 transition-colors"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="rounded-xl bg-[#1E2C56] text-white font-bold px-10 shadow-xl shadow-blue-900/20 hover:bg-[#2a3c74] transition-all"
            >
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}