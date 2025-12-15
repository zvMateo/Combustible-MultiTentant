// src/pages/Dashboard/Fuel/tabs/LoadLitersTab.tsx
import { useState, useMemo } from "react";
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
  const { data: fuelTypes = [] } = useFuelTypes();
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: company } = useCompany(user?.idCompany ?? 0);
  const createMutation = useCreateLoadLiters();

  // Helper para obtener nombre de ubicación (BU o Company)
  const getLocationName = (load: LoadLiters): string => {
    // Buscar el recurso en la lista de resources para obtener su idBusinessUnit
    const resourceFromList = resources.find((r) => r.id === load.idResource);
    const resourceIdBU = load.resource?.idBusinessUnit ?? resourceFromList?.idBusinessUnit;

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
    setFormData({
      idResource: resources[0]?.id || 0,
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
    if (formData.initialLiters < 0) {
      newErrors.initialLiters = "Los litros iniciales no pueden ser negativos";
    }
    if (formData.finalLiters < 0) {
      newErrors.finalLiters = "Los litros finales no pueden ser negativos";
    }
    if (formData.finalLiters < formData.initialLiters) {
      newErrors.finalLiters =
        "Los litros finales deben ser mayores a los iniciales";
    }
    if (!formData.idFuelType || formData.idFuelType === 0) {
      newErrors.idFuelType = "Debe seleccionar un tipo de combustible";
    }

    // Calcular total automáticamente
    if (formData.initialLiters >= 0 && formData.finalLiters >= 0) {
      setFormData((prev) => ({
        ...prev,
        totalLiters: formData.finalLiters - formData.initialLiters,
      }));
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
                onValueChange={(value) =>
                  setFormData({ ...formData, idResource: Number(value) })
                }
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
              <label className="text-sm font-medium">Litros Iniciales</label>
              <div className="relative">
                <Input
                  type="number"
                  value={String(formData.initialLiters)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialLiters: Number(e.target.value),
                    })
                  }
                  aria-invalid={!!errors.initialLiters}
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  L
                </div>
              </div>
              {errors.initialLiters ? (
                <p className="text-destructive text-xs">
                  {errors.initialLiters}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Litros Finales</label>
              <div className="relative">
                <Input
                  type="number"
                  value={String(formData.finalLiters)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      finalLiters: Number(e.target.value),
                    })
                  }
                  aria-invalid={!!errors.finalLiters}
                />
                <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  L
                </div>
              </div>
              {errors.finalLiters ? (
                <p className="text-destructive text-xs">{errors.finalLiters}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total Litros</label>
              <div className="relative">
                <Input
                  type="number"
                  value={String(formData.totalLiters)}
                  disabled
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
