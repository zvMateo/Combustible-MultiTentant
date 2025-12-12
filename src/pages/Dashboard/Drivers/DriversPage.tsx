// src/pages/Dashboard/Drivers/DriversPage.tsx
import { useState, useMemo, useEffect } from "react";
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
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// Hooks
import { useAuthStore } from "@/stores/auth.store";
import { useRoleLogic } from "@/hooks/useRoleLogic";
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeactivateDriver,
} from "@/hooks/queries";
import { useCompanies } from "@/hooks/queries";
import type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
} from "@/types/api.types";

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormErrors {
  [key: string]: string;
}

// Colores para avatares
const getAvatarColor = (name: string): string => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

// Obtener iniciales
const getInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function DriversPage() {
  const { user } = useAuthStore();
  const {
    canManageDrivers,
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

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<CreateDriverRequest>({
    idCompany: idCompany || 0,
    name: "",
    dni: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // React Query hooks - Siempre usar GetAll
  const { data: driversAll = [], isLoading, error } = useDrivers();
  const { data: companies = [] } = useCompanies();
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deactivateMutation = useDeactivateDriver();

  // Filtrar choferes por empresa, unidad y búsqueda según el rol
  const filteredDrivers = useMemo(() => {
    let filtered = Array.isArray(driversAll) ? driversAll : [];

    // 1. Filtrar por empresa del usuario
    if (companyIdFilter && companyIdFilter > 0) {
      filtered = filtered.filter((d) => d.idCompany === companyIdFilter);
    }

    // 2. Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.dni.toLowerCase().includes(term) ||
          (d.phoneNumber && d.phoneNumber.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [driversAll, searchTerm, companyIdFilter]);

  // Handlers
  const handleNew = () => {
    setEditingDriver(null);
    setFormData({
      idCompany: idCompany || 2, // Usar idCompany del usuario o 2 por defecto
      name: "",
      dni: "",
      phoneNumber: "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      idCompany: driver.idCompany,
      name: driver.name,
      dni: driver.dni,
      phoneNumber: driver.phoneNumber || "",
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (driver: Driver) => {
    setDeleteDriver(driver);
    setOpenDeleteDialog(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }
    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es obligatorio";
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = "DNI inválido (7-8 dígitos)";
    }

    // Asegurar que idCompany tenga un valor válido
    const finalIdCompany =
      formData.idCompany || idCompany || companies[0]?.id || 0;
    if (!finalIdCompany || finalIdCompany === 0) {
      newErrors.idCompany = "Debe seleccionar una empresa";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    try {
      const finalIdCompany =
        idCompany || user?.idCompany || user?.empresaId || 0;
      const dataToSend = { ...formData, idCompany: finalIdCompany };

      if (editingDriver) {
        const updateData: UpdateDriverRequest = {
          id: editingDriver.id,
          idCompany: dataToSend.idCompany,
          name: dataToSend.name,
          dni: dataToSend.dni,
          phoneNumber: dataToSend.phoneNumber,
        };
        await updateMutation.mutateAsync(updateData);
        toast.success("Chofer actualizado correctamente");
      } else {
        await createMutation.mutateAsync(dataToSend);
        toast.success("Chofer creado correctamente");
      }
      setOpenDialog(false);
    } catch (error) {
      toast.error("Error al guardar el chofer");
    }
  };

  // Si el form quedó con idCompany = 0 pero ya tenemos empresas / usuario, setearlo
  useEffect(() => {
    if (!formData.idCompany) {
      const fallbackCompanyId =
        idCompany ||
        companies[0]?.id ||
        (companies.length > 0 ? companies[0].id : 0);
      setFormData((prev) => ({
        ...prev,
        idCompany: prev.idCompany || fallbackCompanyId,
      }));
    }
  }, [companies, formData.idCompany, idCompany]);

  const handleDelete = async () => {
    if (!deleteDriver) return;

    try {
      await deactivateMutation.mutateAsync(deleteDriver.id);
      toast.success("Chofer desactivado correctamente");
      setOpenDeleteDialog(false);
      setDeleteDriver(null);
    } catch (error) {
      toast.error("Error al desactivar el chofer");
    }
  };

  const handleExport = () => {
    const dataToExport = filteredDrivers.map((d) => {
      const company = companies.find((c) => c.id === d.idCompany);
      return {
        Nombre: d.name,
        DNI: d.dni,
        Teléfono: d.phoneNumber || "",
        Empresa: company?.name || "",
        Estado: d.isActive !== false ? "Activo" : "Inactivo",
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Drivers");
    XLSX.writeFile(
      wb,
      `drivers_${new Date().toISOString().split("T")[0]}.xlsx`
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
            Error al cargar choferes:{" "}
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
            Choferes
          </h1>
          <p className="text-gray-600">
            {filteredDrivers.length}{" "}
            {filteredDrivers.length === 1 ? "chofer" : "choferes"} registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showExportButtons && (
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={filteredDrivers.length === 0}
              className="gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
          {showCreateButtons && canManageDrivers && (
            <Button
              onClick={handleNew}
              disabled={createMutation.isPending || isReadOnly}
              className="gap-2 bg-blue-900 hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              Nuevo Chofer
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
              placeholder="Buscar por nombre, DNI o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid de choferes */}
      {filteredDrivers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDrivers.map((driver) => {
            const company = companies.find((c) => c.id === driver.idCompany);
            const isActive = driver.isActive !== false;
            const avatarColor = getAvatarColor(driver.name);
            
            return (
              <Card 
                key={driver.id}
                className={`border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all duration-200 ${
                  !isActive ? "opacity-70" : ""
                }`}
              >
                <CardContent className="p-5">
                  {/* Header con avatar */}
                  <div className="flex items-start gap-3 mb-4">
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {getInitials(driver.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {driver.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <IdCard className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-sm text-gray-600">{driver.dni}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info de contacto */}
                  {driver.phoneNumber && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">{driver.phoneNumber}</span>
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
                      {showEditButtons && canManageDrivers && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(driver)}
                          disabled={updateMutation.isPending || !canEdit}
                          className="h-8 px-3 flex-1"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                      )}
                      {showDeleteButtons && canManageDrivers && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(driver)}
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
                <User className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No hay choferes registrados
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Haz clic en 'Nuevo Chofer' para agregar uno
                </p>
              </div>
              {showCreateButtons && canManageDrivers && (
                <Button
                  onClick={handleNew}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Chofer
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
              {editingDriver ? "Editar Chofer" : "Nuevo Chofer"}
            </DialogTitle>
            <DialogDescription>
              {editingDriver 
                ? "Modifica los datos del chofer"
                : "Completa los datos para crear un nuevo chofer"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              {companies.length > 1 ? (
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
              ) : (
                <Input
                  value={
                    companies.find((c) => c.id === idCompany)?.name ||
                    "Empresa actual"
                  }
                  disabled
                  className="bg-gray-50"
                />
              )}
              {errors.idCompany && (
                <p className="text-sm text-red-500">{errors.idCompany}</p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                placeholder="Nombre completo del chofer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* DNI */}
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                placeholder="12345678"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className={errors.dni ? "border-red-500" : ""}
              />
              {errors.dni ? (
                <p className="text-sm text-red-500">{errors.dni}</p>
              ) : (
                <p className="text-sm text-gray-500">7-8 dígitos</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="Ingresa el número de teléfono"
                  value={formData.phoneNumber || ""}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="pl-10"
                />
              </div>
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
                (!idCompany && companies.length === 0)
              }
              className="bg-blue-900 hover:bg-blue-800"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : editingDriver ? (
                "Guardar Cambios"
              ) : (
                "Crear Chofer"
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
              ¿Estás seguro de desactivar al chofer{" "}
              <span className="font-semibold">{deleteDriver?.name}</span>?
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