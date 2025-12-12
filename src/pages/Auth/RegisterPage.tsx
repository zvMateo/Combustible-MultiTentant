// src/pages/Auth/RegisterPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { companiesApi } from "@/services/api/companies.api";
import { usersApi } from "@/services/api/users.api";
import { getErrorMessage } from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Fuel,
  Mail,
  Phone,
  User,
  UserCircle,
  Lock,
} from "lucide-react";

interface FormData {
  // Paso 1 - Datos empresa
  empresaNombre: string;
  empresaRazonSocial: string;
  // Paso 2 - Datos admin
  adminNombre: string;
  adminApellido: string;
  adminUserName: string;
  adminEmail: string;
  adminPhoneNumber: string;
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
    adminUserName: "",
    adminEmail: "",
    adminPhoneNumber: "",
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
    if (!formData.adminUserName.trim()) {
      newErrors.adminUserName = "El nombre de usuario es obligatorio";
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

      const userData = {
        firstName: formData.adminNombre,
        lastName: formData.adminApellido,
        email: formData.adminEmail,
        userName: formData.adminUserName,
        password: formData.adminPassword,
        confirmPassword: formData.adminPasswordConfirm,
        idCompany: idCompany,
        idBusinessUnit: undefined,
        phoneNumber: formData.adminPhoneNumber || "",
      };

      console.log("🚀 [RegisterPage] Creando usuario administrador:", {
        ...userData,
        password: "***",
        confirmPassword: "***",
      });
      await usersApi.createRegister(userData);
      console.log("✅ [RegisterPage] Usuario creado correctamente");

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
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
        }}
      >
        <Card className="w-full max-w-[450px] rounded-xl p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-emerald-500" />
          <div className="mb-2 text-2xl font-bold">¡Registro Exitoso!</div>
          <div className="mb-6 text-sm text-muted-foreground">
            Tu empresa <strong>{formData.empresaNombre}</strong> ha sido registrada.
            <br />
            Serás redirigido al login en unos segundos...
          </div>
          <Spinner className="mx-auto size-6" style={{ color: secondaryColor }} />
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col overflow-auto"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
      }}
    >
      <div className="p-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-white/80 hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <Card
            className="overflow-hidden gap-0 p-0"
            style={{
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div className="px-6 py-6 text-center text-white" style={{ backgroundColor: primaryColor }}>
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  background: `linear-gradient(145deg, ${secondaryColor}, ${secondaryColor}CC)`,
                  boxShadow: `0 0 20px ${secondaryColor}55`,
                  border: "3px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Fuel className="h-8 w-8 text-white" />
              </div>
              <div className="mb-1 text-2xl font-bold">Registrar Empresa</div>
              <div className="text-sm opacity-80">Crea tu cuenta empresarial en minutos</div>
            </div>

            <div className="px-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                {steps.map((label, idx) => {
                  const isCompleted = idx < activeStep;
                  const isCurrent = idx === activeStep;
                  return (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold"
                        style={{
                          backgroundColor: isCompleted || isCurrent ? primaryColor : "transparent",
                          borderColor: isCompleted || isCurrent ? primaryColor : "#e2e8f0",
                          color: isCompleted || isCurrent ? "#fff" : "#64748b",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div
                        className="text-center text-xs font-semibold"
                        style={{ color: isCurrent ? primaryColor : "#64748b" }}
                      >
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <CardContent className="p-0">
              <div className="p-7">
              {activeStep === 0 ? (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" style={{ color: secondaryColor }} />
                    <div className="text-lg font-semibold">Datos de la Empresa</div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Nombre de la Empresa</Label>
                      <Input
                        placeholder="Mi Empresa S.A."
                        value={formData.empresaNombre}
                        onChange={handleChange("empresaNombre")}
                        className="mt-2"
                      />
                      {errors.empresaNombre && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.empresaNombre}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Razón Social (opcional)</Label>
                      <Input
                        placeholder="Razón Social S.A."
                        value={formData.empresaRazonSocial}
                        onChange={handleChange("empresaRazonSocial")}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" style={{ color: secondaryColor }} />
                    <div className="text-lg font-semibold">Datos del Administrador</div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={formData.adminNombre}
                        onChange={handleChange("adminNombre")}
                        className="mt-2"
                      />
                      {errors.adminNombre && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.adminNombre}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Apellido</Label>
                      <Input
                        value={formData.adminApellido}
                        onChange={handleChange("adminApellido")}
                        className="mt-2"
                      />
                      {errors.adminApellido && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.adminApellido}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <Label>Nombre de Usuario</Label>
                      <div className="relative mt-2">
                        <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="admin.usuario"
                          value={formData.adminUserName}
                          onChange={handleChange("adminUserName")}
                          className="pl-10"
                        />
                      </div>
                      {errors.adminUserName && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.adminUserName}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <Label>Email</Label>
                      <div className="relative mt-2">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="admin@miempresa.com"
                          value={formData.adminEmail}
                          onChange={handleChange("adminEmail")}
                          className="pl-10"
                        />
                      </div>
                      {errors.adminEmail && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.adminEmail}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <Label>Teléfono</Label>
                      <div className="relative mt-2">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                        <Input
                          type="tel"
                          placeholder="+54 9 11 1234-5678"
                          value={formData.adminPhoneNumber}
                          onChange={handleChange("adminPhoneNumber")}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Contraseña</Label>
                      <div className="relative mt-2">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                        <Input
                          type="password"
                          value={formData.adminPassword}
                          onChange={handleChange("adminPassword")}
                          className="pl-10"
                        />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {errors.adminPassword || "Mínimo 8 caracteres"}
                      </div>
                    </div>

                    <div>
                      <Label>Confirmar Contraseña</Label>
                      <Input
                        type="password"
                        value={formData.adminPasswordConfirm}
                        onChange={handleChange("adminPasswordConfirm")}
                        className="mt-2"
                      />
                      {errors.adminPasswordConfirm && (
                        <div className="mt-1 text-xs text-red-600">
                          {errors.adminPasswordConfirm}
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <AlertDescription className="text-[0.85rem]">
                      Este usuario será el administrador principal de la empresa y podrá crear otros usuarios.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="mt-8 flex gap-3">
                {activeStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="h-11 flex-1 rounded-md font-semibold"
                  >
                    Atrás
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="h-11 flex-1 rounded-md font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      secondaryColor;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      primaryColor;
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="size-5 text-white" />
                      <span>Registrando...</span>
                    </span>
                  ) : activeStep === steps.length - 1 ? (
                    "Crear Empresa"
                  ) : (
                    "Siguiente"
                  )}
                </Button>
              </div>

              <div className="relative my-8">
                <div className="h-px bg-slate-200" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-slate-400">
                  ¿Ya tienes cuenta?
                </div>
              </div>

              <Button
                asChild
                type="button"
                variant="outline"
                className="h-11 w-full rounded-md font-semibold"
                style={{ borderColor: secondaryColor, color: secondaryColor }}
              >
                <RouterLink to="/login">Iniciar Sesión</RouterLink>
              </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-xs text-white/70">
            © 2025 GoodApps - Gestión de Combustibles
          </div>
        </div>
      </div>
    </div>
  );
}
