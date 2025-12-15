import { useState } from "react";
import {
  ChevronDown,
  LogOut,
  Settings,
  Store,
  User,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadStore } from "@/stores/unidad.store";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Header() {
  const { user, logout } = useAuthStore();
  const { unidades, unidadActiva, setUnidadActiva } = useUnidadStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";
  const canSwitchUnidad = isAdmin && unidades.length > 1;

  const getAvatarColor = () => "#1E2C56";

  const getRolColor = (rol: UserRole | undefined) => {
    const colors: Record<UserRole, { bg: string; color: string }> = {
      admin: { bg: "#1E2C5610", color: "#1E2C56" },
      supervisor: { bg: "#3b82f610", color: "#3b82f6" },
      operador: { bg: "#f59e0b10", color: "#f59e0b" },
      auditor: { bg: "#64748b10", color: "#64748b" },
    };
    return rol ? colors[rol] : { bg: "#f8fafc", color: "#64748b" };
  };

  const getInitials = (name: string = "") => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-20 items-center justify-between px-8">
        
        {/* Lado Izquierdo - Menos bold, más aire */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
              Panel de Gestión
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {user?.name}
              </h1>
              <Badge 
                className="h-6 px-2 text-[10px] font-medium border-none rounded-md"
                style={{ 
                  backgroundColor: getRolColor(user?.role).bg, 
                  color: getRolColor(user?.role).color 
                }}
              >
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator orientation="vertical" className="h-10 bg-slate-100" />

          {/* Unidad con estilo más suave */}
          <div className="hidden items-center gap-3 md:flex bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100">
            <Store size={18} className="text-slate-400" />
            <span className="text-[15px] font-medium text-slate-600">
              {unidadActiva?.nombre || "Todas las Unidades"}
            </span>
          </div>
        </div>

        {/* Lado Derecho */}
        <div className="flex items-center gap-5">
          
          {canSwitchUnidad && (
            <Select
              value={String(unidadActiva?.id ?? "all")}
              onValueChange={(val) => setUnidadActiva(val === "all" ? null : unidades.find(u => u.id === Number(val)) || null)}
            >
              <SelectTrigger className="h-10 w-52 border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                <SelectValue placeholder="Cambiar Unidad" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-xl z-[60]">
                <SelectItem value="all" className="text-sm font-medium">Todas las Unidades</SelectItem>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)} className="text-sm">
                    {u.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Perfil de Usuario - Fondo sólido y sombra suave */}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1.5 pr-4 transition-all hover:bg-slate-50 active:scale-95 outline-none">
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                  <AvatarFallback 
                    className="text-xs font-semibold text-white"
                    style={{ backgroundColor: getAvatarColor() }}
                  >
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-semibold text-slate-700">Mi Cuenta</span>
                  <span className="text-[11px] text-slate-400 font-normal">Opciones</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
              </button>
            </DropdownMenuTrigger>

            {/* Menu sólido sin transparencias */}
            <DropdownMenuContent 
              align="end" 
              sideOffset={8}
              className="w-64 border border-slate-200 bg-white p-1.5 shadow-xl rounded-2xl z-[60]"
            >
              <div className="flex items-center gap-3 p-3 mb-1">
                <Avatar className="h-10 w-10 border border-slate-100">
                  <AvatarFallback style={{ backgroundColor: getAvatarColor() }} className="text-white font-semibold text-sm">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold text-slate-900 truncate">{user?.name}</span>
                  <span className="text-[11px] font-normal text-slate-400 truncate">{user?.email}</span>
                </div>
              </div>

              <Separator className="my-1 bg-slate-50" />

              <div className="py-1">
                <DropdownMenuItem 
                  onSelect={() => {
                    setOpen(false);
                    navigate("/dashboard/profile");
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-slate-600 focus:bg-slate-50 focus:text-slate-900"
                >
                  <User size={16} className="text-slate-400" />
                  <span className="text-sm font-medium">Mi Perfil</span>
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem 
                    onSelect={() => {
                      setOpen(false);
                      navigate("/dashboard/settings");
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-slate-600 focus:bg-slate-50 focus:text-slate-900"
                  >
                    <Settings size={16} className="text-slate-400" />
                    <span className="text-sm font-medium">Configuración</span>
                  </DropdownMenuItem>
                )}
              </div>

              <Separator className="my-1 bg-slate-50" />

              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-rose-500 focus:bg-rose-50/50 focus:text-rose-600"
              >
                <LogOut size={16} />
                <span className="text-sm font-semibold">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}