// src/pages/Dashboard/Fuel/tabs/LoadLitersTab.tsx
import { useState, useMemo, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Droplet,
  Pencil,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";
import { useExcelExport } from "@/hooks";
import {
  useLoadLitersScoped,
  useCreateLoadLiters,
  useUpdateLoadLiters,
  useResources,
  useResource,
  useFuelTypes,
  useBusinessUnits,
  useCompany,
} from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import { useUnidadActivaId } from "@/stores/unidad.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import { useZodForm } from "@/hooks/useZodForm";
import {
  createLoadLitersSchema,
  type CreateLoadLitersFormData,
} from "@/schemas";
import type { LoadLiters, UpdateLoadLitersRequest } from "@/types/api.types";

export default function LoadLitersTab() {
  const { user } = useAuthStore();
  const { showCreateButtons, showExportButtons, isReadOnly } = useRoleLogic();

  const activeBusinessUnitId = useUnidadActivaId();
  const userBusinessUnitId = user?.idBusinessUnit ?? null;
  const businessUnitId =
    activeBusinessUnitId === null
      ? null
      : activeBusinessUnitId ?? userBusinessUnitId ?? null;

  const [openDialog, setOpenDialog] = useState(false);
  const [editingLoad, setEditingLoad] = useState<LoadLiters | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const form = useZodForm<CreateLoadLitersFormData>(createLoadLitersSchema, {
    defaultValues: {
      idResource: 0,
      idBusinessUnit: businessUnitId,
      loadDate: new Date().toISOString().split("T")[0],
      initialLiters: 0,
      finalLiters: 0,
      totalLiters: 0,
      detail: "",
      idFuelType: 0,
    },
  });

  // React Query hooks
  const { data: loads = [], isLoading, error } = useLoadLitersScoped();
  const { data: resources = [] } = useResources();
  const { data: selectedResource } = useResource(selectedResourceId);
  const { data: fuelTypes = [] } = useFuelTypes();
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: company } = useCompany(user?.idCompany ?? 0);
  const createMutation = useCreateLoadLiters();

  // Cuando se obtiene el recurso seleccionado, actualizar initialLiters automáticamente
  useEffect(() => {
    if (selectedResource && !editingLoad) {
      const resourceInitialLiters = selectedResource.initialLiters ?? 0;
      form.setValue("initialLiters", resourceInitialLiters);
      form.setValue("finalLiters", resourceInitialLiters + (form.getValues("totalLiters") ?? 0));
    }
  }, [selectedResource, editingLoad, form]);

  useEffect(() => {
    if (!openDialog || editingLoad) return;

    const currentResourceId = form.getValues("idResource");
    if ((!currentResourceId || currentResourceId === 0) && resources.length > 0) {
      const nextResourceId = resources[0]?.id || 0;
      form.setValue("idResource", nextResourceId);
      setSelectedResourceId(nextResourceId);
    }

    const currentFuelTypeId = form.getValues("idFuelType");
    if ((!currentFuelTypeId || currentFuelTypeId === 0) && fuelTypes.length > 0) {
      form.setValue("idFuelType", fuelTypes[0]?.id || 0);
    }
  }, [editingLoad, fuelTypes, form, openDialog, resources]);

  useEffect(() => {
    if (!openDialog) {
      setValidationError(null);
    }
  }, [openDialog]);

  // Helper para obtener nombre de ubicación (BU o Company)
  const getLocationName = (load: LoadLiters): string => {
    // Buscar el recurso en la lista de resources para obtener su idBusinessUnit
    const resourceFromList = resources.find((r) => r.id === load.idResource);
    const resourceIdBU =
      load.resource?.idBusinessUnit ?? resourceFromList?.idBusinessUnit;

    // Si tiene unidad de negocio, buscar el nombre
    if (resourceIdBU) {
      const bu = businessUnits.find((b) => b.id === resourceIdBU);
      if (bu?.name) return bu.name;
    }
    // Si el recurso tiene businessUnit como string/array
    if (load.resource?.businessUnit) {
      const buArr = load.resource.businessUnit;
      if (Array.isArray(buArr) && buArr[0]) return String(buArr[0]);
      if (typeof buArr === "string" && buArr) return buArr;
    }
    // Fallback: nombre de la empresa
    return company?.name || user?.empresaNombre || "Sin asignar";
  };
  const updateMutation = useUpdateLoadLiters();

  // Filtrar cargas por búsqueda (el scoping por Company/BU ya lo hace useLoadLitersScoped)
  const filteredLoads = useMemo(() => {
    let filtered = loads;

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.nameResource && l.nameResource.toLowerCase().includes(term)) ||
          (l.resource?.name && l.resource.name.toLowerCase().includes(term)) ||
          (l.resource?.identifier &&
            l.resource.identifier.toLowerCase().includes(term)) ||
          (l.detail && l.detail.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [loads, searchTerm]);

  const handleNew = () => {
    setEditingLoad(null);
    setValidationError(null);
    const firstResourceId = resources[0]?.id || 0;
    setSelectedResourceId(firstResourceId);
    form.reset({
      idResource: firstResourceId,
      idBusinessUnit: businessUnitId,
      loadDate: new Date().toISOString().split("T")[0],
      initialLiters: 0,
      finalLiters: 0,
      totalLiters: 0,
      detail: "",
      idFuelType: fuelTypes[0]?.id || 0,
    });
    setOpenDialog(true);
  };

  const handleEdit = (load: LoadLiters) => {
    setEditingLoad(load);
    setValidationError(null);
    setSelectedResourceId(load.idResource);
    const inferredBusinessUnitId =
      load.resource?.idBusinessUnit ??
      resources.find((r) => r.id === load.idResource)?.idBusinessUnit ??
      businessUnitId;
    form.reset({
      idResource: load.idResource,
      idBusinessUnit: inferredBusinessUnitId ?? businessUnitId,
      loadDate: load.loadDate.split("T")[0],
      initialLiters: load.initialLiters,
      finalLiters: load.finalLiters,
      totalLiters: load.totalLiters,
      detail: load.detail || "",
      idFuelType: load.idFuelType,
    });
    setOpenDialog(true);
  };

  const onSubmit = async (data: CreateLoadLitersFormData) => {
    setValidationError(null);

    const resourceInitial = selectedResource?.initialLiters ?? data.initialLiters ?? 0;
    const calculatedFinal = resourceInitial + (data.totalLiters ?? 0);

    if (resourceInitial < 0 || calculatedFinal < 0) {
      setValidationError(
        `No se puede guardar la carga: el recurso quedaría con ${calculatedFinal} L. Stock actual: ${resourceInitial} L.`
      );
      return;
    }

    try {
      if (editingLoad) {
        const updateData: UpdateLoadLitersRequest = {
          id: editingLoad.id,
          idResource: data.idResource,
          idBusinessUnit: data.idBusinessUnit,
          loadDate: new Date(data.loadDate).toISOString(),
          initialLiters: resourceInitial,
          finalLiters: calculatedFinal,
          totalLiters: data.totalLiters,
          detail: data.detail,
          idFuelType: data.idFuelType,
        };
        await updateMutation.mutateAsync({
          id: editingLoad.id,
          data: updateData,
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          idBusinessUnit: data.idBusinessUnit ?? businessUnitId,
          loadDate: new Date(data.loadDate).toISOString(),
          initialLiters: resourceInitial,
          finalLiters: calculatedFinal,
        });
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  const { exportToExcel } = useExcelExport<LoadLiters>();

  const handleExport = () => {
    exportToExcel(filteredLoads, {
      fileName: "cargas_litros",
      sheetName: "Cargas",
      transform: (l) => ({
        Fecha: l.loadDate.split("T")[0],
        Recurso: l.nameResource || l.resource?.name || "",
        Identificador: l.resource?.identifier || "",
        "Litros Iniciales": l.initialLiters,
        "Litros Finales": l.finalLiters,
        "Total Litros": l.totalLiters,
        "Tipo Combustible": l.nameFuelType || l.fuelType?.name || "",
        "Unidad/Empresa": getLocationName(l),
        Detalle: l.detail || "",
      }),
    });
  };

  if (isLoading) {
    return (
      <SectionCard>
        <div className="flex items-center gap-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Cargando cargas...
          </span>
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard>
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error al cargar cargas de litros:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Cargas de Litros"
      description={`${filteredLoads.length} ${
        filteredLoads.length === 1 ? "carga registrada" : "cargas registradas"
      }`}
      actions={
        <div className="flex gap-2">
          {showExportButtons ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={filteredLoads.length === 0}
              size="sm"
            >
              <Download className="size-4" />
              Exportar
            </Button>
          ) : null}
          {showCreateButtons ? (
            <Button
              type="button"
              onClick={handleNew}
              disabled={createMutation.isPending || isReadOnly}
              size="sm"
            >
              <Plus className="size-4" />
              Nueva Carga
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por recurso o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {filteredLoads.length === 0 ? (
          <EmptyState
            icon={<Droplet className="size-10" />}
            title="No hay cargas registradas"
            description={
              showCreateButtons && !isReadOnly
                ? 'Haz clic en "Nueva Carga" para agregar una'
                : "No hay datos para mostrar"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead className="text-right">L. Iniciales</TableHead>
                  <TableHead className="text-right">L. Finales</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Combustible</TableHead>
                  <TableHead>Unidad/Empresa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell>
                      {new Date(load.loadDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {load.nameResource || load.resource?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {load.initialLiters} L
                    </TableCell>
                    <TableCell className="text-right">
                      {load.finalLiters} L
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{load.totalLiters} L</Badge>
                    </TableCell>
                    <TableCell>
                      {load.nameFuelType || load.fuelType?.name || "-"}
                    </TableCell>
                    <TableCell>{getLocationName(load)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(load)}
                        disabled={updateMutation.isPending}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingLoad(null);
            setSelectedResourceId(0);
            setValidationError(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingLoad ? "Editar Carga" : "Nueva Carga de Litros"}
            </DialogTitle>
          </DialogHeader>

          {validationError ? (
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertTitle>Error de validación</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          ) : null}

          <form
            id="load-liters-form"
            onSubmit={form.handleSubmit(onSubmit, () => {
              const errors = form.formState.errors;
              const firstError = Object.values(errors)[0];
              const message =
                typeof firstError?.message === "string" && firstError.message
                  ? firstError.message
                  : "Revisá los campos obligatorios antes de guardar.";
              setValidationError(message);
            })}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" {...form.register("idResource", { valueAsNumber: true })} />
            <input
              type="hidden"
              {...form.register("idBusinessUnit", { valueAsNumber: true })}
            />
            <input type="hidden" {...form.register("idFuelType", { valueAsNumber: true })} />
            <input
              type="hidden"
              {...form.register("initialLiters", { valueAsNumber: true })}
            />
            <input
              type="hidden"
              {...form.register("finalLiters", { valueAsNumber: true })}
            />
            <input
              type="hidden"
              {...form.register("totalLiters", { valueAsNumber: true })}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Recurso *</label>
              <Select
                value={String(form.watch("idResource") || "")}
                onValueChange={(value) => {
                  const resourceId = Number(value);
                  setSelectedResourceId(resourceId);
                  form.setValue("idResource", resourceId);
                  setValidationError(null);
                }}
              >
                <SelectTrigger
                  aria-invalid={!!form.formState.errors.idResource}
                >
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.identifier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.idResource && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.idResource.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Unidad de Negocio (opcional)
              </label>
              <Select
                value={
                  form.watch("idBusinessUnit") != null
                    ? String(form.watch("idBusinessUnit"))
                    : "none"
                }
                onValueChange={(value) =>
                  form.setValue(
                    "idBusinessUnit",
                    value === "none" ? null : Number(value)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {businessUnits
                    .filter((bu) => bu.idCompany === (user?.idCompany ?? 0))
                    .map((bu) => (
                      <SelectItem key={bu.id} value={String(bu.id)}>
                        {bu.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Carga *</label>
              <Input
                type="date"
                {...form.register("loadDate")}
                aria-invalid={!!form.formState.errors.loadDate}
              />
              {form.formState.errors.loadDate && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.loadDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Litros Cargados *</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  placeholder="Ingrese los litros a cargar"
                  value={
                    form.watch("totalLiters") > 0
                      ? String(form.watch("totalLiters"))
                      : ""
                  }
                  onChange={(e) => {
                    const litrosCargados = Number(e.target.value) || 0;
                    form.setValue("totalLiters", litrosCargados);
                    form.setValue(
                      "finalLiters",
                      form.watch("initialLiters") + litrosCargados
                    );
                    setValidationError(null);
                  }}
                  aria-invalid={!!form.formState.errors.totalLiters}
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  L
                </div>
              </div>
              {form.formState.errors.totalLiters && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.totalLiters.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Litros Finales</label>
              <div className="relative">
                <Input
                  type="number"
                  value={String(form.watch("finalLiters"))}
                  disabled
                  className="bg-muted"
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  L
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo de Combustible *
              </label>
              <Select
                value={String(form.watch("idFuelType") || "")}
                onValueChange={(value) =>
                  form.setValue("idFuelType", Number(value))
                }
              >
                <SelectTrigger
                  aria-invalid={!!form.formState.errors.idFuelType}
                >
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((ft) => (
                    <SelectItem key={ft.id} value={String(ft.id)}>
                      {ft.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.idFuelType && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.idFuelType.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Detalle (opcional)</label>
              <Textarea {...form.register("detail")} rows={2} />
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : editingLoad
                  ? "Guardar Cambios"
                  : "Crear Carga"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
