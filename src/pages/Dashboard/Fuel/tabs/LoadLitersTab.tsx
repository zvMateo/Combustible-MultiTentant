// src/pages/Dashboard/Fuel/tabs/LoadLitersTab.tsx
import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/hooks/queries";
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
  const {
    showCreateButtons,
    showExportButtons,
    isReadOnly,
    companyIdFilter,
    unidadIdsFilter,
    isSupervisor,
    isAuditor,
  } = useRoleLogic();

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
  const createMutation = useCreateLoadLiters();
  const updateMutation = useUpdateLoadLiters();

  // Filtrar cargas por empresa, unidad y búsqueda según el rol
  const filteredLoads = useMemo(() => {
    let filtered = loads;

    // 1. Filtrar por empresa (a través del recurso)
    if (companyIdFilter && companyIdFilter > 0) {
      filtered = filtered.filter(
        (l) => l.resource?.idCompany === companyIdFilter
      );
    }

    // 2. Filtrar por unidad de negocio (Supervisor y Auditor solo ven cargas de su(s) unidad(es))
    if (
      (isSupervisor || isAuditor) &&
      unidadIdsFilter &&
      unidadIdsFilter.length > 0
    ) {
      filtered = filtered.filter((l) => {
        // Si el recurso tiene unidad asignada, verificar que esté en las unidades del usuario
        if (l.resource?.idBusinessUnit) {
          return unidadIdsFilter.includes(l.resource.idBusinessUnit);
        }
        // Si no tiene unidad asignada, no mostrarlo para supervisor/auditor
        return false;
      });
    }

    // 3. Filtrar por búsqueda
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
  }, [
    loads,
    searchTerm,
    companyIdFilter,
    isSupervisor,
    isAuditor,
    unidadIdsFilter,
  ]);

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
      <Card className="border-border">
        <CardContent className="flex items-center gap-2 pt-6">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Cargando cargas...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <TriangleAlert className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Error al cargar cargas de litros:{" "}
              {error instanceof Error ? error.message : "Error desconocido"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Cargas de Litros</CardTitle>
          <CardDescription>
            {filteredLoads.length}{" "}
            {filteredLoads.length === 1
              ? "carga registrada"
              : "cargas registradas"}
          </CardDescription>
        </div>
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
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por recurso o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

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
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleEdit(load)}
                      disabled={updateMutation.isPending}
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredLoads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                      <Droplet className="size-8" />
                      <span>No hay cargas registradas</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>

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
    </Card>
  );
}
