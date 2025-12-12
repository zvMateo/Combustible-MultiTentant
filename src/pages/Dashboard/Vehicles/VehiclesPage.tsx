// src/pages/Dashboard/Vehicles/VehiclesPage.tsx
import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Car,
  Edit,
  Trash2,
  Download,
  Fuel,
  Building,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import {
  useVehicles,
  useCreateResource,
  useUpdateResource,
  useDeactivateResource,
} from "@/hooks/queries";
import { useCompanies, useBusinessUnits } from "@/hooks/queries";
import { useResourceTypes } from "@/hooks/queries";
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
} from "@/types/api.types";
import { RESOURCE_TYPES } from "@/types/api.types";

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface FormErrors {
  [key: string]: string;
}

export default function VehiclesPage() {
  const { user } = useAuthStore();
  const {
    isSupervisor,
    isAuditor,
    canManageVehicles,
    canEdit,
    canDelete,
    showCreateButtons,
    showEditButtons,
    showDeleteButtons,
    showExportButtons,
    isReadOnly,
    unidadIdsFilter,
    companyIdFilter,
  } = useRoleLogic();

  const idCompany = companyIdFilter || 2; // Usar companyIdFilter del hook o 2 por defecto

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Resource | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<CreateResourceRequest>({
    idType: RESOURCE_TYPES.VEHICLE,
    idCompany: 2,
    idBusinessUnit: undefined,
    nativeLiters: undefined,
    name: "",
    identifier: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks
  const { data: vehicles = [], isLoading, error } = useVehicles();
  const { data: companies = [] } = useCompanies();
  const { data: businessUnits = [] } = useBusinessUnits();
  const { data: resourceTypes = [] } = useResourceTypes();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deactivateMutation = useDeactivateResource();

  // Obtener el id del tipo "Vehiculo" dinámicamente
  const vehicleTypeId = useMemo(() => {
    const vehicleType = resourceTypes.find(
      (rt) =>
        rt.name.toLowerCase().includes("vehiculo") ||
        rt.name.toLowerCase().includes("vehicle")
    );
    return vehicleType?.id || RESOURCE_TYPES.VEHICLE;
  }, [resourceTypes]);

  // Actualizar formData.idType cuando vehicleTypeId esté disponible
  useEffect(() => {
    if (vehicleTypeId && !editingVehicle && !openDialog) {
      setFormData((prev) => ({
        ...prev,
        idType: vehicleTypeId,
        idCompany: 2,
      }));
    }
  }, [vehicleTypeId, editingVehicle, openDialog]);

  // Filtrar vehículos por empresa, unidad y búsqueda según el rol
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // 1. Filtrar recursos inactivos
    filtered = filtered.filter(
      (v) => v.active !== false && v.isActive !== false
    );

    // 2. Filtrar por empresa del usuario
    if (companyIdFilter && companyIdFilter > 0) {
      filtered = filtered.filter((v) => v.idCompany === companyIdFilter);
    }

    // 3. Filtrar por unidad de negocio (Supervisor y Auditor solo ven su(s) unidad(es))
    if (
      (isSupervisor || isAuditor) &&
      unidadIdsFilter &&
      unidadIdsFilter.length > 0
    ) {
      filtered = filtered.filter((v) => {
        if (v.idBusinessUnit) {
          return unidadIdsFilter.includes(v.idBusinessUnit);
        }
        return false;
      });
    }

    // 4. Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.identifier.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [
    vehicles,
    searchTerm,
    companyIdFilter,
    isSupervisor,
    isAuditor,
    unidadIdsFilter,
  ]);

  // Handlers
  const handleNew = () => {
    setEditingVehicle(null);
    const newFormData = {
      idType: vehicleTypeId,
      idCompany: 2,
      idBusinessUnit: undefined,
      nativeLiters: undefined,
      name: "",
      identifier: "",
    };
    setFormData(newFormData);
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (vehicle: Resource) => {
    setEditingVehicle(vehicle);
    setFormData({
      idType: vehicle.idType,
      idCompany: 2,
      idBusinessUnit: vehicle.idBusinessUnit,
      nativeLiters: vehicle.nativeLiters,
      name: vehicle.name,
      identifier: vehicle.identifier,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (vehicle: Resource) => {
    setDeleteVehicle(vehicle);
    setOpenDeleteDialog(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }
    if (!formData.identifier.trim()) {
      newErrors.identifier = "El identificador es obligatorio";
    }
    if (formData.idCompany !== 2) {
      newErrors.idCompany = "La empresa debe ser 2";
    }
    if (!formData.idType || formData.idType === 0) {
      newErrors.idType = "Debe seleccionar un tipo de recurso";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    try {
      if (editingVehicle) {
        const updateData: UpdateResourceRequest = {
          id: editingVehicle.id,
          idType: formData.idType,
          idCompany: formData.idCompany,
          idBusinessUnit: formData.idBusinessUnit,
          nativeLiters: formData.nativeLiters,
          name: formData.name,
          identifier: formData.identifier,
        };
        await updateMutation.mutateAsync(updateData);
        toast.success("Vehículo actualizado correctamente");
      } else {
        const createPayload: CreateResourceRequest = {
          idType: formData.idType,
          idCompany: formData.idCompany,
          idBusinessUnit: formData.idBusinessUnit ?? 0,
          nativeLiters: formData.nativeLiters ?? 0,
          name: formData.name.trim(),
          identifier: formData.identifier.trim(),
        };
        await createMutation.mutateAsync(createPayload);
        toast.success("Vehículo creado correctamente");
      }
      setOpenDialog(false);
    } catch (error) {
      toast.error("Error al guardar el vehículo");
    }
  };

  const handleDelete = async () => {
    if (!deleteVehicle) return;

    try {
      await deactivateMutation.mutateAsync(deleteVehicle.id);
      toast.success("Vehículo desactivado correctamente");
      setOpenDeleteDialog(false);
      setDeleteVehicle(null);
    } catch (error) {
      toast.error("Error al desactivar el vehículo");
    }
  };

  const handleExport = () => {
    const dataToExport = filteredVehicles.map((v) => {
      const company = companies.find((c) => c.id === v.idCompany);
      const businessUnit = businessUnits.find(
        (bu) => bu.id === v.idBusinessUnit
      );
      return {
        Nombre: v.name,
        Identificador: v.identifier,
        "Capacidad (L)": v.nativeLiters || 0,
        Empresa: company?.name || "",
        "Unidad de Negocio": businessUnit?.name || "",
        Estado: v.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
    XLSX.writeFile(
      wb,
      `vehicles_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Archivo exportado correctamente");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        
        <Progress value={33} className="w-full" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-8 w-20" />
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Error al cargar vehículos:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Vehículos
          </h1>
          <p className="text-gray-600">
            {filteredVehicles.length}{" "}
            {filteredVehicles.length === 1 ? "vehículo" : "vehículos"} registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showExportButtons && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredVehicles.length === 0}
              className="gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
          {showCreateButtons && canManageVehicles && (
            <Button
              onClick={handleNew}
              disabled={createMutation.isPending || isReadOnly}
              className="gap-2 bg-blue-900 hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              Nuevo Vehículo
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o identificador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid de vehículos */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredVehicles.map((vehicle) => {
            const company = companies.find((c) => c.id === vehicle.idCompany);
            const businessUnit = businessUnits.find(
              (bu) => bu.id === vehicle.idBusinessUnit
            );
            const isActive = vehicle.isActive !== false;
            
            return (
              <Card 
                key={vehicle.id}
                className="border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Car className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {vehicle.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className="mt-1 bg-gray-100 text-gray-700"
                      >
                        {vehicle.identifier}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  {vehicle.nativeLiters && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Fuel className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">
                        {vehicle.nativeLiters} L
                      </span>
                    </div>
                  )}

                  {/* Empresa */}
                  {company && (
                    <div className="mb-3">
                      <Badge 
                        variant="outline" 
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <Building className="h-3 w-3 mr-1" />
                        {company.name}
                      </Badge>
                    </div>
                  )}

                  {/* Unidad de Negocio */}
                  {businessUnit && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users className="h-3.5 w-3.5" />
                        <span>{businessUnit.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Estado */}
                  <div className="mb-4">
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={isActive 
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" 
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {isActive ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  {/* Acciones */}
                  {!isReadOnly && (
                    <div className="flex gap-2 pt-3 border-t">
                      {showEditButtons && canManageVehicles && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(vehicle)}
                          disabled={updateMutation.isPending || !canEdit}
                          className="h-8 px-3 flex-1"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                      )}
                      {showDeleteButtons && canManageVehicles && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(vehicle)}
                          disabled={deactivateMutation.isPending || !canDelete}
                          className="h-8 px-3 flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Empty state
        <Card className="border border-gray-200">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Car className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No hay vehículos registrados
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Haz clic en 'Nuevo Vehículo' para agregar uno
                </p>
              </div>
              {showCreateButtons && canManageVehicles && (
                <Button
                  onClick={handleNew}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Vehículo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de crear/editar */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? "Editar Vehículo" : "Nuevo Vehículo"}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle 
                ? "Modifica los datos del vehículo"
                : "Completa los datos para crear un nuevo vehículo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Empresa */}
            {companies.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select
                  value={formData.idCompany.toString()}
                  onValueChange={(value) => 
                    setFormData({ ...formData, idCompany: Number(value) })
                  }
                >
                  <SelectTrigger className={errors.idCompany ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.idCompany && (
                  <p className="text-sm text-red-500">{errors.idCompany}</p>
                )}
              </div>
            )}

            {/* Unidad de Negocio */}
            <div className="space-y-2">
              <Label htmlFor="businessUnit">Unidad de Negocio (opcional)</Label>
              <Select
                value={formData.idBusinessUnit?.toString() || ""}
                onValueChange={(value) => 
                  setFormData({ 
                    ...formData, 
                    idBusinessUnit: value ? Number(value) : undefined 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {(() => {
                    const companyIdToFilter = formData.idCompany || idCompany;
                    const filteredUnits = companyIdToFilter
                      ? businessUnits.filter(
                          (bu) => bu.idCompany === companyIdToFilter
                        )
                      : businessUnits;

                    return filteredUnits.map((bu) => (
                      <SelectItem key={bu.id} value={bu.id.toString()}>
                        {bu.name}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Vehículo *</Label>
              <Input
                id="name"
                placeholder="Ej: Camión Volvo FH16"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Identificador */}
            <div className="space-y-2">
              <Label htmlFor="identifier">Identificador *</Label>
              <Input
                id="identifier"
                placeholder="Ej: VOL-001"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                className={errors.identifier ? "border-red-500" : ""}
              />
              {errors.identifier && (
                <p className="text-sm text-red-500">{errors.identifier}</p>
              )}
            </div>

            {/* Capacidad */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad (Litros)</Label>
              <div className="relative">
                <Input
                  id="capacity"
                  type="number"
                  placeholder="0"
                  value={formData.nativeLiters || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nativeLiters: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="pr-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  L
                </div>
              </div>
              <p className="text-sm text-gray-500">Capacidad del tanque en litros</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="bg-blue-900 hover:bg-blue-800"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : editingVehicle ? (
                "Guardar Cambios"
              ) : (
                "Crear Vehículo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Desactivación</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700">
              ¿Estás seguro de desactivar el vehículo{" "}
              <span className="font-semibold">{deleteVehicle?.name}</span>?
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
              disabled={deactivateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Desactivando...
                </span>
              ) : (
                "Desactivar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}