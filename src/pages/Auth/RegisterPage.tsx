// src/pages/Auth/RegisterPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { companiesApi } from "@/services/api/companies.api";
import { usersApi } from "@/services/api/users.api";
import { getErrorMessage } from "@/lib/axios";
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
  Stepper,
  Step,
  StepLabel,
  Grid,
} from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface FormData {
  // Paso 1 - Datos empresa
  empresaNombre: string;
  empresaRazonSocial: string;
  // Paso 2 - Datos admin
  adminNombre: string;
  adminApellido: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
}

interface FormErrors {
  [key: string]: string;
}

const steps = ["Datos de la Empresa", "Datos del Administrador"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    empresaNombre: "",
    empresaRazonSocial: "",
    adminNombre: "",
    adminApellido: "",
    adminEmail: "",
    adminPassword: "",
    adminPasswordConfirm: "",
  });

  const primaryColor = "#1E2C56";
  const secondaryColor = "#3b82f6";

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      // Limpiar error del campo
      if (errors[field]) {
        setErrors({ ...errors, [field]: "" });
      }
    };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.empresaNombre.trim()) {
      newErrors.empresaNombre = "El nombre es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.adminNombre.trim()) {
      newErrors.adminNombre = "El nombre es obligatorio";
    }
    if (!formData.adminApellido.trim()) {
      newErrors.adminApellido = "El apellido es obligatorio";
    }
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = "Email inválido";
    }
    if (!formData.adminPassword) {
      newErrors.adminPassword = "La contraseña es obligatoria";
    } else if (formData.adminPassword.length < 8) {
      newErrors.adminPassword = "Mínimo 8 caracteres";
    }
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      newErrors.adminPasswordConfirm = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && validateStep1()) {
      setActiveStep(1);
    } else if (activeStep === 1 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // 1️⃣ Crear la empresa primero
      const companyData = {
        name: formData.empresaNombre,
        detail: formData.empresaRazonSocial || undefined,
      };

      console.log("🚀 [RegisterPage] Creando empresa:", companyData);
      const newCompany = await companiesApi.create(companyData);
      console.log("✅ [RegisterPage] Empresa creada:", newCompany);

      if (!newCompany || !newCompany.id) {
        throw new Error("No se pudo obtener el ID de la empresa creada");
      }

      const idCompany = newCompany.id;

      // 2️⃣ Crear el usuario administrador con el idCompany obtenido
      const userData = {
        firstName: formData.adminNombre,
        lastName: formData.adminApellido,
        email: formData.adminEmail,
        userName: formData.adminEmail, // Usar el email como userName
        password: formData.adminPassword,
        confirmPassword: formData.adminPasswordConfirm,
        idCompany: idCompany,
        idBusinessUnit: undefined, // No se requiere en el registro
      };

      console.log("🚀 [RegisterPage] Creando usuario administrador:", {
        ...userData,
        password: "***",
        confirmPassword: "***",
      });
      const newUser = await usersApi.create(userData);
      console.log("✅ [RegisterPage] Usuario creado:", newUser);

      setIsLoading(false);
      setSuccess(true);
      toast.success("¡Empresa registrada exitosamente!");

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("❌ [RegisterPage] Error en el registro:", error);
      setIsLoading(false);
      const errorMessage = getErrorMessage(error);
      toast.error(
        errorMessage ||
          "Error al registrar la empresa. Por favor, intenta nuevamente."
      );
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
          p: 2,
        }}
      >
        <Card
          sx={{
            maxWidth: 450,
            width: "100%",
            textAlign: "center",
            borderRadius: 3,
            p: 4,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 80, color: "#10b981", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
            ¡Registro Exitoso!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Tu empresa <strong>{formData.empresaNombre}</strong> ha sido
            registrada.
            <br />
            Serás redirigido al login en unos segundos...
          </Typography>
          <CircularProgress size={24} sx={{ color: secondaryColor }} />
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
        overflow: "auto",
      }}
    >
      {/* Back Button */}
      <Box sx={{ p: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{
            color: "rgba(255,255,255,0.8)",
            textTransform: "none",
            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
          }}
        >
          Volver al inicio
        </Button>
      </Box>

      <Container
        maxWidth="sm"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <Card
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "rgba(255, 255, 255, 0.95)",
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
                boxShadow: `0 0 20px ${secondaryColor}55`,
                border: "3px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <LocalGasStationIcon sx={{ fontSize: 34, color: "#fff" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              Registrar Empresa
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Crea tu cuenta empresarial en minutos
            </Typography>
          </Box>

          {/* Stepper */}
          <Box sx={{ px: 3, pt: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Form */}
          <CardContent sx={{ p: 3.5 }}>
            {activeStep === 0 ? (
              // Paso 1: Datos de la Empresa
              <Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
                >
                  <BusinessIcon sx={{ color: secondaryColor }} />
                  <Typography variant="h6" fontWeight={600}>
                    Datos de la Empresa
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nombre de la Empresa"
                      value={formData.empresaNombre}
                      onChange={handleChange("empresaNombre")}
                      error={!!errors.empresaNombre}
                      helperText={errors.empresaNombre}
                      placeholder="Mi Empresa S.A."
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Razón Social (opcional)"
                      value={formData.empresaRazonSocial}
                      onChange={handleChange("empresaRazonSocial")}
                      placeholder="Razón Social S.A."
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : (
              // Paso 2: Datos del Administrador
              <Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
                >
                  <PersonIcon sx={{ color: secondaryColor }} />
                  <Typography variant="h6" fontWeight={600}>
                    Datos del Administrador
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      value={formData.adminNombre}
                      onChange={handleChange("adminNombre")}
                      error={!!errors.adminNombre}
                      helperText={errors.adminNombre}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Apellido"
                      value={formData.adminApellido}
                      onChange={handleChange("adminApellido")}
                      error={!!errors.adminApellido}
                      helperText={errors.adminApellido}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.adminEmail}
                      onChange={handleChange("adminEmail")}
                      error={!!errors.adminEmail}
                      helperText={errors.adminEmail}
                      placeholder="admin@miempresa.com"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <EmailOutlinedIcon
                            sx={{ mr: 1, color: "#9ca3af", fontSize: 18 }}
                          />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contraseña"
                      type="password"
                      value={formData.adminPassword}
                      onChange={handleChange("adminPassword")}
                      error={!!errors.adminPassword}
                      helperText={errors.adminPassword || "Mínimo 8 caracteres"}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <LockOutlinedIcon
                            sx={{ mr: 1, color: "#9ca3af", fontSize: 18 }}
                          />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirmar Contraseña"
                      type="password"
                      value={formData.adminPasswordConfirm}
                      onChange={handleChange("adminPasswordConfirm")}
                      error={!!errors.adminPasswordConfirm}
                      helperText={errors.adminPasswordConfirm}
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2, fontSize: "0.85rem" }}>
                  Este usuario será el administrador principal de la empresa y
                  podrá crear otros usuarios.
                </Alert>
              </Box>
            )}

            {/* Navigation buttons */}
            <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  sx={{
                    flex: 1,
                    py: 1.3,
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Atrás
                </Button>
              )}
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isLoading}
                sx={{
                  flex: 1,
                  py: 1.3,
                  bgcolor: primaryColor,
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: secondaryColor },
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Registrando...</span>
                  </Box>
                ) : activeStep === steps.length - 1 ? (
                  "Crear Empresa"
                ) : (
                  "Siguiente"
                )}
              </Button>
            </Box>

            <Divider sx={{ my: 3, color: "#94a3b8", fontSize: "0.85rem" }}>
              ¿Ya tienes cuenta?
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              component={RouterLink}
              to="/login"
              sx={{
                py: 1.3,
                borderColor: secondaryColor,
                color: secondaryColor,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>

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
