// src/pages/Dashboard/Tanks/TanksPage.tsx
import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import {
  Download,
  Fuel,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import {
  useTanks,
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
} from "@/hooks/queries";
import { useCompanies, useBusinessUnits } from "@/hooks/queries";
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
} from "@/types/api.types";
import { RESOURCE_TYPES } from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

export default function TanksPage() {
  const { user } = useAuthStore();
  const idCompany = user?.idCompany ?? 0;

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingTank, setEditingTank] = useState<Resource | null>(null);
  const [deleteTank, setDeleteTank] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<CreateResourceRequest>({
    idType: RESOURCE_TYPES.TANK,
    idCompany: idCompany || 0,
    idBusinessUnit: undefined,
    nativeLiters: undefined,
    name: "",
    identifier: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: tanks = [], isLoading, error } = useTanks();
  const { data: companies = [] } = useCompanies();
  const { data: businessUnits = [] } = useBusinessUnits();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deactivateMutation = useDeactivateResource();

  // Filtrar tanques por búsqueda y empresa
  const filteredTanks = useMemo(() => {
    let filtered = tanks;

    // Filtrar por empresa del usuario
    if (idCompany) {
      filtered = filtered.filter((t) => t.idCompany === idCompany);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.identifier.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [tanks, searchTerm, idCompany, user?.role]);

  // Handlers
  const handleNew = () => {
    setEditingTank(null);
    setFormData({
      idType: RESOURCE_TYPES.TANK,
      idCompany: idCompany || companies[0]?.id || 0,
      idBusinessUnit: undefined,
      nativeLiters: undefined,
      name: "",
      identifier: "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (tank: Resource) => {
    setEditingTank(tank);
    setFormData({
      idType: tank.idType,
      idCompany: tank.idCompany,
      idBusinessUnit: tank.idBusinessUnit,
      nativeLiters: tank.nativeLiters,
      name: tank.name,
      identifier: tank.identifier,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (tank: Resource) => {
    setDeleteTank(tank);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }
    if (!formData.identifier.trim()) {
      newErrors.identifier = "El identificador es obligatorio";
    }
    if (!formData.idCompany || formData.idCompany === 0) {
      newErrors.idCompany = "Debe seleccionar una empresa";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingTank) {
        const updateData: UpdateResourceRequest = {
          id: editingTank.id,
          idType: formData.idType,
          idCompany: formData.idCompany,
          idBusinessUnit: formData.idBusinessUnit,
          nativeLiters: formData.nativeLiters,
          name: formData.name,
          identifier: formData.identifier,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        await createMutation.mutateAsync(formData);
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteTank) return;

    try {
      await deactivateMutation.mutateAsync(deleteTank.id);
      setOpenDeleteDialog(false);
      setDeleteTank(null);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = filteredTanks.map((t) => {
      const company = companies.find((c) => c.id === t.idCompany);
      const businessUnit = businessUnits.find(
        (bu) => bu.id === t.idBusinessUnit
      );
      return {
        Nombre: t.name,
        Identificador: t.identifier,
        "Capacidad (L)": t.nativeLiters || 0,
        Empresa: company?.name || "",
        "Unidad de Negocio": businessUnit?.name || "",
        Estado: t.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tanks");
    XLSX.writeFile(wb, `tanks_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Archivo exportado correctamente");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b bg-background px-6 py-6">
          <PageHeader title="Tanques" description="Cargando tanques..." />
        </div>

        <div className="p-6">
          <SectionCard>
            <div className="flex items-center gap-2">
              <Spinner className="size-4" />
              <span className="text-sm text-muted-foreground">
                Cargando tanques...
              </span>
            </div>
          </SectionCard>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-b bg-background px-6 py-6">
          <PageHeader title="Tanques" description="No se pudieron cargar" />
        </div>

        <div className="p-6">
          <SectionCard>
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Error al cargar tanques:{" "}
                {error instanceof Error ? error.message : "Error desconocido"}
              </AlertDescription>
            </Alert>
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b bg-background px-6 py-6">
        <PageHeader
          title="Tanques"
          description={`${filteredTanks.length} ${
            filteredTanks.length === 1 ? "tanque" : "tanques"
          } registrados`}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={filteredTanks.length === 0}
                className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Download className="mr-2 h-4 w-4 text-slate-400" />
                Exportar
              </Button>

              <Button
                type="button"
                onClick={handleNew}
                disabled={createMutation.isPending}
                className="h-10 rounded-xl bg-[#1E2C56] px-6 font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-[#2a3c74] active:scale-95"
              >
                <Plus className="mr-2 h-4 w-4 text-white" />
                Nuevo Tanque
              </Button>
            </>
          }
        />
      </div>

      <div className="p-6 space-y-4">
        {/* Filtros */}
        <SectionCard>
          <div className="relative max-w-md">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nombre o identificador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-sm"
            />
          </div>
        </SectionCard>

        {/* Grid de tanques */}
        <SectionCard>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filteredTanks.map((tank) => {
              const company = companies.find((c) => c.id === tank.idCompany);
              const businessUnit = businessUnits.find(
                (bu) => bu.id === tank.idBusinessUnit
              );

              return (
                <Card
                  key={tank.id}
                  className="border-border transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex h-full flex-col gap-3 pt-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                        <Fuel className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">
                          {tank.name}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {tank.identifier}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tank.nativeLiters ? (
                        <Badge variant="secondary">{tank.nativeLiters} L</Badge>
                      ) : null}
                      <Badge
                        variant="secondary"
                        className={
                          tank.isActive !== false
                            ? "text-emerald-700 bg-emerald-100"
                            : "text-amber-700 bg-amber-100"
                        }
                      >
                        {tank.isActive !== false ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="text-muted-foreground space-y-1 text-xs">
                      {company ? (
                        <div className="truncate">{company.name}</div>
                      ) : null}
                      {businessUnit ? (
                        <div className="truncate">{businessUnit.name}</div>
                      ) : null}
                    </div>

                    <div className="mt-auto flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(tank)}
                        disabled={updateMutation.isPending}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteClick(tank)}
                        disabled={deactivateMutation.isPending}
                        aria-label="Desactivar"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredTanks.length === 0 ? (
            <EmptyState
              icon={<Fuel className="size-10" />}
              title="No hay tanques registrados"
              description='Haz clic en "Nuevo Tanque" para agregar uno'
            />
          ) : null}
        </SectionCard>

        {/* Diálogo de crear/editar */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingTank ? "Editar Tanque" : "Nuevo Tanque"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              {companies.length > 1 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Empresa *</label>
                  <Select
                    value={String(formData.idCompany)}
                    onValueChange={(value) =>
                      setFormData({ ...formData, idCompany: Number(value) })
                    }
                  >
                    <SelectTrigger aria-invalid={!!errors.idCompany}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.idCompany ? (
                    <p className="text-destructive text-xs">
                      {errors.idCompany}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Unidad de Negocio (opcional)
                </label>
                <Select
                  value={
                    formData.idBusinessUnit
                      ? String(formData.idBusinessUnit)
                      : "none"
                  }
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      idBusinessUnit:
                        value === "none" ? undefined : Number(value),
                    })
                  }
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

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nombre del Tanque *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  aria-invalid={!!errors.name}
                  autoFocus
                />
                {errors.name ? (
                  <p className="text-destructive text-xs">{errors.name}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Identificador *</label>
                <Input
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  aria-invalid={!!errors.identifier}
                />
                {errors.identifier ? (
                  <p className="text-destructive text-xs">
                    {errors.identifier}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Capacidad (Litros)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.nativeLiters ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nativeLiters: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    L
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : editingTank
                  ? "Guardar Cambios"
                  : "Crear Tanque"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmación de eliminación */}
        <ConfirmDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          title="Confirmar Desactivación"
          description={
            <>
              ¿Estás seguro de desactivar el tanque{" "}
              <strong>{deleteTank?.name}</strong>? Esta acción no se puede
              deshacer.
            </>
          }
          confirmLabel={
            deactivateMutation.isPending ? "Desactivando..." : "Desactivar"
          }
          onConfirm={handleDelete}
          confirmDisabled={deactivateMutation.isPending}
        />
      </div>
    </div>
  );
}
