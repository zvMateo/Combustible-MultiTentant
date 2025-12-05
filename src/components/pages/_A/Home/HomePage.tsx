// src/components/pages/_A/Home/HomePage.tsx
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEmpresas,
  useEmpresasResumen,
  empresasKeys,
} from "@/hooks/queries/useEmpresas";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  alpha,
  Button,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/Pending";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import type { EmpresaResumen } from "@/types";

// Theme colors
const theme = {
  primary: "#284057",
  primaryHover: "#2391CB",
  secondary: "#66FF99",
  background: "#F8FAFB",
  surface: "#FFFFFF",
  textPrimary: "#1A1A2E",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

// Mock data for activities (hasta que exista un servicio de actividad)
interface ActividadReciente {
  id: number;
  tipo: "evento" | "empresa" | "alerta";
  mensaje: string;
  tiempo: string;
  empresa?: string;
  empresaColor?: string;
}

const mockActividad: ActividadReciente[] = [
  {
    id: 1,
    tipo: "evento",
    mensaje: "Nueva carga validada - Vehículo ABC-123",
    tiempo: "Hace 5 min",
    empresa: "Transportes del Norte",
    empresaColor: "#3B82F6",
  },
  {
    id: 2,
    tipo: "alerta",
    mensaje: "Umbral de litros excedido en carga",
    tiempo: "Hace 15 min",
    empresa: "Logística Express",
    empresaColor: "#10B981",
  },
  {
    id: 3,
    tipo: "empresa",
    mensaje: "Nueva empresa registrada: Flota Sur",
    tiempo: "Hace 1 hora",
  },
  {
    id: 4,
    tipo: "evento",
    mensaje: "Evento pendiente de validación",
    tiempo: "Hace 2 horas",
    empresa: "Flota Comercial SA",
    empresaColor: "#8B5CF6",
  },
  {
    id: 5,
    tipo: "alerta",
    mensaje: "3 eventos sin fotos requeridas",
    tiempo: "Hace 3 horas",
    empresa: "Distribuidora Central",
    empresaColor: "#F59E0B",
  },
];

// Utility functions
const formatNumber = (num: number) => num.toLocaleString("es-MX");
const formatCurrency = (num: number) =>
  `$${num.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  loading: boolean;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.border}`,
        borderRadius: 3,
        height: "100%",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: color,
          boxShadow: `0 8px 25px ${alpha(color, 0.15)}`,
          transform: "translateY(-4px)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: alpha(color, 0.1),
              color: color,
            }}
          >
            {icon}
          </Avatar>
          {trend !== undefined && (
            <Chip
              size="small"
              icon={
                trend >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16 }} />
                )
              }
              label={`${trend >= 0 ? "+" : ""}${trend}%`}
              sx={{
                bgcolor:
                  trend >= 0
                    ? alpha(theme.success, 0.1)
                    : alpha(theme.error, 0.1),
                color: trend >= 0 ? theme.success : theme.error,
                fontWeight: 600,
                fontSize: 12,
              }}
            />
          )}
        </Box>
        <Typography
          variant="h3"
          fontWeight={800}
          color={theme.textPrimary}
          sx={{ mb: 0.5 }}
        >
          {loading ? <Skeleton width={80} /> : value}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          color={theme.textSecondary}
        >
          {title}
        </Typography>
        <Typography variant="caption" color={theme.textSecondary}>
          {loading ? <Skeleton width={100} /> : subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

// Mini Company Card
function EmpresaMiniCard({
  empresa,
  onClick,
}: {
  empresa: EmpresaResumen;
  onClick: () => void;
}) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: `1px solid ${theme.border}`,
        borderRadius: 3,
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: empresa.primaryColor,
          boxShadow: `0 4px 15px ${alpha(empresa.primaryColor, 0.2)}`,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: empresa.primaryColor,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {empresa.nombre.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {empresa.nombre}
            </Typography>
            <Chip
              size="small"
              label={empresa.activa ? "Activa" : "Inactiva"}
              sx={{
                height: 20,
                fontSize: 10,
                bgcolor: empresa.activa
                  ? alpha(theme.success, 0.1)
                  : alpha(theme.error, 0.1),
                color: empresa.activa ? theme.success : theme.error,
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color={theme.textPrimary}>
              {empresa.eventosHoy}
            </Typography>
            <Typography variant="caption" color={theme.textSecondary}>
              Cargas hoy
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color={theme.textPrimary}>
              {formatNumber(empresa.litrosHoy)}L
            </Typography>
            <Typography variant="caption" color={theme.textSecondary}>
              Litros
            </Typography>
          </Box>
          <Box sx={{ ml: "auto", textAlign: "right" }}>
            <Typography
              variant="body2"
              fontWeight={600}
              color={theme.primaryHover}
            >
              {empresa.usuarios} usuarios
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Query hooks
  const { data: empresasData, isLoading: isLoadingEmpresas } = useEmpresas();
  const { data: resumenData, isLoading: isLoadingResumen } =
    useEmpresasResumen();

  const loading = isLoadingEmpresas || isLoadingResumen;

  // Computed stats from empresas
  const empresas = empresasData?.data || [];
  const resumen = resumenData?.data || [];

  const stats = {
    empresasActivas: empresas.filter((e) => e.activo).length,
    empresasInactivas: empresas.filter((e) => !e.activo).length,
    totalUsuarios: resumen.reduce((acc, e) => acc + (e.usuarios || 0), 0),
    totalVehiculos: resumen.reduce((acc, e) => acc + (e.vehiculos || 0), 0),
    eventosHoy: resumen.reduce((acc, e) => acc + (e.eventosHoy || 0), 0),
    litrosHoy: resumen.reduce((acc, e) => acc + (e.litrosHoy || 0), 0),
    tendenciaEventos: 12.5, // Mock - puede venir del backend
    eventosMes: 2456, // Mock
    eventosValidados: 2180, // Mock
    eventosPendientes: 276, // Mock
    costoMes: 125680.5, // Mock
    litrosMes: 98450, // Mock
  };

  // Top empresas ordenadas por eventos
  const topEmpresas = [...resumen]
    .sort((a, b) => b.eventosHoy - a.eventosHoy)
    .slice(0, 4);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: empresasKeys.all });
  };

  const handleEmpresaClick = () => {
    navigate("/a/empresas");
  };

  return (
    <Box sx={{ p: 3, bgcolor: theme.background, minHeight: "100%" }}>
      {/* Header */}
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
            right: 150,
            width: 100,
            height: 100,
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
            gap: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ color: theme.surface, mb: 1 }}
            >
              ¡Bienvenido al Panel de Control!
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: alpha(theme.surface, 0.8) }}
            >
              Sistema de Gestión de Combustible • Vista global de todos los
              tenants
            </Typography>
          </Box>
          <Tooltip title="Actualizar datos" arrow>
            <IconButton
              onClick={handleRefresh}
              sx={{
                bgcolor: alpha(theme.surface, 0.1),
                color: theme.surface,
                "&:hover": { bgcolor: alpha(theme.surface, 0.2) },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPIs Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        <KPICard
          title="Empresas Activas"
          value={stats.empresasActivas}
          subtitle={`${stats.empresasInactivas} inactivas`}
          icon={<BusinessIcon />}
          color={theme.primary}
          loading={loading}
        />
        <KPICard
          title="Usuarios Totales"
          value={formatNumber(stats.totalUsuarios)}
          subtitle="En todo el sistema"
          icon={<PeopleIcon />}
          color={theme.info}
          loading={loading}
        />
        <KPICard
          title="Vehículos Registrados"
          value={formatNumber(stats.totalVehiculos)}
          subtitle="Activos en el sistema"
          icon={<DirectionsCarIcon />}
          color={theme.warning}
          loading={loading}
        />
        <KPICard
          title="Eventos Hoy"
          value={formatNumber(stats.eventosHoy)}
          subtitle={`${formatNumber(stats.litrosHoy)} litros`}
          icon={<LocalGasStationIcon />}
          color={theme.success}
          trend={stats.tendenciaEventos}
          loading={loading}
        />
      </Box>

      {/* Secondary KPIs */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.border}`,
            borderRadius: 3,
            bgcolor: alpha(theme.success, 0.03),
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <VerifiedIcon sx={{ color: theme.success, fontSize: 28 }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Eventos del Mes
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} color={theme.textPrimary}>
              {loading ? (
                <Skeleton width={100} />
              ) : (
                formatNumber(stats.eventosMes)
              )}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="caption" color={theme.textSecondary}>
                  Validados
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={theme.success}
                >
                  {stats.eventosValidados}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={
                  stats.eventosMes
                    ? (stats.eventosValidados / stats.eventosMes) * 100
                    : 0
                }
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.success, 0.1),
                  "& .MuiLinearProgress-bar": {
                    bgcolor: theme.success,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.border}`,
            borderRadius: 3,
            bgcolor: alpha(theme.warning, 0.03),
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <PendingIcon sx={{ color: theme.warning, fontSize: 28 }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Pendientes de Validar
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} color={theme.warning}>
              {loading ? <Skeleton width={80} /> : stats.eventosPendientes}
            </Typography>
            <Typography
              variant="body2"
              color={theme.textSecondary}
              sx={{ mt: 1 }}
            >
              Eventos esperando aprobación
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.border}`,
            borderRadius: 3,
            bgcolor: alpha(theme.info, 0.03),
            gridColumn: { xs: "1", sm: "1 / -1", md: "auto" },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <AttachMoneyIcon sx={{ color: theme.info, fontSize: 28 }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Costo Total del Mes
              </Typography>
            </Box>
            <Typography variant="h3" fontWeight={800} color={theme.textPrimary}>
              {loading ? (
                <Skeleton width={120} />
              ) : (
                formatCurrency(stats.costoMes)
              )}
            </Typography>
            <Typography
              variant="body2"
              color={theme.textSecondary}
              sx={{ mt: 1 }}
            >
              {formatNumber(stats.litrosMes)} litros consumidos
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Bottom Section */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
          gap: 3,
        }}
      >
        {/* Empresas Activas */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.border}`,
            borderRadius: 3,
            height: "100%",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={theme.textPrimary}
                >
                  Empresas con Mayor Actividad
                </Typography>
                <Typography variant="body2" color={theme.textSecondary}>
                  Top empresas por eventos de hoy
                </Typography>
              </Box>
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/a/empresas")}
                sx={{
                  color: theme.primaryHover,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Ver todas
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              {loading
                ? [1, 2, 3, 4].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      height={130}
                      sx={{ borderRadius: 3 }}
                    />
                  ))
                : topEmpresas.map((empresa) => (
                    <EmpresaMiniCard
                      key={empresa.id}
                      empresa={empresa}
                      onClick={handleEmpresaClick}
                    />
                  ))}
            </Box>
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.border}`,
            borderRadius: 3,
            height: "100%",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color={theme.textPrimary}
              sx={{ mb: 3 }}
            >
              Actividad Reciente
            </Typography>

            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {mockActividad.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme.background,
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: alpha(theme.primary, 0.03),
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor:
                          item.tipo === "alerta"
                            ? alpha(theme.warning, 0.1)
                            : item.tipo === "empresa"
                            ? alpha(theme.success, 0.1)
                            : alpha(theme.info, 0.1),
                        color:
                          item.tipo === "alerta"
                            ? theme.warning
                            : item.tipo === "empresa"
                            ? theme.success
                            : theme.info,
                      }}
                    >
                      {item.tipo === "alerta" ? (
                        <WarningIcon sx={{ fontSize: 20 }} />
                      ) : item.tipo === "empresa" ? (
                        <BusinessIcon sx={{ fontSize: 20 }} />
                      ) : (
                        <CheckCircleIcon sx={{ fontSize: 20 }} />
                      )}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.mensaje}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color={theme.textSecondary}
                        >
                          {item.tiempo}
                        </Typography>
                        {item.empresa && (
                          <>
                            <Typography
                              variant="caption"
                              color={theme.textSecondary}
                            >
                              •
                            </Typography>
                            <Chip
                              size="small"
                              label={item.empresa}
                              sx={{
                                height: 18,
                                fontSize: 10,
                                bgcolor: alpha(
                                  item.empresaColor || theme.primary,
                                  0.1
                                ),
                                color: item.empresaColor || theme.primary,
                              }}
                            />
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
