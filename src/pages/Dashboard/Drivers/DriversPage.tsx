/**
 * DriversPage - Gestión de Choferes
 * Implementa patrón CRUD con useCrudPage
 */
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Plus,
  User,
  Edit,
  Trash2,
  Phone,
  Download,
  IdCard,
  Building2,
  CheckCircle2,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import { useCrudPage } from "@/hooks/useCrudPage";
import { createDriverSchema, type CreateDriverFormData } from "@/schemas";
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeactivateDriver,
  useCompanies,
} from "@/hooks/queries";
import type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
} from "@/types/api.types";

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
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SearchInput } from "@/components/common/DataTable";

// ============================================
// HELPERS
// ============================================
const getAvatarColor = (name: string): string => {
  const colors = ["#1e2c56", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
  return colors[name.charCodeAt(0) % colors.length] || "#1e2c56";
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const DEFAULT_FORM_VALUES: CreateDriverFormData = {
  idCompany: 0,
  name: "",
  dni: "",
  phoneNumber: "",
};

const filterDriver = (driver: Driver, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase();
  return driver.name.toLowerCase().includes(term) || driver.dni.includes(term);
};

const driverToFormData = (driver: Driver): CreateDriverFormData => ({
  idCompany: driver.idCompany,
  name: driver.name,
  dni: driver.dni,
  phoneNumber: driver.phoneNumber || "",
});

const prepareUpdateData = (
  data: CreateDriverFormData,
  driver: Driver
): UpdateDriverRequest => ({
  id: driver.id,
  ...data,
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
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
  const { data: companies = [] } = useCompanies();

  const deactivateMutation = useDeactivateDriver();

  // Hook CRUD genérico
  const crud = useCrudPage<
    Driver,
    CreateDriverFormData,
    CreateDriverRequest,
    UpdateDriverRequest
  >({
    useListQuery: useDrivers,
    createMutation: useCreateDriver(),
    updateMutation: useUpdateDriver(),
    deleteMutation: deactivateMutation,
    schema: createDriverSchema,
    defaultValues: { ...DEFAULT_FORM_VALUES, idCompany },
    filterFn: filterDriver,
    entityToFormData: driverToFormData,
    prepareCreateData: (data) => ({
      idCompany: data.idCompany,
      name: data.name,
      dni: data.dni,
      phoneNumber: data.phoneNumber || undefined,
    }),
    prepareUpdateData,
    onCreateSuccess: () => toast.success("Chofer registrado"),
    onUpdateSuccess: () => toast.success("Chofer actualizado"),
    onDeleteSuccess: () => toast.success("Chofer desactivado"),
  });

  // Filtrar por empresa
  const filteredDrivers = crud.filteredItems.filter(
    (d) =>
      !companyIdFilter ||
      companyIdFilter <= 0 ||
      d.idCompany === companyIdFilter
  );

  const { form } = crud;

  const handleExport = () => {
    const dataToExport = filteredDrivers.map((d) => ({
      Nombre: d.name,
      DNI: d.dni,
      Telefono: d.phoneNumber || "",
      Empresa: companies.find((c) => c.id === d.idCompany)?.name || "",
      Estado: d.active !== false ? "Activo" : "Inactivo",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Choferes");
    XLSX.writeFile(wb, "choferes.xlsx");
  };

  if (crud.isLoading)
    return (
      <div className="space-y-4">
        <div className="bg-background px-6 pt-4 pb-2">
          <PageHeader
            title="Choferes"
            description="Administración del personal de conducción"
          />
        </div>
        <div className="p-6">
          <SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </SectionCard>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="bg-background px-6 pt-4 pb-2">
        <PageHeader
          title="Choferes"
          description="Administración del personal de conducción"
          actions={
            <div className="flex items-center gap-3">
              {showExportButtons && (
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={filteredDrivers.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" /> Exportar
                </Button>
              )}
              {showCreateButtons && canManageDrivers && (
                <Button onClick={crud.handleNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Chofer
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="px-6 pb-6 space-y-4">
        <SectionCard>
          <SearchInput
            value={crud.searchTerm}
            onChange={crud.setSearchTerm}
            placeholder="Buscar por nombre o DNI..."
            className="max-w-md"
          />
        </SectionCard>

        <SectionCard>
          {filteredDrivers.length === 0 ? (
            <EmptyState
              icon={<User className="size-10" />}
              title="No hay choferes registrados"
              description={
                showCreateButtons && !isReadOnly
                  ? 'Haz clic en "Nuevo Chofer" para agregar uno'
                  : "No hay datos para mostrar"
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDrivers.map((d) => (
                <Card
                  key={d.id}
                  className="group hover:shadow-lg transition-all"
                >
                  <CardContent className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarFallback
                          style={{ backgroundColor: getAvatarColor(d.name) }}
                          className="text-white text-sm font-bold"
                        >
                          {getInitials(d.name)}
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
                            <DropdownMenuItem
                              onClick={() => crud.handleEdit(d)}
                            >
                              <Edit size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => crud.handleDelete(d)}
                              className="text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" /> Desactivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold text-base truncate">
                        {d.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <IdCard size={12} className="text-muted-foreground" />
                        <span className="text-xs font-bold uppercase">
                          {d.dni}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Phone size={15} className="shrink-0" />
                        <span className="text-xs">
                          {d.phoneNumber || "Sin teléfono"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Building2 size={15} className="shrink-0" />
                        <span className="text-xs truncate uppercase">
                          {companies.find((c) => c.id === d.idCompany)?.name ||
                            "Empresa Logística"}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <div className="px-5 py-3 bg-muted/30 border-t flex items-center justify-between">
                    <div
                      className={`flex items-center gap-1.5 ${
                        d.active !== false ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {d.active !== false ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      <span className="text-xs font-bold uppercase">
                        {d.active !== false ? "Habilitado" : "Deshabilitado"}
                      </span>
                    </div>
                    {!isReadOnly && canEdit && (
                      <Switch
                        checked={d.active !== false}
                        onCheckedChange={() => {
                          deactivateMutation.mutate(d.id);
                        }}
                        disabled={deactivateMutation.isPending}
                        aria-label={
                          d.active !== false ? "Desactivar" : "Activar"
                        }
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* MODAL CREAR/EDITAR */}
      <Dialog
        open={crud.isDialogOpen}
        onOpenChange={(open) => !open && crud.closeDialog()}
      >
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
          <div className="bg-primary px-8 py-10 text-primary-foreground relative">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
              {crud.isEditing
                ? "Editar Datos del Chofer"
                : "Registrar Nuevo Chofer"}
            </DialogTitle>
            <DialogDescription className="text-blue-100/70 text-sm mt-1 font-medium">
              Ingresá los datos identificatorios y de contacto.
            </DialogDescription>
          </div>

          <form
            onSubmit={form.handleSubmit(crud.onSubmit)}
            className="p-8 bg-white space-y-5"
          >
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Nombre Completo
              </Label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <Input
                  {...form.register("name")}
                  className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
                  placeholder="Ej: Carlos Alberto García"
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  DNI / Documento
                </Label>
                <div className="relative">
                  <IdCard
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <Input
                    {...form.register("dni")}
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
                    placeholder="Solo números"
                  />
                </div>
                {form.formState.errors.dni && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.dni.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Teléfono
                </Label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                  <Input
                    {...form.register("phoneNumber")}
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
                    placeholder="Ej: 11 1234 5678"
                  />
                </div>
              </div>
            </div>

            {companies.length > 1 && (
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Empresa
                </Label>
                <Select
                  value={String(form.watch("idCompany") || "")}
                  onValueChange={(v) => form.setValue("idCompany", Number(v))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                    <SelectValue placeholder="Elegir empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form>

          <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={crud.closeDialog}
              className="rounded-xl font-bold text-slate-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(crud.onSubmit)}
              disabled={crud.isSaving}
              className="rounded-xl bg-primary text-primary-foreground font-bold px-10 shadow-xl hover:bg-primary/90 transition-all"
            >
              {crud.isSaving
                ? "Guardando..."
                : crud.isEditing
                ? "Guardar Cambios"
                : "Confirmar Chofer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={crud.isDeleteDialogOpen}
        onOpenChange={(open) => !open && crud.closeDeleteDialog()}
        title="¿Desactivar chofer?"
        description={
          <>
            El chofer <strong>"{crud.deletingItem?.name}"</strong> dejará de
            estar disponible para asignar a nuevas cargas de combustible.
          </>
        }
        confirmLabel={crud.isDeleting ? "Desactivando..." : "Sí, desactivar"}
        cancelLabel="Cancelar"
        onConfirm={crud.confirmDelete}
        confirmDisabled={crud.isDeleting}
      />
    </div>
  );
}
