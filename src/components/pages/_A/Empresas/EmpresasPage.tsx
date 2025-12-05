// src/components/pages/_A/Empresas/EmpresasPage.tsx
import { useState, useMemo } from "react";
import {
  useEmpresas,
  useCreateEmpresa,
  useUpdateEmpresa,
  useDeleteEmpresa,
} from "@/hooks/queries/useEmpresas";
import type { Empresa, EmpresaFormData, EmpresaPolicies } from "@/types";
import { DEFAULT_POLICIES, DEFAULT_THEME } from "@/types";
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
  Avatar,
  Skeleton,
  Fade,
  Grow,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  alpha,
  Tabs,
  Tab,
  Drawer,
  LinearProgress,
  Checkbox,
  FormGroup,
  Slider,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DomainIcon from "@mui/icons-material/Domain";
import EmailIcon from "@mui/icons-material/Email";
import PaletteIcon from "@mui/icons-material/Palette";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VerifiedIcon from "@mui/icons-material/Verified";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MicIcon from "@mui/icons-material/Mic";
import SpeedIcon from "@mui/icons-material/Speed";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import VisibilityIcon from "@mui/icons-material/Visibility";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Theme colors
const theme = {
  primary: "#284057",
  secondary: "#66FF99",
  primaryHover: "#2391CB",
  background: "#F8FAFB",
  surface: "#FFFFFF",
  textPrimary: "#284057",
  textSecondary: "#5A6B7D",
  border: "#E8EDF2",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

interface FormErrors {
  [key: string]: string;
}

// Mapeo de interfaces para compatibilidad
interface LocalEmpresaPolicies {
  requiereFotoSurtidor: boolean;
  requiereFotoOdometro: boolean;
  requiereFotoCuentaLitros: boolean;
  requiereUbicacion: boolean;
  requiereAudio: boolean;
  litrosMaximoPorCarga: number;
  precioCombustible: number;
  alertaDuplicados: boolean;
  validacionAutomatica: boolean;
}

interface LocalEmpresaFormData {
  subdomain: string;
  nombre: string;
  razonSocial: string;
  adminEmail: string;
  telefono: string;
  primaryColor: string;
  secondaryColor: string;
  activo: boolean;
  subscriptionPlan: "basic" | "professional" | "enterprise";
  policies: LocalEmpresaPolicies;
}

// Default policies
const defaultLocalPolicies: LocalEmpresaPolicies = {
  requiereFotoSurtidor: true,
  requiereFotoOdometro: true,
  requiereFotoCuentaLitros: false,
  requiereUbicacion: true,
  requiereAudio: false,
  litrosMaximoPorCarga: 500,
  precioCombustible: 850,
  alertaDuplicados: true,
  validacionAutomatica: false,
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("es-AR").format(num);
};

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
};

// Plan badge component
const PlanBadge = ({ plan }: { plan: string }) => {
  const planConfig = {
    basic: {
      label: "Básico",
      color: theme.textSecondary,
      bg: alpha(theme.textSecondary, 0.1),
    },
    professional: {
      label: "Profesional",
      color: theme.info,
      bg: alpha(theme.info, 0.1),
    },
    enterprise: {
      label: "Enterprise",
      color: theme.warning,
      bg: alpha(theme.warning, 0.1),
    },
  };
  const config =
    planConfig[plan as keyof typeof planConfig] || planConfig.basic;

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: 11,
        height: 22,
        borderRadius: 1.5,
      }}
    />
  );
};

// Stat Card Mini Component
const StatMini = ({
  icon,
  value,
  label,
  color = theme.primary,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
}) => (
  <Box sx={{ textAlign: "center", flex: 1 }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        bgcolor: alpha(color, 0.1),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        mb: 0.5,
      }}
    >
      {icon}
    </Box>
    <Typography variant="body2" fontWeight={700} color={theme.textPrimary}>
      {value}
    </Typography>
    <Typography
      variant="caption"
      color={theme.textSecondary}
      sx={{ fontSize: 10 }}
    >
      {label}
    </Typography>
  </Box>
);

