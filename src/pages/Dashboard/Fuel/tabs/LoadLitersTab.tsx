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
import * as XLSX from "xlsx";
import { toast } from "sonner";
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
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type {
  LoadLiters,
  CreateLoadLitersRequest,
  UpdateLoadLitersRequest,
} from "@/types/api.types";

interface FormErrors {
  [key: string]: string;
}

export default function LoadLitersTab() {
  const { user } = useAuthStore();
  const { showCreateButtons, showExportButtons, isReadOnly } = useRoleLogic();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingLoad, setEditingLoad] = useState<LoadLiters | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState<number>(0);
  const [formData, setFormData] = useState<CreateLoadLitersRequest>({
    idResource: 0,
    loadDate: new Date().toISOString().split("T")[0],
    initialLiters: 0,
    finalLiters: 0,
    totalLiters: 0,
    detail: "",
    idFuelType: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});

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
      setFormData((prev) => ({
        ...prev,
        initialLiters: resourceInitialLiters,
      }));
    }
  }, [selectedResource, editingLoad]);

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
    const firstResourceId = resources[0]?.id || 0;
    setSelectedResourceId(firstResourceId);
    setFormData({
      idResource: firstResourceId,
      loadDate: new Date().toISOString().split("T")[0],
      initialLiters: 0,
      finalLiters: 0,
      totalLiters: 0,
      detail: "",
      idFuelType: fuelTypes[0]?.id || 0,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (load: LoadLiters) => {
    setEditingLoad(load);
    setSelectedResourceId(load.idResource);
    setFormData({
      idResource: load.idResource,
      loadDate: load.loadDate.split("T")[0],
      initialLiters: load.initialLiters,
      finalLiters: load.finalLiters,
      totalLiters: load.totalLiters,
      detail: load.detail || "",
      idFuelType: load.idFuelType,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.idResource || formData.idResource === 0) {
      newErrors.idResource = "Debe seleccionar un recurso";
    }
    if (!formData.loadDate) {
      newErrors.loadDate = "La fecha es obligatoria";
    }
    if (!formData.totalLiters || formData.totalLiters <= 0) {
      newErrors.totalLiters = "Debe ingresar los litros cargados";
    }
    if (!formData.idFuelType || formData.idFuelType === 0) {
      newErrors.idFuelType = "Debe seleccionar un tipo de combustible";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingLoad) {
        const updateData: UpdateLoadLitersRequest = {
          id: editingLoad.id,
          idResource: formData.idResource,
          loadDate: new Date(formData.loadDate).toISOString(),
          initialLiters: formData.initialLiters,
          finalLiters: formData.finalLiters,
          totalLiters: formData.totalLiters,
          detail: formData.detail,
          idFuelType: formData.idFuelType,
        };
        await updateMutation.mutateAsync({
          id: editingLoad.id,
          data: updateData,
        });
      } else {
        const createData: CreateLoadLitersRequest = {
          ...formData,
          loadDate: new Date(formData.loadDate).toISOString(),
        };
        await createMutation.mutateAsync(createData);
      }
      setOpenDialog(false);
    } catch {
      // Error manejado por el mutation
    }
  };

  const handleExport = () => {
    const dataToExport = filteredLoads.map((l) => ({
      Fecha: l.loadDate.split("T")[0],
      Recurso: l.nameResource || l.resource?.name || "",
      Identificador: l.resource?.identifier || "",
      "Litros Iniciales": l.initialLiters,
      "Litros Finales": l.finalLiters,
      "Total Litros": l.totalLiters,
      "Tipo Combustible": l.nameFuelType || l.fuelType?.name || "",
      "Unidad/Empresa": getLocationName(l),
      Detalle: l.detail || "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cargas");
    XLSX.writeFile(
      wb,
      `cargas_litros_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Archivo exportado correctamente");
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingLoad ? "Editar Carga" : "Nueva Carga de Litros"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recurso *</label>
              <Select
                value={String(formData.idResource)}
                onValueChange={(value) => {
                  const resourceId = Number(value);
                  setSelectedResourceId(resourceId);
                  setFormData({ ...formData, idResource: resourceId });
                }}
              >
                <SelectTrigger aria-invalid={!!errors.idResource}>
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
              {errors.idResource ? (
                <p className="text-destructive text-xs">{errors.idResource}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de Carga *</label>
              <Input
                type="date"
                value={formData.loadDate}
                onChange={(e) =>
                  setFormData({ ...formData, loadDate: e.target.value })
                }
                aria-invalid={!!errors.loadDate}
              />
              {errors.loadDate ? (
                <p className="text-destructive text-xs">{errors.loadDate}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Litros Cargados *</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  placeholder="Ingrese los litros a cargar"
                  value={
                    formData.totalLiters > 0 ? String(formData.totalLiters) : ""
                  }
                  onChange={(e) => {
                    const litrosCargados = Number(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      totalLiters: litrosCargados,
                      finalLiters: formData.initialLiters + litrosCargados,
                    });
                  }}
                  aria-invalid={!!errors.totalLiters}
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  L
                </div>
              </div>
              {errors.totalLiters ? (
                <p className="text-destructive text-xs">{errors.totalLiters}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Litros Finales</label>
              <div className="relative">
                <Input
                  type="number"
                  value={String(formData.finalLiters)}
                  disabled
                  className="bg-muted"
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  L
                </div>
              </div>
              {/* <p className="text-muted-foreground text-xs">
                Calculado: Litros Iniciales ({formData.initialLiters}) +
                Cargados
              </p> */}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo de Combustible *
              </label>
              <Select
                value={String(formData.idFuelType)}
                onValueChange={(value) =>
                  setFormData({ ...formData, idFuelType: Number(value) })
                }
              >
                <SelectTrigger aria-invalid={!!errors.idFuelType}>
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
              {errors.idFuelType ? (
                <p className="text-destructive text-xs">{errors.idFuelType}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Detalle (opcional)</label>
              <Textarea
                value={formData.detail || ""}
                onChange={(e) =>
                  setFormData({ ...formData, detail: e.target.value })
                }
                rows={2}
              />
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
                : editingLoad
                ? "Guardar Cambios"
                : "Crear Carga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
