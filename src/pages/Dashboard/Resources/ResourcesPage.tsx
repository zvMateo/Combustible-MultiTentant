// src/pages/Dashboard/Resources/ResourcesPage.tsx
import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import {
  Download,
  Fuel,
  Layers,
  Package,
  Pencil,
  Plus,
  Search,
  Shapes,
  TriangleAlert,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import {
  useResources,
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
  useResourceTypes,
  useCreateResourceType,
  useUpdateResourceType,
  useDeactivateResourceType,
} from "@/hooks/queries";
import { useCompanies, useBusinessUnits } from "@/hooks/queries";
import type {
  Resource,
  ResourceType,
  CreateResourceRequest,
  UpdateResourceRequest,
  CreateResourceTypeRequest,
  UpdateResourceTypeRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

type ResourceFilter = "all" | string; // string es el idType serializado

export default function ResourcesPage() {
  const { user } = useAuthStore();
  const {
    isSupervisor,
    isAuditor,
    canManageResources,
    canEdit,
    canDelete,
    showCreateButtons,
    showEditButtons,
    showExportButtons,
    isReadOnly,
    unidadIdsFilter,
    companyIdFilter,
  } = useRoleLogic();

  const idCompany = user?.empresaId ?? companyIdFilter ?? 0;

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ResourceFilter>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteResource, setDeleteResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<CreateResourceRequest>({
    idType: 0,
    idCompany: idCompany || 0,
    idBusinessUnit: undefined,
    nativeLiters: undefined,
    actualLiters: undefined,
    name: "",
    identifier: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Estados para gestión de tipos de recursos
  const [openResourceTypeListDialog, setOpenResourceTypeListDialog] =
    useState(false);
  const [openResourceTypeFormDialog, setOpenResourceTypeFormDialog] =
    useState(false);
  const [openDeleteResourceTypeDialog, setOpenDeleteResourceTypeDialog] =
    useState(false);
  const [editingResourceType, setEditingResourceType] =
    useState<ResourceType | null>(null);
  const [deleteResourceType, setDeleteResourceType] =
    useState<ResourceType | null>(null);
  const [resourceTypeFormData, setResourceTypeFormData] =
    useState<CreateResourceTypeRequest>({
      name: "",
      idCompany: idCompany,
      idBusinessUnit: 0,
    });
  const [resourceTypeErrors, setResourceTypeErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: allResources = [], isLoading, error } = useResources();
  const { data: companies = [] } = useCompanies();
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: resourceTypes = [] } = useResourceTypes();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deactivateMutation = useDeactivateResource();
  const createResourceTypeMutation = useCreateResourceType();
  const updateResourceTypeMutation = useUpdateResourceType();
  const deactivateResourceTypeMutation = useDeactivateResourceType();

  // Filtrar recursos por tipo, búsqueda y empresa
  const filteredResources = useMemo(() => {
    let filtered = allResources;

    // NO filtrar recursos inactivos - mostrar todos y usar Switch para activar/desactivar

    // 2. Filtrar por unidad de negocio (Supervisor y Auditor solo ven recursos de su(s) unidad(es))
    if (
      (isSupervisor || isAuditor) &&
      unidadIdsFilter &&
      unidadIdsFilter.length > 0
    ) {
      filtered = filtered.filter((r) => {
        // Si el recurso tiene unidad asignada, verificar que esté en las unidades del usuario
        if (r.idBusinessUnit) {
          return unidadIdsFilter.includes(r.idBusinessUnit);
        }
        // Si no tiene unidad asignada, no mostrarlo para supervisor/auditor
        return false;
      });
    }

    // Filtrar por tipo (excluir vehículos)
    // Si filterType es un número, filtrar por ese idType específico
    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.idType === Number(filterType));
    } else {
      // Mostrar todos excepto vehículos
      // Un recurso es vehículo si tiene "vehiculo" o "vehicle" en el type array, o idType === 5
      filtered = filtered.filter((r) => {
        const typeArray = r.type ?? [];
        if (typeArray.length > 0) {
          // Excluir si el type contiene "vehiculo" o "vehicle"
          const isVehicle = typeArray.some(
            (t) =>
              t.toLowerCase().includes("vehiculo") ||
              t.toLowerCase().includes("vehicle")
          );
          return !isVehicle;
        }
        // Si no tiene type array, excluir idType 5 (vehículos)
        return r.idType !== 5;
      });
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.identifier.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [
    allResources,
    searchTerm,
    isSupervisor,
    isAuditor,
    unidadIdsFilter,
    filterType,
  ]);

  // Obtener tipos de recursos que no sean vehículos
  const nonVehicleTypes = useMemo(() => {
    return resourceTypes.filter((rt) => {
      const name = rt.name.toLowerCase();
      return (
        name.includes("tanque") ||
        name.includes("surtidor") ||
        name.includes("dispenser")
      );
    });
  }, [resourceTypes]);

  // Obtener tipos de recursos disponibles para filtrar (dinámicos)
  // Mostrar todos los tipos de recursos activos, no solo los que tienen recursos asociados
  const availableResourceTypes = useMemo(() => {
    // Obtener todos los tipos de recursos activos que no sean vehículos
    return resourceTypes
      .filter((rt) => {
        // Excluir vehículos basándose en el nombre del tipo
        const name = rt.name.toLowerCase();
        const isVehicle = name.includes("vehiculo") || name.includes("vehicle");
        // Incluir solo si está activo y no es vehículo
        return rt.active !== false && !isVehicle;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabéticamente
  }, [resourceTypes]);

  // Handlers
  const handleNew = () => {
    setEditingResource(null);
    const defaultType = nonVehicleTypes[0]?.id || 2; // Default a tanque si existe
    // Usar idCompany del usuario autenticado si es admin
    const finalIdCompany = user?.idCompany || user?.empresaId || idCompany || 0;
    setFormData({
      idType: defaultType,
      idCompany: finalIdCompany,
      idBusinessUnit: undefined,
      nativeLiters: undefined,
      actualLiters: undefined,
      name: "",
      identifier: "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      idType: resource.idType,
      idCompany: resource.idCompany,
      idBusinessUnit: resource.idBusinessUnit,
      nativeLiters: resource.nativeLiters,
      actualLiters: resource.actualLiters,
      name: resource.name,
      identifier: resource.identifier,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (_resource: Resource) => {
    // Ahora usamos Switch para toggle, pero mantenemos para ConfirmDialog
    setDeleteResource(_resource);
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
    if (!formData.idType || formData.idType === 0) {
      newErrors.idType = "Debe seleccionar un tipo de recurso";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingResource) {
        const updateData: UpdateResourceRequest = {
          id: editingResource.id,
          idType: formData.idType,
          idCompany: formData.idCompany,
          idBusinessUnit: formData.idBusinessUnit,
          nativeLiters: formData.nativeLiters ?? 0,
          actualLiters: formData.actualLiters ?? 0,
          name: formData.name,
          identifier: formData.identifier,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        const finalIdCompany = user?.idCompany || user?.empresaId || 0;
        const createPayload: CreateResourceRequest = {
          idType: formData.idType,
          idCompany: finalIdCompany,
          idBusinessUnit: formData.idBusinessUnit ?? 0,
          nativeLiters: formData.nativeLiters ?? 0,
          actualLiters: formData.actualLiters ?? 0,
          name: formData.name.trim(),
          identifier: formData.identifier.trim(),
        };
        await createMutation.mutateAsync(createPayload);
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteResource) return;

    try {
      await deactivateMutation.mutateAsync(deleteResource.id);
      setOpenDeleteDialog(false);
      setDeleteResource(null);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = filteredResources.map((r) => {
      const company = companies.find((c) => c.id === r.idCompany);
      const businessUnit = businessUnits.find(
        (bu) => bu.id === r.idBusinessUnit
      );
      const typeArray = r.type ?? [];
      const typeName =
        typeArray.join(", ") ||
        resourceTypes.find((rt) => rt.id === r.idType)?.name ||
        "N/A";
      return {
        Nombre: r.name,
        Identificador: r.identifier,
        Tipo: typeName,
        "Capacidad (L)": r.nativeLiters || 0,
        Empresa: company?.name || "",
        "Unidad de Negocio": businessUnit?.name || "",
        Estado: r.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resources");
    XLSX.writeFile(
      wb,
      `resources_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Archivo exportado correctamente");
  };

  // Handlers para gestión de tipos de recursos
  const handleNewResourceType = () => {
    setOpenResourceTypeListDialog(true);
  };

  const handleOpenResourceTypeForm = (resourceType?: ResourceType) => {
    if (resourceType) {
      setEditingResourceType(resourceType);
      setResourceTypeFormData({
        name: resourceType.name,
        idCompany: resourceType.idCompany ?? idCompany,
        idBusinessUnit: resourceType.idBusinessUnit ?? 0,
      });
    } else {
      setEditingResourceType(null);
      setResourceTypeFormData({
        name: "",
        idCompany: idCompany,
        idBusinessUnit: 0,
      });
    }
    setResourceTypeErrors({});
    setOpenResourceTypeFormDialog(true);
    setOpenResourceTypeListDialog(false);
  };

  const handleEditResourceType = (resourceType: ResourceType) => {
    handleOpenResourceTypeForm(resourceType);
  };

  const handleDeleteResourceTypeClick = (resourceType: ResourceType) => {
    setDeleteResourceType(resourceType);
    setOpenDeleteResourceTypeDialog(true);
  };

  const validateResourceType = (): boolean => {
    const newErrors: FormErrors = {};
    if (!resourceTypeFormData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }
    setResourceTypeErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveResourceType = async () => {
    if (!validateResourceType()) return;

    try {
      if (editingResourceType) {
        const updateData: UpdateResourceTypeRequest = {
          id: editingResourceType.id,
          name: resourceTypeFormData.name,
          idCompany: resourceTypeFormData.idCompany,
          idBusinessUnit: resourceTypeFormData.idBusinessUnit,
        };
        await updateResourceTypeMutation.mutateAsync(updateData);
      } else {
        await createResourceTypeMutation.mutateAsync({
          ...resourceTypeFormData,
          idCompany: idCompany,
        });
      }
      setOpenResourceTypeFormDialog(false);
      setOpenResourceTypeListDialog(true); // Volver a la lista
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleDeleteResourceType = async () => {
    if (!deleteResourceType) return;

    try {
      await deactivateResourceTypeMutation.mutateAsync(deleteResourceType.id);
      setOpenDeleteResourceTypeDialog(false);
      setDeleteResourceType(null);
    } catch {
      // Error manejado por el mutation
    }
  };

  const getResourceIcon = (resource: Resource) => {
    const typeArray = resource.type ?? [];
    const typeName = typeArray.join(" ").toLowerCase() || "";
    if (typeName.includes("tanque")) {
      return <Package className="size-5" />;
    }
    if (typeName.includes("surtidor") || typeName.includes("dispenser")) {
      return <Fuel className="size-5" />;
    }
    return <Package className="size-5" />;
  };

  const getResourceTypeName = (resource: Resource) => {
    const typeArray = resource.type ?? [];
    if (typeArray.length > 0) {
      return typeof typeArray[0] === "string" ? typeArray[0] : "Recurso";
    }
    return (
      resourceTypes.find((rt) => rt.id === resource.idType)?.name || "Recurso"
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Recursos" description="Cargando recursos..." />

        <div className="space-y-4">
          <SectionCard>
            <div className="flex items-center gap-2">
              <Spinner className="size-4" />
              <span className="text-sm text-muted-foreground">
                Cargando recursos...
              </span>
            </div>
          </SectionCard>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[180px] w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="Recursos" description="No se pudieron cargar" />

        <div className="space-y-4">
          <SectionCard>
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Error al cargar recursos:{" "}
                {error instanceof Error ? error.message : "Error desconocido"}
              </AlertDescription>
            </Alert>
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Recursos"
        description={`${filteredResources.length} ${
          filteredResources.length === 1 ? "recurso" : "recursos"
        } registrados`}
        actions={
          <>
            {showExportButtons ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={filteredResources.length === 0}
                className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Download className="mr-2 h-4 w-4 text-slate-400" />
                Exportar
              </Button>
            ) : null}

            {canManageResources ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleNewResourceType}
                disabled={isReadOnly}
                className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Shapes className="mr-2 h-4 w-4 text-slate-400" />
                Tipos
              </Button>
            ) : null}

            {showCreateButtons && canManageResources ? (
              <Button
                type="button"
                onClick={handleNew}
                disabled={createMutation.isPending || isReadOnly}
                className="h-10 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95"
              >
                <Plus className="mr-2 h-4 w-4 text-white" />
                Nuevo Recurso
              </Button>
            ) : null}
          </>
        }
      />

      {/* Tabs para filtrar por tipo (dinámicos según tipos de recursos disponibles) */}
      {availableResourceTypes.length > 0 ? (
        <Tabs
          value={filterType}
          onValueChange={setFilterType}
          className="w-full"
        >
          <TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-secondary/50 p-1.5">
            <TabsTrigger
              value="all"
              className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Todos
            </TabsTrigger>
            {availableResourceTypes.map((resourceType) => (
              <TabsTrigger
                key={resourceType.id}
                value={String(resourceType.id)}
                className="h-10 gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {resourceType.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={filterType}>
            {/* content handled below */}
          </TabsContent>
        </Tabs>
      ) : null}

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

      {/* Grid de recursos */}
      <SectionCard>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredResources.map((resource) => {
            const company = companies.find((c) => c.id === resource.idCompany);
            const businessUnit = businessUnits.find(
              (bu) => bu.id === resource.idBusinessUnit
            );
            const typeName = getResourceTypeName(resource);

            return (
              <Card
                key={resource.id}
                className="border-border transition-shadow hover:shadow-md"
              >
                <CardContent className="flex h-full flex-col gap-3 pt-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                      {getResourceIcon(resource)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        {resource.name}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {resource.identifier}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Layers className="size-3" />
                      {typeName}
                    </Badge>
                    {resource.nativeLiters ? (
                      <Badge variant="secondary">
                        {resource.nativeLiters} L
                      </Badge>
                    ) : null}
                  </div>

                  <div className="text-muted-foreground space-y-1 text-xs">
                    {company ? (
                      <div className="truncate">{company.name}</div>
                    ) : null}
                    {businessUnit ? (
                      <div className="truncate">{businessUnit.name}</div>
                    ) : null}
                  </div>

                  {/* Estado y acciones */}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t">
                    <div className={`flex items-center gap-1.5 ${resource.active !== false ? "text-green-600" : "text-red-500"}`}>
                      {resource.active !== false ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                      <span className="text-xs font-medium">
                        {resource.active !== false ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isReadOnly && showEditButtons && canManageResources ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => handleEdit(resource)}
                          disabled={updateMutation.isPending || !canEdit}
                          aria-label="Editar"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      ) : null}

                      {!isReadOnly && canManageResources && canDelete ? (
                        <Switch
                          checked={resource.active !== false}
                          onCheckedChange={() => {
                            deactivateMutation.mutate(resource.id);
                          }}
                          disabled={deactivateMutation.isPending}
                          aria-label={resource.active !== false ? "Desactivar" : "Activar"}
                        />
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredResources.length === 0 ? (
          <EmptyState
            icon={<Package className="size-10" />}
            title="No hay recursos registrados"
            description='Haz clic en "Nuevo Recurso" para agregar uno'
          />
        ) : null}
      </SectionCard>

      {/* Diálogo de crear/editar */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Editar Recurso" : "Nuevo Recurso"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Recurso *</label>
              <Select
                value={String(formData.idType)}
                onValueChange={(value) =>
                  setFormData({ ...formData, idType: Number(value) })
                }
              >
                <SelectTrigger aria-invalid={!!errors.idType}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {nonVehicleTypes.map((rt) => (
                    <SelectItem key={rt.id} value={String(rt.id)}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.idType ? (
                <p className="text-destructive text-xs">{errors.idType}</p>
              ) : null}
            </div>

            {/* Empresa (solo si hay múltiples empresas) */}
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
                  <p className="text-destructive text-xs">{errors.idCompany}</p>
                ) : null}
              </div>
            ) : null}

            {/* Unidad de Negocio */}
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
                  {(() => {
                    const companyIdToFilter =
                      formData.idCompany && formData.idCompany !== 0
                        ? formData.idCompany
                        : idCompany || undefined;

                    const filteredUnits = companyIdToFilter
                      ? businessUnits.filter(
                          (bu) => bu.idCompany === companyIdToFilter
                        )
                      : businessUnits;

                    return filteredUnits.map((bu) => (
                      <SelectItem key={bu.id} value={String(bu.id)}>
                        {bu.name}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nombre del Recurso *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                aria-invalid={!!errors.name}
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
                <p className="text-destructive text-xs">{errors.identifier}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Capacidad (Litros)</label>
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
                : editingResource
                ? "Guardar Cambios"
                : "Crear Recurso"}
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
            ¿Estás seguro de desactivar el recurso{" "}
            <strong>{deleteResource?.name}</strong>? Esta acción no se puede
            deshacer.
          </>
        }
        confirmLabel={
          deactivateMutation.isPending ? "Desactivando..." : "Desactivar"
        }
        onConfirm={handleDelete}
        confirmDisabled={deactivateMutation.isPending}
      />

      {/* Diálogo de lista de tipos de recursos con opciones de editar/eliminar */}
      <Dialog
        open={openResourceTypeListDialog}
        onOpenChange={setOpenResourceTypeListDialog}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Tipos de Recursos</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">Tipos disponibles</div>
            <Button
              type="button"
              size="sm"
              onClick={() => handleOpenResourceTypeForm()}
            >
              <Plus className="size-4" />
              Nuevo Tipo
            </Button>
          </div>

          {resourceTypes.length === 0 ? (
            <Alert>
              <TriangleAlert className="size-4" />
              <AlertTitle>Sin tipos</AlertTitle>
              <AlertDescription>
                No hay tipos de recursos registrados. Crea uno nuevo para
                comenzar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {resourceTypes.map((resourceType) => (
                <Card key={resourceType.id} className="border-border">
                  <CardContent className="flex items-center justify-between gap-3 pt-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {resourceType.name}
                        </span>
                        <span className={`text-xs font-medium ${resourceType.active !== false ? "text-green-600" : "text-red-500"}`}>
                          {resourceType.active !== false ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        ID: {resourceType.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditResourceType(resourceType)}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>

                      <Switch
                        checked={resourceType.active !== false}
                        onCheckedChange={() => {
                          deactivateResourceTypeMutation.mutate(resourceType.id);
                        }}
                        disabled={deactivateResourceTypeMutation.isPending}
                        aria-label={resourceType.active !== false ? "Desactivar" : "Activar"}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenResourceTypeListDialog(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de formulario de tipos de recursos */}
      <Dialog
        open={openResourceTypeFormDialog}
        onOpenChange={(open) => {
          setOpenResourceTypeFormDialog(open);
          if (!open) setOpenResourceTypeListDialog(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingResourceType
                ? "Editar Tipo de Recurso"
                : "Nuevo Tipo de Recurso"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del Tipo *</label>
            <Input
              value={resourceTypeFormData.name}
              onChange={(e) =>
                setResourceTypeFormData({
                  ...resourceTypeFormData,
                  name: e.target.value,
                })
              }
              aria-invalid={!!resourceTypeErrors.name}
              autoFocus
            />
            {resourceTypeErrors.name ? (
              <p className="text-destructive text-xs">
                {resourceTypeErrors.name}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenResourceTypeFormDialog(false);
                setOpenResourceTypeListDialog(true);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveResourceType}
              disabled={
                createResourceTypeMutation.isPending ||
                updateResourceTypeMutation.isPending
              }
            >
              {createResourceTypeMutation.isPending ||
              updateResourceTypeMutation.isPending
                ? "Guardando..."
                : editingResourceType
                ? "Guardar Cambios"
                : "Crear Tipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación de tipo de recurso */}
      <ConfirmDialog
        open={openDeleteResourceTypeDialog}
        onOpenChange={setOpenDeleteResourceTypeDialog}
        title="Confirmar Desactivación"
        description={
          <>
            ¿Estás seguro de desactivar el tipo de recurso{" "}
            <strong>{deleteResourceType?.name}</strong>? Esta acción no se puede
            deshacer. Los recursos que usen este tipo no se verán afectados.
          </>
        }
        confirmLabel={
          deactivateResourceTypeMutation.isPending
            ? "Desactivando..."
            : "Desactivar"
        }
        onConfirm={handleDeleteResourceType}
        confirmDisabled={deactivateResourceTypeMutation.isPending}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="Confirmar Desactivación"
        description={
          <>
            ¿Estás seguro de desactivar el recurso{" "}
            <strong>{deleteResource?.name}</strong>? Esta acción no se puede
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
  );
}