// Skeleton Card Component
const SkeletonCard = () => (
  <Card
    elevation={0}
    sx={{
      border: `1px solid ${theme.border}`,
      borderRadius: 4,
      height: "100%",
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="40%" height={18} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
      <Skeleton variant="rounded" height={80} sx={{ mb: 2, borderRadius: 2 }} />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={36}
          sx={{ borderRadius: 2 }}
        />
      </Box>
    </CardContent>
  </Card>
);

// Empty State Component
const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
  <Fade in timeout={600}>
    <Box
      sx={{
        textAlign: "center",
        py: 10,
        px: 4,
        bgcolor: theme.surface,
        borderRadius: 4,
        border: `2px dashed ${theme.border}`,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          bgcolor: alpha(theme.secondary, 0.15),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 3,
        }}
      >
        <BusinessIcon sx={{ fontSize: 56, color: theme.primary }} />
      </Box>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ color: theme.primary, mb: 1 }}
      >
        No hay empresas registradas
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: theme.textSecondary, mb: 4, maxWidth: 400, mx: "auto" }}
      >
        Comienza agregando tu primera empresa para gestionar los tenants del
        sistema de combustible
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddNew}
        sx={{
          bgcolor: theme.primary,
          color: theme.surface,
          fontWeight: 700,
          px: 4,
          py: 1.5,
          fontSize: 16,
          borderRadius: 3,
          textTransform: "none",
          boxShadow: `0 4px 14px ${alpha(theme.primary, 0.35)}`,
          "&:hover": {
            bgcolor: theme.primaryHover,
            transform: "translateY(-2px)",
            boxShadow: `0 6px 20px ${alpha(theme.primaryHover, 0.4)}`,
          },
          transition: "all 0.3s ease",
        }}
      >
        Agregar Primera Empresa
      </Button>
    </Box>
  </Fade>
);

// Tab Panel Component
function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

// Helper para convertir políticas
function mapPoliciesFromApi(policies: EmpresaPolicies): LocalEmpresaPolicies {
  return {
    requiereFotoSurtidor: policies.requireFuelPumpPhoto,
    requiereFotoOdometro: policies.requireOdometerPhoto,
    requiereFotoCuentaLitros: false,
    requiereUbicacion: policies.requiredLocation,
    requiereAudio: policies.requiredAudio,
    litrosMaximoPorCarga: policies.maxLitrosThreshold,
    precioCombustible: policies.fuelPrice,
    alertaDuplicados: true,
    validacionAutomatica: policies.autoValidateEvents,
  };
}

function mapPoliciesToApi(policies: LocalEmpresaPolicies): EmpresaPolicies {
  return {
    ...DEFAULT_POLICIES,
    requireFuelPumpPhoto: policies.requiereFotoSurtidor,
    requireOdometerPhoto: policies.requiereFotoOdometro,
    requiredLocation: policies.requiereUbicacion,
    requiredAudio: policies.requiereAudio,
    maxLitrosThreshold: policies.litrosMaximoPorCarga,
    fuelPrice: policies.precioCombustible,
    autoValidateEvents: policies.validacionAutomatica,
  };
}

