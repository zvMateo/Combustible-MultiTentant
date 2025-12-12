// src/pages/Dashboard/BusinessUnits/BusinessUnitsPage.tsx
import { useState, useMemo, useEffect } from "react";
import {
  useBusinessUnits,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeactivateBusinessUnit,
} from "@/hooks/queries";
import { useCompanies } from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import type {
  BusinessUnit,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
} from "@/types/api.types";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Store,
  Download,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const initialFormData: CreateBusinessUnitRequest = {
  idCompany: 0,
  name: "",
  detail: "",
};

export default function BusinessUnitsPage() {
  const { user } = useAuthStore();
  const {
    canManageBusinessUnits,
    canEdit,
    canDelete,
    showCreateButtons,
    showEditButtons,
    showDeleteButtons,
    showExportButtons,
    isReadOnly,
    companyIdFilter,
  } = useRoleLogic();

  const idCompany = user?.empresaId ?? companyIdFilter ?? 0;

  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] =
    useState<CreateBusinessUnitRequest>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // React Query hooks
  const {
    data: businessUnitsAll = [],
    isLoading: loadingAll,
    error: errorAll,
  } = useBusinessUnits();

  const businessUnits = useMemo(
    () => (Array.isArray(businessUnitsAll) ? businessUnitsAll : []),
    [businessUnitsAll]
  );

  const isLoading = loadingAll;
  const error = errorAll;

  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();
  const createMutation = useCreateBusinessUnit();
  const updateMutation = useUpdateBusinessUnit();
  const deactivateMutation = useDeactivateBusinessUnit();

  // Asegurar que idCompany se setee correctamente cuando se abra el diálogo
  useEffect(() => {
    if (openDialog && !formData.idCompany) {
      const fallbackCompanyId =
        idCompany ||
        companies[0]?.id ||
        (companies.length > 0 ? companies[0].id : 0);
      if (fallbackCompanyId && fallbackCompanyId !== formData.idCompany) {
        setFormData((prev) => ({
          ...prev,
          idCompany: prev.idCompany || fallbackCompanyId,
        }));
      }
    }
  }, [openDialog, idCompany, companies, formData.idCompany]);

  const filteredUnits = useMemo(() => {
    let filtered = businessUnits;

    if (idCompany && idCompany > 0) {
      filtered = filtered.filter((u) => u.idCompany === idCompany);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          (u.detail && u.detail.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [businessUnits, searchTerm, idCompany]);

  // Handlers
  const handleNew = () => {
    const fallbackCompanyId =
      idCompany ||
      companies[0]?.id ||
      (companies.length > 0 ? companies[0].id : 0);

    setEditingUnit(null);
    setFormData({
      idCompany: idCompany || fallbackCompanyId,
      name: "",
      detail: "",
    });
    setErrors({});
    setOpenDialog(true);

    if (!idCompany && companies.length === 0 && !loadingCompanies) {
      toast.error(
        "No hay empresas disponibles. Por favor, contacta al administrador."
      );
    }
  };

  const handleEdit = (unit: BusinessUnit) => {
    setEditingUnit(unit);
    setFormData({
      idCompany: unit.idCompany,
      name: unit.name,
      detail: unit.detail || "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDelete = (unit: BusinessUnit) => {
    setDeleteUnit(unit);
    setOpenDeleteDialog(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    const finalIdCompany =
      formData.idCompany || idCompany || companies[0]?.id || 0;

    if (!finalIdCompany || finalIdCompany === 0) {
      if (companies.length === 0 && !loadingCompanies) {
        newErrors.idCompany =
          "No hay empresas disponibles. Contacta al administrador.";
      } else if (loadingCompanies) {
        newErrors.idCompany = "Cargando empresas...";
      } else {
        newErrors.idCompany = "Debe seleccionar una empresa";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const finalIdCompany =
        idCompany || user?.idCompany || user?.empresaId || 0;
      const dataToSend = { ...formData, idCompany: finalIdCompany };

      if (editingUnit) {
        const updateData: UpdateBusinessUnitRequest = {
          id: editingUnit.id,
          idCompany: dataToSend.idCompany,
          name: dataToSend.name,
          detail: dataToSend.detail,
        };
        await updateMutation.mutateAsync(updateData);
        toast.success("Unidad de negocio actualizada correctamente");
      } else {
        await createMutation.mutateAsync(dataToSend);
        toast.success("Unidad de negocio creada correctamente");
      }
      setOpenDialog(false);
    } catch (error) {
      toast.error("Error al guardar la unidad de negocio");
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteUnit) {
      try {
        await deactivateMutation.mutateAsync(deleteUnit.id);
        toast.success("Unidad de negocio desactivada correctamente");
        setOpenDeleteDialog(false);
        setDeleteUnit(null);
      } catch (error) {
        toast.error("Error al desactivar la unidad de negocio");
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredUnits.map((u) => {
      const company = companies.find((c) => c.id === u.idCompany);
      return {
        Nombre: u.name,
        Detalle: u.detail || "",
        Empresa: company?.name || "",
        Estado: u.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Business Units");
    XLSX.writeFile(
      wb,
      `business_units_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Stats
  const stats = {
    total: filteredUnits.length,
    activas: filteredUnits.filter((u) => u.isActive !== false).length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Progress value={33} className="w-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
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
            Error al cargar unidades de negocio:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Unidades de Negocio
        </h1>
        <p className="text-gray-600">
          Gestiona las sucursales, campos y divisiones de tu empresa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Unidades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Store className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar unidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {showExportButtons && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredUnits.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
          {showCreateButtons && canManageBusinessUnits && (
            <Button
              onClick={handleNew}
              disabled={
                createMutation.isPending ||
                isReadOnly ||
                (!idCompany && companies.length === 0 && !loadingCompanies)
              }
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nueva Unidad
            </Button>
          )}
        </div>
      </div>

      {/* Grid de Unidades */}
      {filteredUnits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const company = companies.find((c) => c.id === unit.idCompany);
            const isActive = unit.active !== false && unit.isActive !== false;
            
            return (
              <Card 
                key={unit.id} 
                className={`border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                  !isActive ? "opacity-70" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Store className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{unit.name}</h3>
                        {company && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {company.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={isActive ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}
                    >
                      {isActive ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>

                  {unit.detail && (
                    <p className="text-sm text-gray-600 mb-4">{unit.detail}</p>
                  )}

                  {!isReadOnly && (
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      {showEditButtons && canManageBusinessUnits && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(unit)}
                          disabled={updateMutation.isPending || !canEdit}
                          className="h-8 px-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {showDeleteButtons && canManageBusinessUnits && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(unit)}
                          disabled={deactivateMutation.isPending || !canDelete}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
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
        // Empty State
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Store className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No hay unidades de negocio
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Crea tu primera unidad para comenzar a organizar tu empresa
                </p>
              </div>
              <Button
                onClick={handleNew}
                disabled={!idCompany && companies.length === 0}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Unidad
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Crear/Editar */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Editar Unidad de Negocio" : "Nueva Unidad de Negocio"}
            </DialogTitle>
            <DialogDescription>
              {editingUnit 
                ? "Modifica los datos de la unidad de negocio"
                : "Completa los datos para crear una nueva unidad de negocio"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {idCompany > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  Se usará tu empresa actual para crear la unidad de negocio
                </AlertDescription>
              </Alert>
            )}

            {!idCompany && companies.length === 0 && !loadingCompanies && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  No hay empresas disponibles. Por favor, contacta al administrador o verifica tu sesión.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Nombre de la unidad de negocio"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail">Detalle (opcional)</Label>
              <Textarea
                id="detail"
                placeholder="Información adicional sobre la unidad de negocio"
                value={formData.detail || ""}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                rows={3}
              />
              <p className="text-sm text-gray-500">
                Información adicional sobre la unidad de negocio
              </p>
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
                updateMutation.isPending ||
                (!idCompany && companies.length === 0 && !loadingCompanies)
              }
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : editingUnit ? (
                "Guardar Cambios"
              ) : (
                "Crear Unidad"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Desactivar Unidad</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700">
              ¿Estás seguro de desactivar la unidad{" "}
              <span className="font-semibold">{deleteUnit?.name}</span>?
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
              onClick={handleConfirmDelete}
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