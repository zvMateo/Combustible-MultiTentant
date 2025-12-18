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
  XCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import { useZodForm } from "@/hooks/useZodForm";
import { createDriverSchema, type CreateDriverFormData } from "@/schemas";
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeactivateDriver,
  useCompanies,
} from "@/hooks/queries";
import type { Driver, UpdateDriverRequest } from "@/types/api.types";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);

  const form = useZodForm<CreateDriverFormData>(createDriverSchema, {
    defaultValues: {
      idCompany: idCompany || 0,
      name: "",
      dni: "",
      phoneNumber: "",
    },
  });

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
        Estado: d.active !== false ? "Activo" : "Inactivo",
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
      filtered = filtered.filter(
        (d) => d.name.toLowerCase().includes(term) || d.dni.includes(term)
      );
    }
    return filtered;
  }, [driversAll, searchTerm, companyIdFilter]);

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    form.reset({
      idCompany: driver.idCompany,
      name: driver.name,
      dni: driver.dni,
      phoneNumber: driver.phoneNumber || "",
    });
    setOpenDialog(true);
  };

  const handleOpenNew = () => {
    setEditingDriver(null);
    form.reset({
      idCompany: idCompany || 0,
      name: "",
      dni: "",
      phoneNumber: "",
    });
    setOpenDialog(true);
  };

  const onSubmit = async (data: CreateDriverFormData) => {
    const finalCompanyId = data.idCompany || idCompany || companies[0]?.id || 0;
    if (!finalCompanyId) {
      toast.error("Debe existir una empresa para guardar el chofer");
      return;
    }

    try {
      if (editingDriver) {
        await updateMutation.mutateAsync({
          id: editingDriver.id,
          ...data,
          idCompany: finalCompanyId,
        } as UpdateDriverRequest);
        toast.success("Chofer actualizado");
      } else {
        await createMutation.mutateAsync({
          ...data,
          idCompany: finalCompanyId,
        });
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

  if (isLoading)
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
                <Button onClick={handleOpenNew}>
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o DNI..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                            <DropdownMenuItem onClick={() => handleEdit(d)}>
                              <Edit size={14} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteDriver(d);
                                setOpenDeleteDialog(true);
                              }}
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
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingDriver(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white">
          <div className="bg-primary px-8 py-10 text-primary-foreground relative">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
              {editingDriver
                ? "Editar Datos del Chofer"
                : "Registrar Nuevo Chofer"}
            </DialogTitle>
            <DialogDescription className="text-blue-100/70 text-sm mt-1 font-medium">
              Ingresá los datos identificatorios y de contacto.
            </DialogDescription>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
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
              onClick={() => setOpenDialog(false)}
              className="rounded-xl font-bold text-slate-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="driver-form"
              onClick={form.handleSubmit(onSubmit)}
              className="rounded-xl bg-primary text-primary-foreground font-bold px-10 shadow-xl hover:bg-primary/90 transition-all"
            >
              {editingDriver ? "Guardar Cambios" : "Confirmar Chofer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="¿Desactivar chofer?"
        description={
          <>
            El chofer <strong>"{deleteDriver?.name}"</strong> dejará de estar
            disponible para asignar a nuevas cargas de combustible.
          </>
        }
        confirmLabel="Sí, desactivar"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
