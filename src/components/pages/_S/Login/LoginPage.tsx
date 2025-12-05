// src/components/pages/_S/Login/LoginPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenantStore } from "@/stores/tenant.store";
import { useTenantDomain } from "@/hooks/use-tenant-domain";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
} from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

export default function LoginPage() {
  const navigate = useNavigate();
  const tenantSlug = useTenantDomain();
  const {
    login,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    tenantConfig,
    fetchTenantConfig,
  } = useTenantStore();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [localError, setLocalError] = useState<string>("");
  const [loadingTenant, setLoadingTenant] = useState(true);

  const primaryColor = tenantConfig?.theme?.primaryColor || "#1E2C56";
  const secondaryColor = tenantConfig?.theme?.secondaryColor || "#4A90E2";

  // Cargar configuración del tenant
  useEffect(() => {
    if (tenantSlug && !tenantConfig) {
      fetchTenantConfig(tenantSlug).finally(() => setLoadingTenant(false));
    } else {
      setLoadingTenant(false);
    }
  }, [tenantSlug, tenantConfig, fetchTenantConfig]);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/s/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email || !password) {
      setLocalError("Por favor ingresa email y contraseña");
      return;
    }

    try {
      await login(email, password);
      navigate("/s/dashboard");
    } catch {
      // Error ya manejado en el store
    }
  };

  const displayError = localError || error;

  if (loadingTenant) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "#F4F8FA",
        }}
      >
        <CircularProgress sx={{ color: primaryColor }} />
      </Box>
    );
  }

  if (!tenantSlug) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          p: 3,
        }}
      >
        <Alert severity="error">No se pudo detectar el subdominio</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        backgroundImage: "url(/images/LoginFondo.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(10, 10, 20, 0.3)",
          zIndex: 0,
        },
      }}
    >
      <Container
        maxWidth="xs"
        disableGutters
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          px: 2,
        }}
      >
        <Card
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "rgba(255, 255, 255, 0.40)",
            backdropFilter: "blur(15px)",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.3)",
            width: "100%",
          }}
        >
          <Box
            sx={{
              bgcolor: primaryColor,
              py: 2.5,
              px: 3,
              textAlign: "center",
              color: "#fff",
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                margin: "0 auto 14px",
                borderRadius: "50%",
                background: `linear-gradient(145deg, ${secondaryColor}, ${secondaryColor}CC)`,
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 18px ${secondaryColor}55, 0 4px 12px rgba(0,0,0,0.25)`,
                transition: "all 0.25s ease",
                border: "2px solid rgba(255, 255, 255, 0.25)",
              }}
            >
              <LocalGasStationIcon sx={{ fontSize: 32, color: "#fff" }} />
            </Box>

            <Typography
              variant="h5"
              fontWeight="700"
              sx={{ mb: 0.5, letterSpacing: 0.3 }}
            >
              {tenantConfig?.name?.toUpperCase() || tenantSlug.toUpperCase()}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, fontSize: "0.75rem" }}
            >
              Sistema de Gestión de Combustible
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  fontWeight: 600,
                  color: "#333",
                  fontSize: "0.8rem",
                }}
              >
                Email *
              </Typography>
              <TextField
                fullWidth
                placeholder={`admin@${tenantSlug}.com`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="small"
                required
                autoFocus
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <EmailOutlinedIcon
                      sx={{ mr: 1, color: secondaryColor, fontSize: 20 }}
                    />
                  ),
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: 1.5,
                    "& input": { py: 1.3, fontSize: "0.9rem" },
                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.1)" },
                    "&:hover fieldset": { borderColor: secondaryColor },
                    "&.Mui-focused fieldset": {
                      borderColor: primaryColor,
                      borderWidth: 2,
                    },
                  },
                }}
              />

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  fontWeight: 600,
                  color: "#333",
                  fontSize: "0.8rem",
                }}
              >
                Contraseña *
              </Typography>
              <TextField
                fullWidth
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="small"
                required
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <LockOutlinedIcon
                      sx={{ mr: 1, color: secondaryColor, fontSize: 20 }}
                    />
                  ),
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: 1.5,
                    "& input": { py: 1.3, fontSize: "0.9rem" },
                    "& fieldset": { borderColor: "rgba(0, 0, 0, 0.1)" },
                    "&:hover fieldset": { borderColor: secondaryColor },
                    "&.Mui-focused fieldset": {
                      borderColor: primaryColor,
                      borderWidth: 2,
                    },
                  },
                }}
              />

              {displayError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    py: 0.5,
                    fontSize: "0.8rem",
                    borderRadius: 1.5,
                  }}
                >
                  {displayError}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.4,
                  bgcolor: primaryColor,
                  fontWeight: "600",
                  textTransform: "none",
                  fontSize: "1rem",
                  borderRadius: 1.5,
                  boxShadow: `0 4px 12px ${primaryColor}4D`,
                  "&:hover": {
                    bgcolor: secondaryColor,
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${primaryColor}66`,
                  },
                  "&:disabled": {
                    bgcolor: "#ccc",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Iniciando...</span>
                  </Box>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 2,
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.9)",
            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
          }}
        >
          © 2025 - GoodApps
        </Typography>
      </Container>
    </Box>
  );
}
