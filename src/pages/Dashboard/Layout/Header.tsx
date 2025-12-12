import { useState } from "react";
import {
  Bell,
  Building2,
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

  const handleClose = () => setOpen(false);

  const handleLogout = () => {
    logout();
    handleClose();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";
  const canSwitchUnidad = isAdmin && unidades.length > 1;

  const handleUnidadChange = (unidadId: number | "all") => {
    if (unidadId === "all") {
      setUnidadActiva(null);
    } else {
      const unidad = unidades.find((u) => u.id === unidadId);
      if (unidad) {
        setUnidadActiva(unidad);
      }
    }
  };

  const getAvatarColor = (): string => {
    return "#1E2C56";
  };

  const getRolColor = (
    rol: UserRole | undefined
  ): { bg: string; color: string } => {
    const colors: Record<UserRole, { bg: string; color: string }> = {
      admin: { bg: "#3b82f615", color: "#3b82f6" },
      supervisor: { bg: "#10b98115", color: "#10b981" },
      operador: { bg: "#f59e0b15", color: "#f59e0b" },
      auditor: { bg: "#6b728015", color: "#6b7280" },
    };
    return rol ? colors[rol] : { bg: "#99999915", color: "#999" };
  };

  const getRolLabel = (rol: UserRole | undefined): string => {
    const labels: Record<UserRole, string> = {
      admin: "Administrador",
      supervisor: "Supervisor",
      operador: "Operador",
      auditor: "Auditor",
    };
    return rol ? labels[rol] : "Usuario";
  };

  const getInitials = (name: string = ""): string => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 shadow-[0_2px_12px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-8">
        {/* Lado Izquierdo - Saludo y usuario */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Bienvenido
            </div>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-[24px] font-bold tracking-[-0.02em] text-slate-900">
                {user?.name}
              </h1>
              <Badge
                className="h-7 rounded-md px-3 text-[11px] font-bold border-0"
                style={{
                  backgroundColor: getRolColor(user?.role).bg,
                  color: getRolColor(user?.role).color,
                }}
              >
                {getRolLabel(user?.role)}
              </Badge>
            </div>
          </div>

          {/* Separador */}
          <Separator orientation="vertical" className="h-10 bg-slate-200" />

          {/* Unidad actual */}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
            <Store className="h-4 w-4 text-slate-500" />
            <span className="max-w-[320px] truncate text-[14px] font-semibold text-slate-700">
              {unidadActiva?.nombre || "Todas las unidades"}
            </span>
          </div>
        </div>

        {/* Lado Derecho - Acciones */}
        <div className="flex items-center gap-4">
          {/* Selector de unidad para admin */}
          {canSwitchUnidad && (
            <Select
              value={String(unidadActiva?.id ?? "all")}
              onValueChange={(value) =>
                handleUnidadChange(value === "all" ? "all" : Number(value))
              }
            >
              <SelectTrigger className="h-11 w-60 rounded-xl border-slate-200 bg-white text-[14px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-600" />
                  <SelectValue placeholder="Seleccionar unidad" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las unidades</SelectItem>
                {unidades.map((unidad) => (
                  <SelectItem key={unidad.id} value={String(unidad.id)}>
                    {unidad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Notificaciones */}
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            <Bell className="h-[22px] w-[22px] text-slate-500" />
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* Perfil de usuario */}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
              >
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                  <AvatarFallback 
                    className="text-[14px] font-bold text-white"
                    style={{ backgroundColor: getAvatarColor() }}
                  >
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 rounded-2xl border border-slate-200 p-0 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
            >
              {/* Información del usuario */}
              <div className="rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-slate-100">
                    <AvatarFallback 
                      className="text-[16px] font-bold text-white"
                      style={{ backgroundColor: getAvatarColor() }}
                    >
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[15px] font-bold text-slate-800">
                      {user?.name}
                    </p>
                    <p className="text-[13px] text-slate-500">{user?.email}</p>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mt-3 space-y-1.5">
                  {user?.empresaNombre && (
                    <div className="flex items-center gap-2 text-[13px] text-slate-500">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {user.empresaNombre}
                    </div>
                  )}
                  {unidadActiva && (
                    <div className="flex items-center gap-2 text-[13px] text-slate-500">
                      <Store className="h-4 w-4 text-slate-400" />
                      {unidadActiva.nombre}
                    </div>
                  )}
                </div>
              </div>

              {/* Opciones del menú - SIN hover verde */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate("/dashboard/profile");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Mi perfil
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      navigate("/dashboard/settings");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Configuración
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 py-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-[14px] font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}