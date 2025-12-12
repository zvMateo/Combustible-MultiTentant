import { useState, useMemo, useEffect } from "react";
import {
  Download,
  Pencil,
  Phone,
  Plus,
  Search,
  Store,
  User,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/queries";
import { useRoles, useUserRoles, useAddUserRole } from "@/hooks/queries";
import { useCompanies, useBusinessUnits } from "@/hooks/queries";
import { userRolesApi } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type {
  ApiUser,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

// Helpers
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0) ?? "";
  const second = lastName?.charAt(0) ?? "";
  return (first + second).toUpperCase();
};

const getAvatarColor = (name: string): string => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];
  return colors[name.charCodeAt(0) % colors.length] || "#999";
};

// 🆕 Componente para mostrar roles de un usuario
function UserRoleChips({ userId }: { userId: string }) {
  const { data: userRoles = [] } = useUserRoles(userId);

  if (userRoles.length === 0) return null;

  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold text-slate-500">Roles</div>
      <div className="flex flex-wrap gap-1">
        {userRoles.map((role) => (
          <Badge
            key={role.id}
            className="h-5 rounded-md border-0 px-2 text-[11px] font-semibold"
            style={{ backgroundColor: "#8b5cf615", color: "#8b5cf6" }}
          >
            {role.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user } = useAuthStore();
  const {
    canManageUsers,
    canEdit,
    showCreateButtons,
    showEditButtons,
    showExportButtons,
    isReadOnly,
    companyIdFilter,
    unidadIdsFilter,
    isSupervisor,
    isAuditor,
  } = useRoleLogic();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Usar idCompany del usuario autenticado si es admin
  const userCompanyId =
    user?.idCompany || user?.empresaId || companyIdFilter || 0;

  const [formData, setFormData] = useState<CreateUserRequest>({
    firstName: "",
    lastName: "",
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
    idCompany: userCompanyId,
    idBusinessUnit: undefined,
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  // React Query hooks (multi-tenant: ya vienen filtrados por IdCompany)
  const { data: users = [], isLoading, error } = useUsers();
  const { data: roles = [] } = useRoles();
  const { data: companies = [] } = useCompanies();
  const { data: businessUnits = [] } = useBusinessUnits();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const addRoleMutation = useAddUserRole();

  // Obtener roles del usuario editado
  const { data: userRoles = [] } = useUserRoles(editingUser?.id || "");

  // ✅ Setear rol actual cuando se cargan los roles del usuario editado
  useEffect(() => {
    if (editingUser && userRoles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(userRoles[0]?.id || "");
    }
  }, [editingUser, userRoles, selectedRoleId]);

  // Filtrar usuarios por empresa, unidad y búsqueda según el rol
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // 2. Filtrar por unidad de negocio (Supervisor y Auditor solo ven usuarios de su(s) unidad(es))
    if (
      (isSupervisor || isAuditor) &&
      unidadIdsFilter &&
      unidadIdsFilter.length > 0
    ) {
      const beforeUnidadFilter = filtered.length;
      filtered = filtered.filter((u) => {
        // Si el usuario tiene unidad asignada, verificar que esté en las unidades del supervisor/auditor
        if (u.idBusinessUnit) {
          return unidadIdsFilter.includes(u.idBusinessUnit);
        }
        // Si no tiene unidad asignada, no mostrarlo para supervisor/auditor
        return false;
      });

      if (import.meta.env.DEV) {
        console.log("🔍 [UsersPage] Filtrado por unidad de negocio:", {
          beforeFilter: beforeUnidadFilter,
          afterFilter: filtered.length,
          unidadIdsFilter,
          role: isSupervisor ? "Supervisor" : isAuditor ? "Auditor" : "Otro",
        });
      }
    }

    // 3. Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.userName.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [users, searchTerm, isSupervisor, isAuditor, unidadIdsFilter]);

  const handleNew = () => {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      userName: "",
      password: "",
      confirmPassword: "",
      idCompany: 2,
      idBusinessUnit: undefined,
      phoneNumber: "",
    });
    setSelectedRoleId("");
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = async (userToEdit: ApiUser) => {
    setEditingUser(userToEdit);
    setFormData({
      firstName: userToEdit.firstName || "",
      lastName: userToEdit.lastName || "",
      email: userToEdit.email,
      userName: userToEdit.userName,
      password: "",
      confirmPassword: "",
      idCompany: userToEdit.idCompany || 2,
      idBusinessUnit: userToEdit.idBusinessUnit,
      phoneNumber: userToEdit.phoneNumber || "",
    });

    // ✅ Cargar roles del usuario
    try {
      const rolesData = await userRolesApi.getByUser(userToEdit.id);
      if (rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].id);
      } else {
        setSelectedRoleId("");
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
      setSelectedRoleId("");
    }

    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es obligatorio";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es obligatorio";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.userName.trim()) {
      newErrors.userName = "El nombre de usuario es obligatorio";
    }
    if (!editingUser && !formData.password.trim()) {
      newErrors.password = "La contraseña es obligatoria";
    }
    if (!editingUser && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingUser) {
        // ==========================================
        // CASO 1: EDITAR USUARIO EXISTENTE
        // ==========================================

        // 1️⃣ Actualizar datos del usuario
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

        // 2️⃣ Solo asignar rol si cambió y hay uno seleccionado
        if (selectedRoleId) {
          const currentRoleId = userRoles[0]?.id;
          if (selectedRoleId !== currentRoleId) {
            await addRoleMutation.mutateAsync({
              userId: editingUser.id,
              data: { roleId: selectedRoleId },
            });
          }
        }
      } else {
        // ==========================================
        // CASO 2: CREAR NUEVO USUARIO
        // ==========================================

        // MULTI-TENANT: Usar SIEMPRE el idCompany del usuario autenticado
        const finalIdCompany = user?.idCompany || user?.empresaId || 0;

        console.log(
          "🏢 [UsersPage] Multi-tenant: idCompany del usuario autenticado:",
          finalIdCompany
        );

        const dataToSend: CreateUserRequest = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          userName: formData.userName,
          password: formData.password,
          confirmPassword: "",
          idCompany: finalIdCompany,
          idBusinessUnit: formData.idBusinessUnit,
          phoneNumber: formData.phoneNumber || "",
        };

        const newUser = await createMutation.mutateAsync(dataToSend);

        // 🔍 Extraer userId de la respuesta
        // La API devuelve ApiUser que tiene 'id' como string
        if (!newUser || !newUser.id) {
          throw new Error("No se pudo obtener el ID del usuario creado");
        }

        // ✅ Asignar rol si se seleccionó uno
        if (selectedRoleId) {
          await addRoleMutation.mutateAsync({
            userId: newUser.id,
            data: { roleId: selectedRoleId },
          });
        }
      }

      setOpenDialog(false);
      setErrors({});
    } catch (error) {
      console.error("❌ Error al guardar:", error);

      // ✅ Mostrar error específico
      const errorResponse = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (errorResponse.response?.status === 409) {
        setErrors({
          userName: "El nombre de usuario o email ya existe",
          email: "El nombre de usuario o email ya existe",
        });
      } else {
        setErrors({
          general:
            errorResponse.response?.data?.message || "Error al guardar usuario",
        });
      }
    }
  };

  const handleExport = () => {
    const dataToExport = filteredUsers.map((u) => {
      const company = companies.find((c) => c.id === u.idCompany);
      const businessUnit = businessUnits.find(
        (bu) => bu.id === u.idBusinessUnit
      );
      return {
        Nombre: u.firstName || "",
        Apellido: u.lastName || "",
        Email: u.email,
        "Nombre Usuario": u.userName,
        Teléfono: u.phoneNumber || "",
        Empresa: company?.name || "",
        "Unidad de Negocio": businessUnit?.name || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `users_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-2/3 bg-slate-300" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl border border-slate-200 bg-white">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="mt-4 h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-52" />
                <Skeleton className="mt-6 h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-white">
          <AlertDescription>
            Error al cargar usuarios: {error instanceof Error ? error.message : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="-mt-6 mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">Usuarios</div>
          <div className="mt-1 text-sm text-slate-500">
            {filteredUsers.length} {filteredUsers.length === 1 ? "usuario" : "usuarios"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showExportButtons && (
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={filteredUsers.length === 0}
              className="h-10 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          )}
          {showCreateButtons && canManageUsers && (
            <Button
              type="button"
              onClick={handleNew}
              disabled={createMutation.isPending || isReadOnly}
              className="h-10 bg-blue-600 font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, apellido o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      {/* Grid users */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {filteredUsers.map((userItem) => {
          const company = companies.find((c) => c.id === userItem.idCompany);
          const businessUnit = businessUnits.find(
            (bu) => bu.id === userItem.idBusinessUnit
          );
          return (
            <Card
              key={userItem.id}
              className="h-full rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_18px_rgba(15,23,42,0.10)]"
            >
              <CardContent className="p-6">
                {/* Header user */}
                <div className="mb-5 flex items-start gap-4">
                  <Avatar
                    className="h-[52px] w-[52px]"
                    style={{ backgroundColor: getAvatarColor(userItem.userName) }}
                  >
                    <AvatarFallback className="text-[20px] font-bold text-white">
                      {getInitials(userItem.firstName, userItem.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-bold text-slate-900">
                      {userItem.firstName} {userItem.lastName || ""}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge className="h-[22px] rounded-md bg-slate-100 px-2 text-[11px] font-semibold text-slate-600">
                        {userItem.userName}
                      </Badge>
                    </div>
                  </div>

                  {/* Acciones */}
                  {!isReadOnly && showEditButtons && canManageUsers && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(userItem)}
                      disabled={updateMutation.isPending || !canEdit}
                      className="h-9 w-9 border-0 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Detalles */}
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold text-slate-500">Email</div>
                    <div className="wrap-break-word text-sm font-semibold text-slate-700">
                      {userItem.email}
                    </div>
                  </div>

                  {userItem.phoneNumber && (
                    <div>
                      <div className="mb-1 text-[11px] font-semibold text-slate-500">Teléfono</div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-[18px] w-[18px] text-emerald-500" />
                        <div className="text-sm font-semibold text-slate-700">
                          {userItem.phoneNumber}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🆕 Mostrar roles del usuario */}
                  <UserRoleChips userId={userItem.id} />

                  {/* Mostrar empresa y unidad */}
                  {company && (
                    <div>
                      <div className="mb-1 text-[11px] font-semibold text-slate-500">Empresa</div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Store className="h-[18px] w-[18px] text-slate-500" />
                        <div className="font-medium">{company.name}</div>
                      </div>
                    </div>
                  )}

                  {businessUnit && (
                    <div>
                      <div className="mb-1 text-[11px] font-semibold text-slate-500">
                        Unidad de Negocio
                      </div>
                      <div className="text-sm font-medium text-slate-600">{businessUnit.name}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && !isLoading && (
        <div className="py-12 text-center text-slate-400">
          <User className="mx-auto mb-2 h-16 w-16 text-slate-200" />
          <div className="text-base font-semibold text-slate-500">
            No hay usuarios registrados
          </div>
        </div>
      )}

      {/* Dialog crear / editar */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulario para {editingUser ? "editar" : "crear"} un usuario
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-2">
            {/* ✅ Mostrar error general */}
            {errors.general && (
              <Alert className="border-red-200 bg-white">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm font-semibold text-slate-700">Nombre</div>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                {errors.firstName && (
                  <div className="mt-1 text-xs font-medium text-red-600">{errors.firstName}</div>
                )}
              </div>
              <div>
                <div className="mb-1 text-sm font-semibold text-slate-700">Apellido</div>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
                {errors.lastName && (
                  <div className="mt-1 text-xs font-medium text-red-600">{errors.lastName}</div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">Email</div>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && (
                <div className="mt-1 text-xs font-medium text-red-600">{errors.email}</div>
              )}
            </div>

            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">Nombre de Usuario</div>
              <Input
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              />
              {errors.userName && (
                <div className="mt-1 text-xs font-medium text-red-600">{errors.userName}</div>
              )}
            </div>

            {!editingUser && (
              <>
                <div>
                  <div className="mb-1 text-sm font-semibold text-slate-700">Contraseña</div>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {errors.password && (
                    <div className="mt-1 text-xs font-medium text-red-600">{errors.password}</div>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-sm font-semibold text-slate-700">Confirmar Contraseña</div>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                  {errors.confirmPassword && (
                    <div className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword}</div>
                  )}
                </div>
              </>
            )}

            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">Teléfono (opcional)</div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={formData.phoneNumber || ""}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {companies.length > 0 && companies.length > 1 && (
              <div>
                <div className="mb-1 text-sm font-semibold text-slate-700">Empresa</div>
                <Select
                  value={String(formData.idCompany)}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      idCompany: Number(v),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.idCompany && (
                  <div className="mt-1 text-xs font-medium text-red-600">{errors.idCompany}</div>
                )}
              </div>
            )}

            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">
                Unidad de Negocio (opcional)
              </div>
              <Select
                value={
                  formData.idBusinessUnit !== undefined
                    ? String(formData.idBusinessUnit)
                    : "none"
                }
                onValueChange={(v) => {
                  setFormData({
                    ...formData,
                    idBusinessUnit: v === "none" ? undefined : Number(v),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {businessUnits
                    .filter((bu) => bu.idCompany === formData.idCompany)
                    .map((bu) => (
                      <SelectItem key={bu.id} value={String(bu.id)}>
                        {bu.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">Rol</div>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                addRoleMutation.isPending
              }
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Guardando..."
                : editingUser
                  ? "Guardar Cambios"
                  : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
