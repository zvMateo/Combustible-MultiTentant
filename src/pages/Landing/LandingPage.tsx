// src/pages/Landing/LandingPage.tsx
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Box, Typography, Button, Container, Stack, Chip } from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import BusinessIcon from "@mui/icons-material/Business";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DashboardIcon from "@mui/icons-material/Dashboard";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirigir al dashboard si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 2.5,
          px: { xs: 2, sm: 4 },
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          bgcolor: "rgba(15, 23, 42, 0.5)",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                }}
              >
                <LocalGasStationIcon sx={{ fontSize: 26, color: "white" }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="white"
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.15rem" },
                    lineHeight: 1.2,
                  }}
                >
                  GoodApps
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem" }}
                >
                  Gestión de Combustibles
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<LoginIcon />}
                onClick={() => navigate("/login")}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  textTransform: "none",
                  fontWeight: 600,
                  px: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Ingresar
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate("/registro")}
                sx={{
                  bgcolor: "#3b82f6",
                  textTransform: "none",
                  fontWeight: 600,
                  px: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                  "&:hover": {
                    bgcolor: "#2563eb",
                  },
                }}
              >
                Registrarse
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          py: { xs: 6, md: 10 },
          px: { xs: 2, sm: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Stack
            spacing={{ xs: 6, md: 8 }}
            alignItems="center"
            textAlign="center"
          >
            {/* Hero Section */}
            <Box sx={{ maxWidth: "850px" }}>
              <Chip
                label="✨ Plataforma 100% Autogestionable"
                sx={{
                  mb: 3,
                  bgcolor: "rgba(59, 130, 246, 0.2)",
                  color: "#93c5fd",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              />
              <Typography
                variant="h1"
                fontWeight={800}
                color="white"
                sx={{
                  mb: 3,
                  fontSize: { xs: "2.2rem", sm: "3rem", md: "3.75rem" },
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #93c5fd 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Gestión de Combustibles
                <br />
                para tu Empresa
              </Typography>
              <Typography
                variant="h6"
                color="rgba(255,255,255,0.8)"
                fontWeight={400}
                sx={{
                  mb: 5,
                  lineHeight: 1.7,
                  fontSize: { xs: "1rem", sm: "1.15rem", md: "1.25rem" },
                  maxWidth: "700px",
                  mx: "auto",
                }}
              >
                Registra tu empresa en minutos y comienza a controlar cargas de
                combustible, vehículos, choferes y reportes en tiempo real.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PersonAddIcon />}
                  onClick={() => navigate("/registro")}
                  sx={{
                    bgcolor: "#3b82f6",
                    color: "white",
                    fontWeight: 700,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    px: { xs: 4, sm: 5 },
                    py: { xs: 1.5, sm: 1.75 },
                    borderRadius: 2.5,
                    textTransform: "none",
                    boxShadow: "0 4px 20px rgba(59, 130, 246, 0.5)",
                    "&:hover": {
                      bgcolor: "#2563eb",
                      boxShadow: "0 6px 25px rgba(59, 130, 246, 0.6)",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Crear mi Empresa Gratis
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate("/login")}
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    px: { xs: 4, sm: 5 },
                    py: { xs: 1.5, sm: 1.75 },
                    borderRadius: 2.5,
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "white",
                      bgcolor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  Ya tengo cuenta
                </Button>
              </Stack>
            </Box>

            {/* Features */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: { xs: 3, sm: 4 },
                width: "100%",
                maxWidth: "1100px",
              }}
            >
              {[
                {
                  icon: <BusinessIcon sx={{ fontSize: { xs: 40, sm: 48 } }} />,
                  title: "Multi-Empresa",
                  desc: "Gestiona múltiples unidades de negocio desde un solo lugar",
                },
                {
                  icon: <SecurityIcon sx={{ fontSize: { xs: 40, sm: 48 } }} />,
                  title: "Datos Seguros",
                  desc: "Información protegida y respaldada en la nube",
                },
                {
                  icon: <SpeedIcon sx={{ fontSize: { xs: 40, sm: 48 } }} />,
                  title: "Tiempo Real",
                  desc: "Dashboard y reportes actualizados al instante",
                },
              ].map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                    p: { xs: 3.5, sm: 4 },
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      borderColor: "rgba(59, 130, 246, 0.4)",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: "#3b82f6",
                      mb: 2.5,
                      opacity: 0.9,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="white"
                    sx={{
                      mb: 1.5,
                      fontSize: { xs: "1.1rem", sm: "1.2rem" },
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="rgba(255,255,255,0.7)"
                    sx={{
                      fontSize: { xs: "0.9rem", sm: "0.95rem" },
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.desc}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* How it works */}
            <Box
              sx={{
                p: { xs: 4, sm: 5 },
                bgcolor: "rgba(59, 130, 246, 0.1)",
                borderRadius: 4,
                border: "1px solid rgba(59, 130, 246, 0.2)",
                maxWidth: "800px",
                width: "100%",
              }}
            >
              <Typography
                variant="h5"
                color="white"
                fontWeight={700}
                sx={{ fontSize: { xs: "1.2rem", sm: "1.4rem" }, mb: 3 }}
              >
                🚀 Comienza en 3 simples pasos
              </Typography>
              <Stack spacing={2}>
                {[
                  { step: "1", text: "Registra tu empresa con tu email" },
                  {
                    step: "2",
                    text: "Configura tus unidades de negocio, vehículos y choferes",
                  },
                  {
                    step: "3",
                    text: "¡Comienza a registrar cargas de combustible!",
                  },
                ].map((item) => (
                  <Box
                    key={item.step}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "#3b82f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "white",
                        fontSize: "1rem",
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </Box>
                    <Typography
                      color="rgba(255,255,255,0.9)"
                      sx={{ fontSize: { xs: "0.95rem", sm: "1.05rem" } }}
                    >
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: { xs: 2, sm: 4 },
          borderTop: "1px solid rgba(255,255,255,0.08)",
          bgcolor: "rgba(15, 23, 42, 0.5)",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "center", md: "space-between" },
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: 2, md: 0 },
            }}
          >
            <Typography
              variant="body2"
              color="rgba(255,255,255,0.6)"
              sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
            >
              © 2025 GoodApps - Gestión de Combustibles
            </Typography>
            <Stack direction="row" spacing={2}>
              {["Términos", "Privacidad", "Contacto"].map((item) => (
                <Button
                  key={item}
                  sx={{
                    color: "rgba(255,255,255,0.6)",
                    textTransform: "none",
                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                    minWidth: "auto",
                    p: 0.5,
                    "&:hover": {
                      color: "white",
                      bgcolor: "transparent",
                    },
                  }}
                >
                  {item}
                </Button>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
