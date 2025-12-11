// src/pages/Auth/LoginPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
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
  Divider,
  Link,
  Stack,
} from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GoogleIcon from "@mui/icons-material/Google";

// SVG Icons para OAuth providers
const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" fill="currentColor">
    <path d="M0 0h11v11H0V0zm12 0h11v11H12V0zM0 12h11v11H0V12zm12 0h11v11H12V12z" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } =
    useAuthStore();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const primaryColor = "#1E2C56";
  const secondaryColor = "#3b82f6";

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!userName || !password) {
      setLocalError("Por favor ingresa usuario y contraseña");
      return;
    }

    try {
      await login(userName, password);
      navigate("/dashboard");
    } catch {
      // Error ya manejado en el store
    }
  };

  // OAuth handlers - Por implementar cuando tengan los client IDs
  const handleGoogleLogin = () => {
    toast.info("Login con Google próximamente disponible");
    // TODO: Implementar OAuth con Google
    // window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?...`;
  };

  const handleFacebookLogin = () => {
    toast.info("Login con Facebook próximamente disponible");
    // TODO: Implementar OAuth con Facebook
  };

  const handleMicrosoftLogin = () => {
    toast.info("Login con Microsoft próximamente disponible");
    // TODO: Implementar OAuth con Microsoft
  };

  const displayError = localError || error;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        backgroundImage: "url('/images/LoginFondo.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "auto",
        // Overlay oscuro para mejorar legibilidad del contenido
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 0,
        },
      }}
    >
      {/* Back Button */}
      <Box sx={{ p: 2, position: "relative", zIndex: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{
            color: "rgba(255,255,255,0.9)",
            textTransform: "none",
            "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
          }}
        >
          Volver al inicio
        </Button>
      </Box>

      <Container
        maxWidth="xs"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Card
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
            width: "100%",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: primaryColor,
              py: 3,
              px: 3,
              textAlign: "center",
              color: "#fff",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: `linear-gradient(145deg, ${secondaryColor}, ${secondaryColor}CC)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 20px ${secondaryColor}55, 0 4px 12px rgba(0,0,0,0.25)`,
                border: "3px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <LocalGasStationIcon sx={{ fontSize: 34, color: "#fff" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Sistema de Gestión de Combustibles
            </Typography>
          </Box>

          {/* Form */}
          <CardContent sx={{ p: 3.5 }}>
            {/* OAuth Buttons */}
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                sx={{
                  py: 1.2,
                  borderColor: "#e2e8f0",
                  color: "#1f2937",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.9rem",
                  borderRadius: 2,
                  bgcolor: "#fff",
                  "&:hover": {
                    borderColor: "#db4437",
                    bgcolor: "#fef2f2",
                  },
                }}
              >
                Continuar con Google
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<FacebookIcon />}
                onClick={handleFacebookLogin}
                sx={{
                  py: 1.2,
                  borderColor: "#e2e8f0",
                  color: "#1877f2",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.9rem",
                  borderRadius: 2,
                  bgcolor: "#fff",
                  "&:hover": {
                    borderColor: "#1877f2",
                    bgcolor: "#eff6ff",
                  },
                }}
              >
                Continuar con Facebook
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<MicrosoftIcon />}
                onClick={handleMicrosoftLogin}
                sx={{
                  py: 1.2,
                  borderColor: "#e2e8f0",
                  color: "#00a4ef",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.9rem",
                  borderRadius: 2,
                  bgcolor: "#fff",
                  "&:hover": {
                    borderColor: "#00a4ef",
                    bgcolor: "#f0f9ff",
                  },
                }}
              >
                Continuar con Microsoft
              </Button>
            </Stack>

            <Divider sx={{ my: 2.5, color: "#94a3b8", fontSize: "0.8rem" }}>
              o ingresa con tu usuario
            </Divider>

            <form onSubmit={handleSubmit}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  fontWeight: 600,
                  color: "#333",
                  fontSize: "0.85rem",
                }}
              >
                Usuario
              </Typography>
              <TextField
                fullWidth
                placeholder="nombre.usuario"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                size="small"
                required
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <PersonOutlineIcon
                      sx={{ mr: 1, color: secondaryColor, fontSize: 20 }}
                    />
                  ),
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#f8fafc",
                    borderRadius: 2,
                    "& input": { py: 1.4, fontSize: "0.95rem" },
                    "& fieldset": { borderColor: "#e2e8f0" },
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
                  fontSize: "0.85rem",
                }}
              >
                Contraseña
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
                    bgcolor: "#f8fafc",
                    borderRadius: 2,
                    "& input": { py: 1.4, fontSize: "0.95rem" },
                    "& fieldset": { borderColor: "#e2e8f0" },
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
                    fontSize: "0.85rem",
                    borderRadius: 2,
                  }}
                >
                  {displayError}
                </Alert>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Link
                  href="#"
                  sx={{
                    color: secondaryColor,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  bgcolor: primaryColor,
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: "1rem",
                  borderRadius: 2,
                  boxShadow: `0 4px 14px ${primaryColor}4D`,
                  "&:hover": {
                    bgcolor: secondaryColor,
                    boxShadow: `0 6px 20px ${secondaryColor}66`,
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
                    <span>Ingresando...</span>
                  </Box>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                ¿No tienes cuenta?{" "}
                <Link
                  component={RouterLink}
                  to="/registro"
                  sx={{
                    color: secondaryColor,
                    fontWeight: 600,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Registra tu empresa
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Demo credentials - Solo en desarrollo */}
        {import.meta.env.DEV && (
          <Box
            sx={{
              mt: 3,
              p: 2.5,
              bgcolor: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.15)",
              width: "100%",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: "white", mb: 1, textAlign: "center" }}
            >
              🔑 Credenciales de prueba (solo desarrollo)
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.8)",
                display: "block",
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: "0.8rem",
              }}
            >
              admin / cualquier contraseña
            </Typography>
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 3,
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          © 2025 GoodApps - Gestión de Combustibles
        </Typography>
      </Container>
    </Box>
  );
}
