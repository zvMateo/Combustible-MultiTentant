import { Box, Typography, Button, Container, Stack } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SecurityIcon from "@mui/icons-material/Security";
import SpeedIcon from "@mui/icons-material/Speed";

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #1E3A5F 0%, #2C5282 100%)",
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 3,
          px: { xs: 3, sm: 4 },
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <LocalGasStationIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: "white" }} />
            <Typography 
              variant="h5" 
              fontWeight={600} 
              color="white"
              sx={{ fontSize: { xs: "1.1rem", sm: "1.4rem" } }}
            >
              GoodApps - Gestión Combustibles
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          py: { xs: 6, md: 8 },
          px: { xs: 3, sm: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={{ xs: 5, md: 6 }} alignItems="center" textAlign="center">
            {/* Hero */}
            <Box sx={{ maxWidth: "800px" }}>
              <Typography
                variant="h1"
                fontWeight={700}
                color="white"
                sx={{
                  mb: 3,
                  fontSize: { xs: "2rem", sm: "2.75rem", md: "3.5rem" },
                  letterSpacing: "-0.02em",
                }}
              >
                Plataforma MultiTenant
              </Typography>
              <Typography
                variant="h6"
                color="rgba(255,255,255,0.9)"
                fontWeight={400}
                sx={{ 
                  mb: 5, 
                  lineHeight: 1.6,
                  fontSize: { xs: "1.05rem", sm: "1.2rem", md: "1.3rem" },
                }}
              >
                GoodApps te ofrece gestión de combustible para empresas con múltiples sedes. 
                Cada empresa tiene su propio subdominio aislado.
              </Typography>
              <Button
                variant="contained"
                size="large"
                href="mailto:info@goodapps.com.ar"
                sx={{
                  bgcolor: "#3B82F6",
                  color: "white",
                  fontWeight: 600,
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  px: { xs: 4, sm: 6 },
                  py: { xs: 1.5, sm: 2 },
                  borderRadius: 2.5,
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                  "&:hover": {
                    bgcolor: "#2563EB",
                    boxShadow: "0 6px 20px rgba(59, 130, 246, 0.5)",
                  },
                }}
              >
                Contactar GoodApps
              </Button>
            </Box>

            {/* Features */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: { xs: 3, sm: 3.5 },
                width: "100%",
                maxWidth: "1000px",
              }}
            >
              {[
                {
                  icon: <BusinessIcon sx={{ fontSize: { xs: 44, sm: 52 } }} />,
                  title: "Multi-Tenant",
                  desc: "Cada empresa tiene su subdominio independiente",
                },
                {
                  icon: <SecurityIcon sx={{ fontSize: { xs: 44, sm: 52 } }} />,
                  title: "Datos Aislados",
                  desc: "Total separación entre empresas, 100% seguro",
                },
                {
                  icon: <SpeedIcon sx={{ fontSize: { xs: 44, sm: 52 } }} />,
                  title: "Tiempo Real",
                  desc: "Dashboard actualizado al instante",
                },
              ].map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.07)",
                    p: { xs: 3.5, sm: 4 },
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.15)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.12)",
                      borderColor: "rgba(255,255,255,0.25)",
                    },
                  }}
                >
                  <Box sx={{ color: "white", mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="white"
                    sx={{ 
                      mb: 1,
                      fontSize: { xs: "1.15rem", sm: "1.25rem" },
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="rgba(255,255,255,0.8)"
                    sx={{ 
                      fontSize: { xs: "0.9rem", sm: "0.95rem" },
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.desc}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Cómo usar */}
            <Box
              sx={{
                p: { xs: 3, sm: 4 },
                bgcolor: "rgba(255,255,255,0.07)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.15)",
                maxWidth: "650px",
                width: "100%",
              }}
            >
              <Typography 
                variant="h6" 
                color="white" 
                fontWeight={600}
                sx={{ fontSize: { xs: "1.05rem", sm: "1.15rem" }, mb: 1.5 }}
              >
                🚀 ¿Ya sos cliente GoodApps?
              </Typography>
              <Typography 
                variant="body1" 
                color="rgba(255,255,255,0.85)" 
                sx={{ 
                  fontSize: { xs: "0.9rem", sm: "0.95rem" },
                  lineHeight: 1.6,
                }}
              >
                Usá tu subdominio empresarial:{" "}
                <Box 
                  component="span" 
                  sx={{ 
                    fontFamily: "monospace",
                    bgcolor: "rgba(255,255,255,0.12)",
                    px: 1.2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: "0.9em",
                  }}
                >
                  tuempresa.localhost:5173/s/login
                </Box>
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: { xs: 3, sm: 4 },
          borderTop: "1px solid rgba(255,255,255,0.1)",
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
              color="rgba(255,255,255,0.7)"
              sx={{ 
                fontSize: { xs: "0.85rem", sm: "0.9rem" },
              }}
            >
              © 2025 GoodApps SRL - Gestión Combustibles MultiTenant
            </Typography>
            <Stack 
              direction="row" 
              spacing={2.5}
            >
              {["Términos", "Privacidad", "Soporte"].map((item) => (
                <Button
                  key={item}
                  href="#"
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "none",
                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                    minWidth: "auto",
                    p: 1,
                    "&:hover": { 
                      color: "white",
                      bgcolor: "rgba(255,255,255,0.05)",
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
