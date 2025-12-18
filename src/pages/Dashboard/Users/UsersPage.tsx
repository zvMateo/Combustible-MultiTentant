import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Download,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Store,
  User,
  MoreVertical,
} from "lucide-react";
import { useExcelExport } from "@/hooks";

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
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { getErrorMessage } from "@/lib/axios";
import { usersApi } from "@/services/api/users.api";

// Hooks y Store
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useRoles,
  useAddUserRole,
  useUpdateUserRoles,
  useBusinessUnits,
} from "@/hooks/queries";
import { userRolesApi } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import { useZodForm } from "@/hooks/useZodForm";
import { createUserSchema, type CreateUserFormData } from "@/schemas";
import type { ApiUser, UpdateUserRequest } from "@/types/api.types";

// Helpers Visuales
const getInitials = (firstName?: string, lastName?: string) => {
  return `${firstName?.charAt(0) ?? ""}${
    lastName?.charAt(0) ?? ""
  }`.toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = ["#1e2c56", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
  return colors[name.charCodeAt(0) % colors.length] || "#1e2c56";
};

export default function UsersPage() {
  const { user } = useAuthStore();
  const {
    canManageUsers,
    canEdit,
    isReadOnly,
    unidadIdsFilter,
    isSupervisor,
    isAuditor,
    showExportButtons,
    showCreateButtons,
  } = useRoleLogic();

  // Estados
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useZodForm<CreateUserFormData>(createUserSchema, {
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      userName: "",
      password: "",
      confirmPassword: "",
      idCompany: user?.idCompany || 0,
      idBusinessUnit: undefined,
      phoneNumber: "",
    },
  });

  // Queries
  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const { data: businessUnits = [] } = useBusinessUnits();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const addRoleMutation = useAddUserRole();
  const updateUserRolesMutation = useUpdateUserRoles();

  // Filtrado de búsqueda y roles
  const filteredUsers = useMemo(() => {
    let filtered = Array.isArray(users) ? users : [];

    if ((isSupervisor || isAuditor) && unidadIdsFilter?.length) {
      filtered = filtered.filter(
        (u) => u.idBusinessUnit && unidadIdsFilter.includes(u.idBusinessUnit)
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.userName}`
          .toLowerCase()
          .includes(term)
      );
    }
    return filtered;
  }, [users, searchTerm, isSupervisor, isAuditor, unidadIdsFilter]);

  const userRoleQueries = useQueries({
    queries: (Array.isArray(users) ? users : []).map((u) => ({
      queryKey: ["userRoles", u.id],
      queryFn: () => userRolesApi.getByUser(u.id),
      enabled: !!u.id,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const roleNameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    const allUsers = Array.isArray(users) ? users : [];
    allUsers.forEach((u, idx) => {
      const rolesData = userRoleQueries[idx]?.data;
      map.set(u.id, rolesData?.[0]?.name || "Sin rol");
    });
    return map;
  }, [users, userRoleQueries]);

  // Excluir usuarios con rol superadmin de la lista
  const visibleUsers = useMemo(() => {
    return filteredUsers.filter((u) => {
      const roleName = roleNameByUserId.get(u.id)?.toLowerCase() ?? "";
      return (
        !roleName.includes("superadmin") && !roleName.includes("super admin")
      );
    });
  }, [filteredUsers, roleNameByUserId]);

  // Excluir rol superadmin del selector
  const selectableRoles = useMemo(() => {
    return roles.filter((r) => {
      const name = r.name?.toLowerCase() ?? "";
      return !name.includes("superadmin") && !name.includes("super admin");
    });
  }, [roles]);

  // Handlers
  const handleEdit = (u: ApiUser) => {
    setSubmitError(null);
    setEditingUser(u);
    setSelectedRoleId("");
    form.reset({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email,
      userName: u.userName,
      password: "placeholder", // Required by schema but not used for edit
      confirmPassword: "placeholder",
      idCompany: u.idCompany || user?.idCompany || 0,
      idBusinessUnit: u.idBusinessUnit,
      phoneNumber: u.phoneNumber || "",
    });
    setOpenDialog(true);

    void (async () => {
      try {
        const detailed = await usersApi.getById(u.id);
        form.reset({
          firstName: detailed?.firstName ?? u.firstName ?? "",
          lastName: detailed?.lastName ?? u.lastName ?? "",
          email: detailed?.email ?? u.email,
          userName: detailed?.userName ?? u.userName,
          password: "placeholder",
          confirmPassword: "placeholder",
          idCompany: detailed?.idCompany ?? u.idCompany ?? user?.idCompany ?? 0,
          idBusinessUnit: detailed?.idBusinessUnit ?? u.idBusinessUnit,
          phoneNumber: detailed?.phoneNumber ?? u.phoneNumber ?? "",
        });
      } catch {
        // ignore
      }

      try {
        const rolesData = await userRolesApi.getByUser(u.id);
        setSelectedRoleId(rolesData[0]?.id || "");
      } catch {
        setSelectedRoleId("");
      }
    })();
  };

  const handleOpenNew = () => {
    setEditingUser(null);
    setSelectedRoleId("");
    setSubmitError(null);
    form.reset({
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
    setOpenDialog(true);
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setSubmitError(null);
    try {
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          id: editingUser.id,
          userName: data.userName,
          email: data.email,
          phoneNumber: data.phoneNumber || "",
        };

        await updateMutation.mutateAsync({
          userId: editingUser.id,
          data: updateData,
        });
        if (selectedRoleId) {
          await updateUserRolesMutation.mutateAsync({
            userId: editingUser.id,
            data: { roleId: selectedRoleId },
          });
        }
      } else {
        const payload = {
          ...data,
          idBusinessUnit: data.idBusinessUnit ?? 0,
          phoneNumber: data.phoneNumber || "",
        };

        const newUser = await createMutation.mutateAsync(payload);
        if (selectedRoleId && newUser?.id) {
          await addRoleMutation.mutateAsync({
            userId: newUser.id,
            data: { roleId: selectedRoleId },
          });
        }
      }
      setOpenDialog(false);
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err));
    }
  };

  const { exportToExcel } = useExcelExport<ApiUser>();

  const handleExport = () => {
    exportToExcel(filteredUsers, {
      fileName: "listado_usuarios",
      sheetName: "Usuarios",
      transform: (u) => ({
        Usuario: u.userName,
        Email: u.email,
        Nombre: u.firstName || "",
        Apellido: u.lastName || "",
        Telefono: u.phoneNumber || "",
      }),
    });
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        <div className="bg-background px-6 pt-4 pb-2">
          <PageHeader
            title="Usuarios"
            description="Gestioná los accesos y perfiles de tu organización"
          />
        </div>
        <div className="p-6">
          <SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="bg-background px-6 pt-4 pb-2">
        <PageHeader
          title="Usuarios"
          description="Gestioná los accesos y perfiles de tu organización"
          actions={
            <div className="flex items-center gap-3">
              {showExportButtons && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" /> Exportar
                </Button>
              )}
              {showCreateButtons && canManageUsers && (
                <Button onClick={handleOpenNew}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="px-6 pb-6 space-y-4">
        <SectionCard>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, usuario o email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </SectionCard>

        <SectionCard>
          {visibleUsers.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="size-10" />}
              title="No hay usuarios registrados"
              description={
                showCreateButtons && !isReadOnly
                  ? 'Haz clic en "Nuevo Usuario" para agregar uno'
                  : "No hay datos para mostrar"
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {visibleUsers.map((u) => (
                <Card
                  key={u.id}
                  className="group hover:shadow-lg transition-all"
                >
                  <CardContent className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarFallback
                          style={{
                            backgroundColor: getAvatarColor(u.userName),
                          }}
                          className="text-white text-sm font-bold"
                        >
                          {getInitials(u.firstName, u.lastName)}
                        </AvatarFallback>
                      </Avatar>

                      {!isReadOnly && canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(u)}>
                              <Pencil size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 text-base leading-tight truncate">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                          u.userName}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-500 border-none text-[10px] font-bold px-2 py-0"
                      >
                        @{u.userName}
                      </Badge>
                    </div>

                    <div className="mt-5 space-y-2.5">
                      <div className="flex items-center gap-3 text-slate-500">
                        <Mail size={15} className="text-slate-300 shrink-0" />
                        <span className="text-xs font-medium truncate tracking-tight">
                          {u.email}
                        </span>
                      </div>
                      {u.phoneNumber && (
                        <div className="flex items-center gap-3 text-slate-500">
                          <Phone
                            size={15}
                            className="text-slate-300 shrink-0"
                          />
                          <span className="text-xs font-medium tracking-tight">
                            {u.phoneNumber}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-slate-500">
                        <Store size={15} className="text-slate-300 shrink-0" />
                        <span className="text-xs font-medium truncate tracking-tight italic">
                          {businessUnits.find((b) => b.id === u.idBusinessUnit)
                            ?.name || "Acceso Global"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500">
                        <User size={15} className="text-slate-300 shrink-0" />
                        <span className="text-xs font-semibold truncate tracking-tight">
                          {roleNameByUserId.get(u.id) || "Sin rol"}
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

      {/* Dialogo Refactorizado - Contrastes Altos */}
      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingUser(null);
            setSelectedRoleId("");
            setSubmitError(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
          <div className="bg-primary px-8 py-10 text-primary-foreground relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <DialogTitle className="text-2xl font-bold text-white relative z-10">
              {editingUser ? "Actualizar Usuario" : "Registro de Usuario"}
            </DialogTitle>
            <DialogDescription className="text-blue-100/70 text-sm mt-2 font-medium relative z-10">
              Ingresá las credenciales y definí el nivel de acceso al sistema.
            </DialogDescription>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-8 bg-white space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar"
          >
            {submitError && (
              <Alert
                variant="destructive"
                className="rounded-xl border-none bg-rose-50 text-rose-600"
              >
                <AlertDescription className="text-xs font-bold">
                  {submitError}
                </AlertDescription>
              </Alert>
            )}

            {!editingUser && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Nombre
                  </Label>
                  <Input
                    {...form.register("firstName")}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                    placeholder="Ej: Juan"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Apellido
                  </Label>
                  <Input
                    {...form.register("lastName")}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                    placeholder="Ej: Pérez"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Correo Electrónico
              </Label>
              <Input
                type="email"
                {...form.register("email")}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                placeholder="email@empresa.com"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Nombre de Usuario
                </Label>
                <Input
                  {...form.register("userName")}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                  placeholder="jperez"
                />
                {form.formState.errors.userName && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.userName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Rol de Sistema
                </Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white">
                    <SelectValue placeholder="Elegir rol..." />
                  </SelectTrigger>
                  <SelectContent className="w-[--radix-select-trigger-width]">
                    {selectableRoles.map((r) => (
                      <SelectItem
                        key={r.id}
                        value={r.id}
                        className="font-medium"
                      >
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!editingUser && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Contraseña
                  </Label>
                  <Input
                    type="password"
                    {...form.register("password")}
                    className="h-10 rounded-lg border-slate-200 bg-white"
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Repetir
                  </Label>
                  <Input
                    type="password"
                    {...form.register("confirmPassword")}
                    className="h-10 rounded-lg border-slate-200 bg-white"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Unidad Asignada
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
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Sin unidad (Acceso Total)" />
                </SelectTrigger>
                <SelectContent className="w-[--radix-select-trigger-width]">
                  <SelectItem
                    value="none"
                    className="font-bold text-primary italic"
                  >
                    Acceso Global (Todas las unidades)
                  </SelectItem>
                  {businessUnits.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>

          <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpenDialog(false)}
              className="rounded-xl font-bold text-slate-400 hover:bg-slate-200/50 transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              className="rounded-xl bg-primary text-primary-foreground font-bold px-10 shadow-xl hover:bg-primary/90 transition-all"
            >
              {editingUser ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