export default function EmpresasPage() {
  // React Query hooks
  const { data: empresasResponse, isLoading: loading } = useEmpresas();
  const createMutation = useCreateEmpresa();
  const updateMutation = useUpdateEmpresa();
  const deleteMutation = useDeleteEmpresa();

  const empresas = empresasResponse?.data || [];

  // Local state
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openDetailDrawer, setOpenDetailDrawer] = useState<boolean>(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [deleteEmpresa, setDeleteEmpresa] = useState<Empresa | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<LocalEmpresaFormData>({
    subdomain: "",
    nombre: "",
    razonSocial: "",
    adminEmail: "",
    telefono: "",
    primaryColor: "#284057",
    secondaryColor: "#66FF99",
    activo: true,
    subscriptionPlan: "basic",
    policies: defaultLocalPolicies,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const filteredEmpresas = useMemo(() => {
    return empresas.filter((e) => {
      const matchSearch =
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [empresas, searchTerm]);

  // Calculate totals for header
  const totals = useMemo(
    () => ({
      empresas: empresas.length,
      activas: empresas.filter((e) => e.activo).length,
      usuarios: empresas.reduce(
        (acc, e) => acc + (e.stats?.totalUsers || 0),
        0
      ),
      vehiculos: empresas.reduce(
        (acc, e) => acc + (e.stats?.totalVehicles || 0),
        0
      ),
    }),
    [empresas]
  );

  const handleExport = (): void => {
    const dataToExport = filteredEmpresas.map((e) => ({
      Subdomain: e.subdomain,
      Nombre: e.nombre,
      "Razón Social": e.razonSocial || "",
      "Email Admin": e.adminEmail,
      Teléfono: e.telefono || "",
      Plan: e.subscriptionPlan,
      Estado: e.activo ? "Activo" : "Inactivo",
      "Fecha Creación": e.createdAt
        ? format(new Date(e.createdAt), "dd/MM/yyyy", { locale: es })
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empresas");
    XLSX.writeFile(wb, `Empresas_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const handleNew = (): void => {
    setEditingEmpresa(null);
    setFormData({
      subdomain: "",
      nombre: "",
      razonSocial: "",
      adminEmail: "",
      telefono: "",
      primaryColor: DEFAULT_THEME.primaryColor,
      secondaryColor: DEFAULT_THEME.secondaryColor,
      activo: true,
      subscriptionPlan: "basic",
      policies: defaultLocalPolicies,
    });
    setErrors({});
    setActiveTab(0);
    setOpenDialog(true);
  };

  const handleEdit = (empresa: Empresa): void => {
    setEditingEmpresa(empresa);
    setFormData({
      subdomain: empresa.subdomain,
      nombre: empresa.nombre,
      razonSocial: empresa.razonSocial || "",
      adminEmail: empresa.adminEmail,
      telefono: empresa.telefono || "",
      primaryColor: empresa.theme.primaryColor,
      secondaryColor: empresa.theme.secondaryColor,
      activo: empresa.activo,
      subscriptionPlan: empresa.subscriptionPlan,
      policies: mapPoliciesFromApi(empresa.policies),
    });
    setErrors({});
    setActiveTab(0);
    setOpenDialog(true);
  };

  const handleViewDetail = (empresa: Empresa): void => {
    setSelectedEmpresa(empresa);
    setOpenDetailDrawer(true);
  };

  const handleDeleteClick = (empresa: Empresa): void => {
    setDeleteEmpresa(empresa);
    setOpenDeleteDialog(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = "El subdomain es requerido";
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = "Solo letras minúsculas, números y guiones";
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    const apiData: EmpresaFormData = {
      nombre: formData.nombre,
      razonSocial: formData.razonSocial,
      subdomain: formData.subdomain,
      adminEmail: formData.adminEmail,
      telefono: formData.telefono,
      activo: formData.activo,
      theme: {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
      },
      policies: mapPoliciesToApi(formData.policies),
      subscriptionPlan: formData.subscriptionPlan,
    };

    try {
      if (editingEmpresa) {
        await updateMutation.mutateAsync({
          id: editingEmpresa.id,
          data: apiData,
        });
      } else {
        await createMutation.mutateAsync(apiData);
      }
      setOpenDialog(false);
    } catch {
      // Error ya manejado por el mutation
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteEmpresa) return;

    try {
      await deleteMutation.mutateAsync(deleteEmpresa.id);
      setOpenDeleteDialog(false);
      setDeleteEmpresa(null);
    } catch {
      // Error ya manejado por el mutation
    }
  };

  const copyLoginUrl = (empresa: Empresa): void => {
    const url = `${window.location.origin}/${empresa.subdomain}/login`;
    navigator.clipboard.writeText(url);
    setCopiedId(empresa.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.background, p: 3 }}>
      {/* Header Section */}
      <Fade in timeout={400}>
        <Box
          sx={{
            mb: 4,
            p: 4,
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${alpha(
              theme.primary,
              0.85
            )} 100%)`,
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 10px 40px ${alpha(theme.primary, 0.3)}`,
          }}
        >
          {/* Decorative elements */}
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              bgcolor: alpha(theme.secondary, 0.1),
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              right: 100,
              width: 120,
              height: 120,
              borderRadius: "50%",
              bgcolor: alpha(theme.secondary, 0.08),
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 3,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    bgcolor: alpha(theme.secondary, 0.2),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 28, color: theme.secondary }} />
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{ color: theme.surface }}
                  >
                    Gestión de Empresas
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: alpha(theme.surface, 0.7) }}
                  >
                    Panel de administración de tenants • Sistema de Combustible
                  </Typography>
                </Box>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ display: "flex", gap: 4, mt: 3 }}>
                <Box>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{ color: theme.secondary }}
                  >
                    {loading ? "..." : totals.activas}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: alpha(theme.surface, 0.7) }}
                  >
                    Empresas activas
                  </Typography>
                </Box>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: alpha(theme.surface, 0.2) }}
                />
                <Box>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{ color: theme.surface }}
                  >
                    {loading ? "..." : formatNumber(totals.usuarios)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: alpha(theme.surface, 0.7) }}
                  >
                    Usuarios totales
                  </Typography>
                </Box>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ bgcolor: alpha(theme.surface, 0.2) }}
                />
                <Box>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{ color: theme.surface }}
                  >
                    {loading ? "..." : formatNumber(totals.vehiculos)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: alpha(theme.surface, 0.7) }}
                  >
                    Vehículos registrados
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
              sx={{
                bgcolor: theme.secondary,
                color: theme.primary,
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: 15,
                borderRadius: 3,
                textTransform: "none",
                boxShadow: `0 4px 14px ${alpha(theme.secondary, 0.4)}`,
                "&:hover": {
                  bgcolor: theme.surface,
                  color: theme.primary,
                  transform: "translateY(-2px)",
                  boxShadow: `0 6px 20px ${alpha(theme.surface, 0.4)}`,
                },
                transition: "all 0.3s ease",
              }}
            >
              Nueva Empresa
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Search & Filter Section */}
      <Fade in timeout={500}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
            bgcolor: theme.surface,
            p: 3,
            borderRadius: 3,
            mb: 4,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 2px 12px ${alpha(theme.primary, 0.04)}`,
          }}
        >
          <TextField
            placeholder="Buscar por nombre, subdomain o email..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flexGrow: 1,
              minWidth: 280,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: theme.background,
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: alpha(theme.secondary, 0.05),
                },
                "&.Mui-focused": {
                  bgcolor: theme.surface,
                  boxShadow: `0 0 0 3px ${alpha(theme.secondary, 0.2)}`,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.secondary,
                    borderWidth: 2,
                  },
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.textSecondary }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={`Todas (${empresas.length})`}
              onClick={() => setSearchTerm("")}
              sx={{
                bgcolor: !searchTerm
                  ? alpha(theme.primary, 0.1)
                  : "transparent",
                color: theme.textPrimary,
                fontWeight: 600,
                "&:hover": { bgcolor: alpha(theme.primary, 0.1) },
              }}
            />
            <Chip
              label={`Activas (${empresas.filter((e) => e.activo).length})`}
              sx={{
                bgcolor: alpha(theme.success, 0.1),
                color: theme.success,
                fontWeight: 600,
              }}
            />
          </Box>

          <Tooltip title="Exportar a Excel" arrow>
            <span>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                disabled={filteredEmpresas.length === 0 || loading}
                sx={{
                  borderColor: theme.border,
                  color: theme.textPrimary,
                  fontWeight: 600,
                  borderRadius: 2.5,
                  px: 3,
                  "&:hover": {
                    borderColor: theme.primaryHover,
                    bgcolor: alpha(theme.primaryHover, 0.05),
                    color: theme.primaryHover,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Exportar
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Fade>

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </Box>
      )}

      {/* Empty State */}
      {!loading && filteredEmpresas.length === 0 && (
        <EmptyState onAddNew={handleNew} />
      )}

      {/* Cards Grid */}
      {!loading && filteredEmpresas.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {filteredEmpresas.map((empresa, index) => (
            <Box key={empresa.id}>
              <Grow in timeout={400 + index * 100}>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 4,
                    height: "100%",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "visible",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: `0 20px 40px ${alpha(theme.primary, 0.12)}`,
                      borderColor: theme.secondary,
                    },
                  }}
                >
                  {/* Top bar with status and plan */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      left: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      zIndex: 1,
                    }}
                  >
                    <PlanBadge plan={empresa.subscriptionPlan} />
                    <Chip
                      icon={
                        empresa.activo ? (
                          <CheckCircleIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <CancelIcon sx={{ fontSize: 14 }} />
                        )
                      }
                      label={empresa.activo ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        bgcolor: empresa.activo
                          ? alpha(theme.success, 0.1)
                          : alpha(theme.textSecondary, 0.1),
                        color: empresa.activo
                          ? theme.success
                          : theme.textSecondary,
                        fontWeight: 600,
                        fontSize: 11,
                        height: 22,
                        borderRadius: 1.5,
                        "& .MuiChip-icon": { color: "inherit" },
                      }}
                    />
                  </Box>

                  <CardContent sx={{ p: 3, pt: 5 }}>
                    {/* Header with Avatar */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 2,
                        mt: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: empresa.theme.primaryColor || theme.primary,
                          fontSize: 20,
                          fontWeight: 800,
                          mr: 2,
                          boxShadow: `0 4px 12px ${alpha(
                            empresa.theme.primaryColor || theme.primary,
                            0.35
                          )}`,
                        }}
                      >
                        {getInitials(empresa.nombre)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{
                            color: theme.textPrimary,
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {empresa.nombre}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.primaryHover,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <LinkIcon sx={{ fontSize: 12 }} />/{empresa.subdomain}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Quick Stats Row */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        p: 2,
                        bgcolor: theme.background,
                        borderRadius: 3,
                        mb: 2,
                      }}
                    >
                      <StatMini
                        icon={
                          <PeopleIcon
                            sx={{ fontSize: 18, color: theme.info }}
                          />
                        }
                        value={empresa.stats?.totalUsers || 0}
                        label="Usuarios"
                        color={theme.info}
                      />
                      <StatMini
                        icon={
                          <DirectionsCarIcon
                            sx={{ fontSize: 18, color: theme.warning }}
                          />
                        }
                        value={empresa.stats?.totalVehicles || 0}
                        label="Vehículos"
                        color={theme.warning}
                      />
                      <StatMini
                        icon={
                          <LocalGasStationIcon
                            sx={{ fontSize: 18, color: theme.success }}
                          />
                        }
                        value={empresa.stats?.dailyEvents || 0}
                        label="Cargas hoy"
                        color={theme.success}
                      />
                    </Box>

                    {/* Monthly stats */}
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color={theme.textSecondary}
                        >
                          Eventos validados este mes
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color={theme.primary}
                        >
                          {empresa.stats?.validatedEvents || 0}/
                          {empresa.stats?.monthlyEvents || 0}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          empresa.stats?.monthlyEvents
                            ? ((empresa.stats?.validatedEvents || 0) /
                                empresa.stats.monthlyEvents) *
                              100
                            : 0
                        }
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(theme.success, 0.1),
                          "& .MuiLinearProgress-bar": {
                            bgcolor: theme.success,
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Ver detalles" arrow>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetail(empresa)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2.5,
                            borderColor: theme.border,
                            color: theme.textPrimary,
                            "&:hover": {
                              borderColor: theme.primaryHover,
                              bgcolor: alpha(theme.primaryHover, 0.05),
                            },
                          }}
                        >
                          Detalles
                        </Button>
                      </Tooltip>
                      <Tooltip title="Editar" arrow>
                        <IconButton
                          onClick={() => handleEdit(empresa)}
                          sx={{
                            bgcolor: alpha(theme.primaryHover, 0.1),
                            color: theme.primaryHover,
                            borderRadius: 2.5,
                            "&:hover": {
                              bgcolor: theme.primaryHover,
                              color: theme.surface,
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Box>
          ))}
        </Box>
      )}

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={openDetailDrawer}
        onClose={() => setOpenDetailDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 480 },
            bgcolor: theme.background,
          },
        }}
      >
        {selectedEmpresa && (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {/* Drawer Header */}
            <Box
              sx={{
                p: 3,
                bgcolor: selectedEmpresa.theme.primaryColor || theme.primary,
                color: theme.surface,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: alpha(theme.surface, 0.2),
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    {getInitials(selectedEmpresa.nombre)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {selectedEmpresa.nombre}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      /{selectedEmpresa.subdomain}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={() => setOpenDetailDrawer(false)}
                  sx={{ color: theme.surface }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <PlanBadge plan={selectedEmpresa.subscriptionPlan} />
                <Chip
                  icon={
                    selectedEmpresa.activo ? (
                      <CheckCircleIcon />
                    ) : (
                      <CancelIcon />
                    )
                  }
                  label={selectedEmpresa.activo ? "Activo" : "Inactivo"}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.surface, 0.2),
                    color: theme.surface,
                    fontWeight: 600,
                    "& .MuiChip-icon": { color: "inherit" },
                  }}
                />
              </Box>
            </Box>

            {/* Drawer Content */}
            <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
              {/* Stats Grid */}
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color={theme.textPrimary}
                sx={{ mb: 2 }}
              >
                Estadísticas del Mes
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Card
                  elevation={0}
                  sx={{ p: 2, bgcolor: theme.surface, borderRadius: 3 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <LocalGasStationIcon
                      sx={{ color: theme.success, fontSize: 20 }}
                    />
                    <Typography variant="caption" color={theme.textSecondary}>
                      Litros
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color={theme.textPrimary}
                  >
                    {formatNumber(selectedEmpresa.stats?.totalLitros || 0)}
                  </Typography>
                </Card>
                <Card
                  elevation={0}
                  sx={{ p: 2, bgcolor: theme.surface, borderRadius: 3 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <AttachMoneyIcon
                      sx={{ color: theme.warning, fontSize: 20 }}
                    />
                    <Typography variant="caption" color={theme.textSecondary}>
                      Costo
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color={theme.textPrimary}
                  >
                    {formatCurrency(selectedEmpresa.stats?.totalCostos || 0)}
                  </Typography>
                </Card>
                <Card
                  elevation={0}
                  sx={{ p: 2, bgcolor: theme.surface, borderRadius: 3 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <VerifiedIcon sx={{ color: theme.info, fontSize: 20 }} />
                    <Typography variant="caption" color={theme.textSecondary}>
                      Validados
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color={theme.textPrimary}
                  >
                    {selectedEmpresa.stats?.validatedEvents || 0}
                  </Typography>
                </Card>
                <Card
                  elevation={0}
                  sx={{ p: 2, bgcolor: theme.surface, borderRadius: 3 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <TrendingUpIcon sx={{ color: theme.error, fontSize: 20 }} />
                    <Typography variant="caption" color={theme.textSecondary}>
                      Pendientes
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color={theme.error}>
                    {selectedEmpresa.stats?.pendingEvents || 0}
                  </Typography>
                </Card>
              </Box>

              {/* Contact Info */}
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color={theme.textPrimary}
                sx={{ mb: 2 }}
              >
                Información de Contacto
              </Typography>
              <Card
                elevation={0}
                sx={{ p: 2, bgcolor: theme.surface, borderRadius: 3, mb: 3 }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <EmailIcon sx={{ color: theme.textSecondary }} />
                  <Box>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Email Admin
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedEmpresa.adminEmail}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <DomainIcon sx={{ color: theme.textSecondary }} />
                  <Box>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Subdomain
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedEmpresa.subdomain}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CalendarTodayIcon sx={{ color: theme.textSecondary }} />
                  <Box>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Fecha de registro
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedEmpresa.createdAt
                        ? format(
                            new Date(selectedEmpresa.createdAt),
                            "dd/MM/yyyy",
                            {
                              locale: es,
                            }
                          )
                        : "-"}
                    </Typography>
                  </Box>
                </Box>
              </Card>

              {/* Policies */}
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color={theme.textPrimary}
                sx={{ mb: 2 }}
              >
                Políticas de Evidencias
              </Typography>
              <Card
                elevation={0}
                sx={{ p: 2, bgcolor: theme.surface, borderRadius: 3, mb: 3 }}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectedEmpresa.policies?.requireFuelPumpPhoto && (
                    <Chip
                      icon={<PhotoCameraIcon />}
                      label="Foto Surtidor"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.success, 0.1),
                        color: theme.success,
                      }}
                    />
                  )}
                  {selectedEmpresa.policies?.requireOdometerPhoto && (
                    <Chip
                      icon={<SpeedIcon />}
                      label="Foto Odómetro"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.success, 0.1),
                        color: theme.success,
                      }}
                    />
                  )}
                  {selectedEmpresa.policies?.requiredLocation && (
                    <Chip
                      icon={<LocationOnIcon />}
                      label="Ubicación GPS"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.success, 0.1),
                        color: theme.success,
                      }}
                    />
                  )}
                  {selectedEmpresa.policies?.requiredAudio && (
                    <Chip
                      icon={<MicIcon />}
                      label="Audio"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.success, 0.1),
                        color: theme.success,
                      }}
                    />
                  )}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" color={theme.textSecondary}>
                    Litros máximo por carga
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedEmpresa.policies?.maxLitrosThreshold} L
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color={theme.textSecondary}>
                    Precio combustible
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${selectedEmpresa.policies?.fuelPrice}/L
                  </Typography>
                </Box>
              </Card>
            </Box>

            {/* Drawer Actions */}
            <Box
              sx={{
                p: 3,
                bgcolor: theme.surface,
                borderTop: `1px solid ${theme.border}`,
              }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={
                    copiedId === selectedEmpresa.id ? (
                      <CheckCircleIcon />
                    ) : (
                      <ContentCopyIcon />
                    )
                  }
                  onClick={() => copyLoginUrl(selectedEmpresa)}
                  sx={{
                    borderColor:
                      copiedId === selectedEmpresa.id
                        ? theme.success
                        : theme.border,
                    color:
                      copiedId === selectedEmpresa.id
                        ? theme.success
                        : theme.textPrimary,
                    borderRadius: 2.5,
                  }}
                >
                  {copiedId === selectedEmpresa.id ? "¡Copiado!" : "Copiar URL"}
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setOpenDetailDrawer(false);
                    handleEdit(selectedEmpresa);
                  }}
                  sx={{
                    borderColor: theme.primaryHover,
                    color: theme.primaryHover,
                    borderRadius: 2.5,
                  }}
                >
                  Editar
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    setOpenDetailDrawer(false);
                    handleDeleteClick(selectedEmpresa);
                  }}
                  sx={{
                    borderColor: theme.error,
                    color: theme.error,
                    borderRadius: 2.5,
                  }}
                >
                  Eliminar
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !isSaving && setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: `0 25px 50px ${alpha(theme.primary, 0.25)}`,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.primary,
            color: theme.surface,
            py: 2.5,
            px: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: alpha(theme.secondary, 0.2),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {editingEmpresa ? (
                <EditIcon sx={{ color: theme.secondary }} />
              ) : (
                <AddIcon sx={{ color: theme.secondary }} />
              )}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {editingEmpresa ? "Editar Empresa" : "Nueva Empresa"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {editingEmpresa
                  ? "Modifica los datos y políticas de la empresa"
                  : "Configura un nuevo tenant para el sistema"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: theme.background,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              px: 3,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                minHeight: 48,
              },
              "& .Mui-selected": {
                color: theme.primary,
              },
              "& .MuiTabs-indicator": {
                bgcolor: theme.secondary,
                height: 3,
              },
            }}
          >
            <Tab
              label="Datos Generales"
              icon={<BusinessIcon />}
              iconPosition="start"
            />
            <Tab
              label="Apariencia"
              icon={<PaletteIcon />}
              iconPosition="start"
            />
            <Tab
              label="Políticas"
              icon={<SettingsIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* Tab 0: General Data */}
          <TabPanel value={activeTab} index={0}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 3,
              }}
            >
              <Box>
                <TextField
                  label="Subdomain (identificador único)"
                  value={formData.subdomain}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subdomain: e.target.value.toLowerCase(),
                    })
                  }
                  error={!!errors.subdomain}
                  helperText={errors.subdomain || "Ejemplo: transportes-sur"}
                  required
                  disabled={!!editingEmpresa}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon sx={{ color: theme.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Box>
              <Box>
                <TextField
                  label="Nombre de la Empresa"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  error={!!errors.nombre}
                  helperText={errors.nombre}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: theme.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Box>
              <Box>
                <TextField
                  label="Razón Social"
                  value={formData.razonSocial}
                  onChange={(e) =>
                    setFormData({ ...formData, razonSocial: e.target.value })
                  }
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DomainIcon sx={{ color: theme.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Box>
              <Box>
                <TextField
                  label="Email del Administrador"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, adminEmail: e.target.value })
                  }
                  error={!!errors.adminEmail}
                  helperText={errors.adminEmail}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: theme.textSecondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Box>
              <Box>
                <TextField
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  fullWidth
                  placeholder="+54 11 1234-5678"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Box>
              <Box>
                <TextField
                  select
                  label="Plan"
                  value={formData.subscriptionPlan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscriptionPlan: e.target.value as
                        | "basic"
                        | "professional"
                        | "enterprise",
                    })
                  }
                  fullWidth
                  SelectProps={{ native: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                >
                  <option value="basic">Básico</option>
                  <option value="professional">Profesional</option>
                  <option value="enterprise">Enterprise</option>
                </TextField>
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.activo}
                      onChange={(e) =>
                        setFormData({ ...formData, activo: e.target.checked })
                      }
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: theme.success,
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          { bgcolor: theme.success },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Empresa Activa
                      </Typography>
                      <Typography variant="caption" color={theme.textSecondary}>
                        Los usuarios podrán acceder al sistema
                      </Typography>
                    </Box>
                  }
                  sx={{
                    p: 2,
                    m: 0,
                    bgcolor: theme.background,
                    borderRadius: 3,
                    width: "100%",
                  }}
                />
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 1: Appearance */}
          <TabPanel value={activeTab} index={1}>
            <Typography
              variant="body2"
              color={theme.textSecondary}
              sx={{ mb: 3 }}
            >
              Personaliza los colores del tema para esta empresa.
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 3,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  bgcolor: theme.background,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Color Primario
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        primaryColor: e.target.value,
                      })
                    }
                    sx={{
                      width: 64,
                      height: 64,
                      border: "none",
                      borderRadius: 2,
                      cursor: "pointer",
                      "&::-webkit-color-swatch-wrapper": { p: 0 },
                      "&::-webkit-color-swatch": {
                        borderRadius: 2,
                        border: `2px solid ${theme.border}`,
                      },
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {formData.primaryColor}
                    </Typography>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Headers, botones principales
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  p: 3,
                  bgcolor: theme.background,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Color Secundario
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    component="input"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        secondaryColor: e.target.value,
                      })
                    }
                    sx={{
                      width: 64,
                      height: 64,
                      border: "none",
                      borderRadius: 2,
                      cursor: "pointer",
                      "&::-webkit-color-swatch-wrapper": { p: 0 },
                      "&::-webkit-color-swatch": {
                        borderRadius: 2,
                        border: `2px solid ${theme.border}`,
                      },
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {formData.secondaryColor}
                    </Typography>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Acentos, iconos destacados
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${
                    formData.primaryColor
                  } 0%, ${alpha(formData.primaryColor, 0.8)} 100%)`,
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ color: "#fff", mb: 1 }}
                >
                  Vista previa del tema
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: alpha("#fff", 0.8), mb: 2 }}
                >
                  Así se verá el header del dashboard
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: formData.secondaryColor,
                    color: formData.primaryColor,
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: alpha(formData.secondaryColor, 0.9),
                    },
                  }}
                >
                  Botón de ejemplo
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 2: Policies */}
          <TabPanel value={activeTab} index={2}>
            <Typography
              variant="body2"
              color={theme.textSecondary}
              sx={{ mb: 3 }}
            >
              Configura las políticas de captura de datos para los eventos de
              carga de combustible.
            </Typography>

            <Typography
              variant="subtitle2"
              fontWeight={700}
              color={theme.primary}
              sx={{ mb: 2 }}
            >
              Evidencias Obligatorias
            </Typography>
            <Card
              elevation={0}
              sx={{ p: 2, bgcolor: theme.background, borderRadius: 3, mb: 3 }}
            >
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.policies.requiereFotoSurtidor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          policies: {
                            ...formData.policies,
                            requiereFotoSurtidor: e.target.checked,
                          },
                        })
                      }
                      sx={{
                        color: theme.primary,
                        "&.Mui-checked": { color: theme.success },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PhotoCameraIcon
                        sx={{ fontSize: 20, color: theme.textSecondary }}
                      />
                      <Typography variant="body2">Foto del surtidor</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.policies.requiereFotoOdometro}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          policies: {
                            ...formData.policies,
                            requiereFotoOdometro: e.target.checked,
                          },
                        })
                      }
                      sx={{
                        color: theme.primary,
                        "&.Mui-checked": { color: theme.success },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SpeedIcon
                        sx={{ fontSize: 20, color: theme.textSecondary }}
                      />
                      <Typography variant="body2">
                        Foto del odómetro/horómetro
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.policies.requiereUbicacion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          policies: {
                            ...formData.policies,
                            requiereUbicacion: e.target.checked,
                          },
                        })
                      }
                      sx={{
                        color: theme.primary,
                        "&.Mui-checked": { color: theme.success },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOnIcon
                        sx={{ fontSize: 20, color: theme.textSecondary }}
                      />
                      <Typography variant="body2">Geolocalización</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.policies.requiereAudio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          policies: {
                            ...formData.policies,
                            requiereAudio: e.target.checked,
                          },
                        })
                      }
                      sx={{
                        color: theme.primary,
                        "&.Mui-checked": { color: theme.success },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MicIcon
                        sx={{ fontSize: 20, color: theme.textSecondary }}
                      />
                      <Typography variant="body2">Nota de voz</Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </Card>

            <Typography
              variant="subtitle2"
              fontWeight={700}
              color={theme.primary}
              sx={{ mb: 2 }}
            >
              Umbrales y Precios
            </Typography>
            <Card
              elevation={0}
              sx={{ p: 3, bgcolor: theme.background, borderRadius: 3, mb: 3 }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Litros máximo por carga:{" "}
                  {formData.policies.litrosMaximoPorCarga} L
                </Typography>
                <Slider
                  value={formData.policies.litrosMaximoPorCarga}
                  onChange={(_, value) =>
                    setFormData({
                      ...formData,
                      policies: {
                        ...formData.policies,
                        litrosMaximoPorCarga: value as number,
                      },
                    })
                  }
                  min={50}
                  max={1000}
                  step={50}
                  marks={[
                    { value: 50, label: "50L" },
                    { value: 500, label: "500L" },
                    { value: 1000, label: "1000L" },
                  ]}
                  sx={{
                    color: theme.primary,
                    "& .MuiSlider-thumb": { bgcolor: theme.secondary },
                  }}
                />
              </Box>
              <TextField
                label="Precio por litro (ARS)"
                type="number"
                value={formData.policies.precioCombustible}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    policies: {
                      ...formData.policies,
                      precioCombustible: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />
            </Card>

            <Typography
              variant="subtitle2"
              fontWeight={700}
              color={theme.primary}
              sx={{ mb: 2 }}
            >
              Validación
            </Typography>
            <Card
              elevation={0}
              sx={{ p: 2, bgcolor: theme.background, borderRadius: 3 }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.policies.alertaDuplicados}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        policies: {
                          ...formData.policies,
                          alertaDuplicados: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Alerta de duplicados
                    </Typography>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Detectar cargas duplicadas en poco tiempo
                    </Typography>
                  </Box>
                }
                sx={{ width: "100%", m: 0 }}
              />
              <Divider sx={{ my: 1.5 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.policies.validacionAutomatica}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        policies: {
                          ...formData.policies,
                          validacionAutomatica: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Validación automática
                    </Typography>
                    <Typography variant="caption" color={theme.textSecondary}>
                      Aprobar eventos automáticamente si cumplen todas las
                      políticas
                    </Typography>
                  </Box>
                }
                sx={{ width: "100%", m: 0 }}
              />
            </Card>
          </TabPanel>
        </DialogContent>

        <DialogActions
          sx={{ p: 3, pt: 0, gap: 1.5, bgcolor: theme.background }}
        >
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={isSaving}
            sx={{
              color: theme.textSecondary,
              fontWeight: 600,
              px: 3,
              borderRadius: 2.5,
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              bgcolor: theme.primary,
              color: theme.surface,
              fontWeight: 700,
              px: 4,
              borderRadius: 2.5,
              boxShadow: `0 4px 14px ${alpha(theme.primary, 0.35)}`,
              "&:hover": {
                bgcolor: theme.primaryHover,
              },
            }}
          >
            {isSaving ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Guardando...</span>
              </Box>
            ) : editingEmpresa ? (
              "Guardar Cambios"
            ) : (
              "Crear Empresa"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => !isDeleting && setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxWidth: 420,
            boxShadow: `0 25px 50px ${alpha(theme.error, 0.2)}`,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 4, pb: 2 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: alpha(theme.error, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 36, color: theme.error }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color={theme.textPrimary}>
            Confirmar Eliminación
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center", px: 4 }}>
          <Typography sx={{ color: theme.textSecondary, mb: 2 }}>
            ¿Estás seguro de eliminar la empresa{" "}
            <Box component="span" fontWeight={700} color={theme.textPrimary}>
              {deleteEmpresa?.nombre}
            </Box>
            ?
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(theme.error, 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.error, 0.2)}`,
            }}
          >
            <Typography variant="body2" color={theme.error} fontWeight={500}>
              ⚠️ Esta acción eliminará todos los usuarios, vehículos, eventos y
              datos asociados a este tenant.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1.5, justifyContent: "center" }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={isDeleting}
            sx={{
              color: theme.textSecondary,
              fontWeight: 600,
              px: 4,
              borderRadius: 2.5,
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            disabled={isDeleting}
            sx={{
              bgcolor: theme.error,
              color: theme.surface,
              fontWeight: 700,
              px: 4,
              borderRadius: 2.5,
              "&:hover": { bgcolor: "#DC2626" },
            }}
          >
            {isDeleting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Eliminando...</span>
              </Box>
            ) : (
              "Eliminar Empresa"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
