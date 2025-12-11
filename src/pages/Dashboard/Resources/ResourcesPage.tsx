// src/pages/Dashboard/Resources/ResourcesPage.tsx
import { useState, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PropaneTankIcon from "@mui/icons-material/PropaneTank";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CategoryIcon from "@mui/icons-material/Category";
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

type ResourceFilter = "all" | number; // number es el idType

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
    showDeleteButtons,
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

    // Debug: Log de recursos recibidos
    if (allResources.length > 0) {
      console.log("🔍 [ResourcesPage] Recursos recibidos:", allResources);
    }

    // Filtrar recursos inactivos (active: false)
    filtered = filtered.filter(
      (r) => r.active !== false && r.isActive !== false
    );

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

    // Filtrar por tipo (excluir vehículos que tienen idType: 1)
    // Si filterType es un número, filtrar por ese idType específico
    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.idType === filterType);
    } else {
      // Mostrar todos excepto vehículos
      // Un recurso es vehículo si: idType === 1 Y (no tiene type array O el type no es tanque/surtidor)
      filtered = filtered.filter((r) => {
        const typeArray = (r as any).type || [];
        // Si tiene type array, mostrar si es tanque o surtidor (incluso si idType es 1)
        if (typeArray.length > 0) {
          const isTankOrDispenser = typeArray.some(
            (t: string) =>
              t.toLowerCase().includes("tanque") ||
              t.toLowerCase().includes("surtidor") ||
              t.toLowerCase().includes("dispenser")
          );
          return isTankOrDispenser;
        }
        // Si no tiene type array, excluir idType 1 (vehículos)
        return r.idType !== 1;
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

    console.log(
      `🔍 [ResourcesPage] Recursos filtrados: ${filtered.length} de ${allResources.length}`
    );
    return filtered;
  }, [
    allResources,
    searchTerm,
    companyIdFilter,
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
        return rt.isActive !== false && !isVehicle;
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
      name: resource.name,
      identifier: resource.identifier,
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleDeleteClick = (resource: Resource) => {
    setDeleteResource(resource);
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
    const isValid = Object.keys(newErrors).length === 0;
    console.log("🔍 [ResourcesPage] Validación:", {
      isValid,
      errors: newErrors,
      formData,
    });
    return isValid;
  };

  const handleSave = async () => {
    console.log("🔍 [ResourcesPage] handleSave llamado");
    console.log("🔍 [ResourcesPage] formData:", formData);

    if (!validate()) {
      console.log("❌ [ResourcesPage] Validación falló, errors:", errors);
      return;
    }

    try {
      if (editingResource) {
        const updateData: UpdateResourceRequest = {
          id: editingResource.id,
          idType: formData.idType,
          idCompany: formData.idCompany,
          idBusinessUnit: formData.idBusinessUnit,
          nativeLiters: formData.nativeLiters,
          name: formData.name,
          identifier: formData.identifier,
        };
        console.log("🔄 [ResourcesPage] Actualizando recurso:", updateData);
        await updateMutation.mutateAsync(updateData);
      } else {
        // Preparar payload para creación
        // MULTI-TENANT: Usar SIEMPRE el idCompany del usuario autenticado (excepto superadmin)
        const finalIdCompany =
          user?.role === "superadmin"
            ? formData.idCompany || user?.idCompany || user?.empresaId || 0
            : user?.idCompany || user?.empresaId || 0;

        const createPayload: CreateResourceRequest = {
          idType: formData.idType,
          idCompany: finalIdCompany, // ✅ Usar idCompany del usuario autenticado
          idBusinessUnit: formData.idBusinessUnit ?? 0,
          nativeLiters: formData.nativeLiters ?? 0,
          name: formData.name.trim(),
          identifier: formData.identifier.trim(),
        };

        console.log(
          "🏢 [ResourcesPage] Multi-tenant: idCompany del usuario autenticado:",
          finalIdCompany
        );
        console.log(
          "➕ [ResourcesPage] Creando recurso con payload:",
          createPayload
        );
        console.log("➕ [ResourcesPage] Mutation state:", {
          isPending: createMutation.isPending,
          isError: createMutation.isError,
          error: createMutation.error,
        });
        await createMutation.mutateAsync(createPayload);
        console.log("✅ [ResourcesPage] Recurso creado exitosamente");
      }
      setOpenDialog(false);
    } catch (error) {
      console.error("❌ [ResourcesPage] Error al guardar recurso:", error);
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
      const typeArray = (r as any).type || [];
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
      setResourceTypeFormData({ name: resourceType.name });
    } else {
      setEditingResourceType(null);
      setResourceTypeFormData({ name: "" });
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
        };
        await updateResourceTypeMutation.mutateAsync(updateData);
      } else {
        await createResourceTypeMutation.mutateAsync(resourceTypeFormData);
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
    const typeArray = (resource as any).type || [];
    const typeName = typeArray.join(" ").toLowerCase() || "";
    if (typeName.includes("tanque")) {
      return <PropaneTankIcon />;
    }
    if (typeName.includes("surtidor") || typeName.includes("dispenser")) {
      return <LocalGasStationIcon />;
    }
    return <PropaneTankIcon />;
  };

  const getResourceTypeName = (resource: Resource) => {
    const typeArray = (resource as any).type || [];
    if (typeArray.length > 0) {
      return typeArray[0];
    }
    return (
      resourceTypes.find((rt) => rt.id === resource.idType)?.name || "Recurso"
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            // @ts-expect-error - MUI v7 Grid type incompatibility
            <Grid xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error al cargar recursos:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, lineHeight: 1.1, mb: 0.5 }}
          >
            Recursos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredResources.length}{" "}
            {filteredResources.length === 1 ? "recurso" : "recursos"}{" "}
            registrados
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {showExportButtons && (
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={filteredResources.length === 0}
              sx={{
                borderColor: "#10b981",
                color: "#10b981",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { borderColor: "#059669", bgcolor: "#10b98110" },
              }}
            >
              Exportar
            </Button>
          )}
          {canManageResources && (
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={handleNewResourceType}
              disabled={isReadOnly}
              sx={{
                borderColor: "#3b82f6",
                color: "#3b82f6",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { borderColor: "#2563eb", bgcolor: "#3b82f610" },
              }}
            >
              Tipos de Recursos
            </Button>
          )}
          {showCreateButtons && canManageResources && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
              disabled={createMutation.isPending || isReadOnly}
              sx={{
                bgcolor: "#1E2C56",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#16213E" },
              }}
            >
              Nuevo Recurso
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs para filtrar por tipo (dinámicos según tipos de recursos disponibles) */}
      {availableResourceTypes.length > 0 && (
        <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={filterType}
            onChange={(_, newValue) =>
              setFilterType(newValue as ResourceFilter)
            }
            sx={{ mb: -1 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Todos" value="all" />
            {availableResourceTypes.map((resourceType) => (
              <Tab
                key={resourceType.id}
                label={resourceType.name}
                value={resourceType.id}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Filtros */}
      <Box
        sx={{
          mb: 3,
          background: "white",
          borderRadius: 2,
          border: "1px solid #e2e8f0",
          p: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Buscar por nombre o identificador..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Grid de recursos */}
      <Grid container spacing={3}>
        {filteredResources.map((resource) => {
          const company = companies.find((c) => c.id === resource.idCompany);
          const businessUnit = businessUnits.find(
            (bu) => bu.id === resource.idBusinessUnit
          );
          const typeName = getResourceTypeName(resource);
          return (
            // @ts-expect-error - MUI v7 Grid type incompatibility
            <Grid xs={12} sm={6} md={4} lg={3} key={resource.id}>
              <Card
                elevation={0}
                sx={{
                  background: "white",
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
                    transform: "translateY(-3px)",
                    borderColor: "#10b981",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 2.5,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Header */}
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "#10b98115",
                        color: "#10b981",
                      }}
                    >
                      {getResourceIcon(resource)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {resource.name}
                      </Typography>
                      <Chip
                        label={resource.identifier}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                          fontWeight: 600,
                          fontSize: 11,
                          mt: 0.5,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Tipo */}
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={typeName}
                      size="small"
                      sx={{
                        bgcolor: "#3b82f615",
                        color: "#3b82f6",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {/* Capacidad */}
                  {resource.nativeLiters && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Capacidad: {resource.nativeLiters} L
                      </Typography>
                    </Box>
                  )}

                  {/* Empresa y Unidad */}
                  {company && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {company.name}
                      </Typography>
                    </Box>
                  )}

                  {businessUnit && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {businessUnit.name}
                      </Typography>
                    </Box>
                  )}

                  {/* Acciones */}
                  {!isReadOnly && (
                    <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 1 }}>
                      {showEditButtons && canManageResources && (
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(resource)}
                          disabled={updateMutation.isPending || !canEdit}
                          sx={{
                            bgcolor: "#f3f4f6",
                            "&:hover": { bgcolor: "#e5e7eb" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {showDeleteButtons && canManageResources && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(resource)}
                          disabled={deactivateMutation.isPending || !canDelete}
                          sx={{
                            bgcolor: "#fee2e2",
                            color: "#dc2626",
                            "&:hover": { bgcolor: "#fecaca" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty state */}
      {filteredResources.length === 0 && !isLoading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <PropaneTankIcon sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay recursos registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Haz clic en 'Nuevo Recurso' para agregar uno
          </Typography>
        </Box>
      )}

      {/* Diálogo de crear/editar */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingResource ? "Editar Recurso" : "Nuevo Recurso"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            {/* Tipo de Recurso */}
            <FormControl fullWidth error={!!errors.idType}>
              <InputLabel>Tipo de Recurso *</InputLabel>
              <Select
                value={formData.idType}
                label="Tipo de Recurso *"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idType: Number(e.target.value),
                  })
                }
              >
                {nonVehicleTypes.map((rt) => (
                  <MenuItem key={rt.id} value={rt.id}>
                    {rt.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.idType && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.idType}
                </Typography>
              )}
            </FormControl>

            {/* Empresa (solo si es superadmin o hay múltiples empresas) */}
            {(user?.role === "superadmin" || companies.length > 1) && (
              <FormControl fullWidth error={!!errors.idCompany}>
                <InputLabel>Empresa *</InputLabel>
                <Select
                  value={formData.idCompany}
                  label="Empresa *"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      idCompany: Number(e.target.value),
                    })
                  }
                >
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.idCompany && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.idCompany}
                  </Typography>
                )}
              </FormControl>
            )}

            {/* Unidad de Negocio */}
            <FormControl fullWidth>
              <InputLabel>Unidad de Negocio (opcional)</InputLabel>
              <Select
                value={formData.idBusinessUnit || ""}
                label="Unidad de Negocio (opcional)"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idBusinessUnit: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {(() => {
                  // Filtrar unidades de negocio por la empresa seleccionada
                  // Si no hay empresa seleccionada o es 0, mostrar todas (o las de la empresa del usuario)
                  const companyIdToFilter =
                    formData.idCompany && formData.idCompany !== 0
                      ? formData.idCompany
                      : idCompany || undefined;

                  const filteredUnits = companyIdToFilter
                    ? businessUnits.filter(
                        (bu) => bu.idCompany === companyIdToFilter
                      )
                    : businessUnits;

                  console.log(
                    "🔍 [ResourcesPage] Unidades de negocio filtradas:",
                    {
                      formDataIdCompany: formData.idCompany,
                      userIdCompany: idCompany,
                      companyIdToFilter,
                      totalBusinessUnits: businessUnits.length,
                      filteredUnits: filteredUnits.length,
                      businessUnits: businessUnits,
                    }
                  );

                  return filteredUnits.map((bu) => (
                    <MenuItem key={bu.id} value={bu.id}>
                      {bu.name}
                    </MenuItem>
                  ));
                })()}
              </Select>
            </FormControl>

            <TextField
              label="Nombre del Recurso"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
            />

            <TextField
              label="Identificador"
              value={formData.identifier}
              onChange={(e) =>
                setFormData({ ...formData, identifier: e.target.value })
              }
              error={!!errors.identifier}
              helperText={errors.identifier}
              required
              fullWidth
            />

            <TextField
              label="Capacidad (Litros)"
              type="number"
              value={formData.nativeLiters || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nativeLiters: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">L</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{ bgcolor: "#1E2C56", "&:hover": { bgcolor: "#16213E" } }}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Guardando..."
              : editingResource
              ? "Guardar Cambios"
              : "Crear Recurso"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de desactivar el recurso{" "}
            <strong>{deleteResource?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de lista de tipos de recursos con opciones de editar/eliminar */}
      <Dialog
        open={openResourceTypeListDialog}
        onClose={() => setOpenResourceTypeListDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Gestionar Tipos de Recursos</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Tipos disponibles</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenResourceTypeForm()}
                sx={{
                  bgcolor: "#1E2C56",
                  "&:hover": { bgcolor: "#16213E" },
                }}
              >
                Nuevo Tipo
              </Button>
            </Box>
            {resourceTypes.length === 0 ? (
              <Alert severity="info">
                No hay tipos de recursos registrados. Crea uno nuevo para
                comenzar.
              </Alert>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {resourceTypes.map((resourceType) => (
                  <Card
                    key={resourceType.id}
                    sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #e2e8f0",
                      "&:hover": {
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <Typography variant="body1" fontWeight={600}>
                      {resourceType.name}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditResourceType(resourceType)}
                        sx={{
                          bgcolor: "#f3f4f6",
                          "&:hover": { bgcolor: "#e5e7eb" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleDeleteResourceTypeClick(resourceType)
                        }
                        sx={{
                          bgcolor: "#fee2e2",
                          color: "#dc2626",
                          "&:hover": { bgcolor: "#fecaca" },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenResourceTypeListDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de formulario de tipos de recursos */}
      <Dialog
        open={openResourceTypeFormDialog}
        onClose={() => {
          setOpenResourceTypeFormDialog(false);
          setOpenResourceTypeListDialog(true);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingResourceType
            ? "Editar Tipo de Recurso"
            : "Nuevo Tipo de Recurso"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Nombre del Tipo"
              value={resourceTypeFormData.name}
              onChange={(e) =>
                setResourceTypeFormData({
                  ...resourceTypeFormData,
                  name: e.target.value,
                })
              }
              error={!!resourceTypeErrors.name}
              helperText={resourceTypeErrors.name}
              required
              fullWidth
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setOpenResourceTypeFormDialog(false);
              setOpenResourceTypeListDialog(true);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveResourceType}
            disabled={
              createResourceTypeMutation.isPending ||
              updateResourceTypeMutation.isPending
            }
            sx={{ bgcolor: "#1E2C56", "&:hover": { bgcolor: "#16213E" } }}
          >
            {createResourceTypeMutation.isPending ||
            updateResourceTypeMutation.isPending
              ? "Guardando..."
              : editingResourceType
              ? "Guardar Cambios"
              : "Crear Tipo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de eliminación de tipo de recurso */}
      <Dialog
        open={openDeleteResourceTypeDialog}
        onClose={() => setOpenDeleteResourceTypeDialog(false)}
      >
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de desactivar el tipo de recurso{" "}
            <strong>{deleteResourceType?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer. Los recursos que usen este tipo no
            se verán afectados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteResourceTypeDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteResourceType}
            disabled={deactivateResourceTypeMutation.isPending}
          >
            {deactivateResourceTypeMutation.isPending
              ? "Desactivando..."
              : "Desactivar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
