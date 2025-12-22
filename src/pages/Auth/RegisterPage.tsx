import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { companiesApi } from "@/services/api/companies.api";
import { usersApi } from "@/services/api/users.api";
import { movementTypesApi } from "@/services/api/movement-types.api";
import axiosInstance, { getErrorMessage, tokenStorage } from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/pages/Auth/components/AuthShell";
import { AuthField } from "@/pages/Auth/components/AuthField";
import {
  Building2,
  CheckCircle2,
  Fuel,
  Lock,
  Mail,
  Phone,
  User,
  UserCircle,
} from "lucide-react";

interface FormData {
  empresaNombre: string;
  empresaRazonSocial: string;
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

const steps = ["Empresa", "Administrador"];

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

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      if (errors[field]) setErrors({ ...errors, [field]: "" });
    };

  const validateStep1 = (): boolean => {
    if (!formData.empresaNombre.trim()) {
      setErrors({ empresaNombre: "El nombre es obligatorio" });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.adminNombre.trim())
      newErrors.adminNombre = "El nombre es obligatorio";
    if (!formData.adminApellido.trim())
      newErrors.adminApellido = "El apellido es obligatorio";
    if (!formData.adminUserName.trim())
      newErrors.adminUserName = "El usuario es obligatorio";

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
    if (isLoading) return;
    if (activeStep === 0 && validateStep1()) setActiveStep(1);
    else if (activeStep === 1 && validateStep2()) handleSubmit();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const newCompany = await companiesApi.create({
        name: formData.empresaNombre,
        detail: formData.empresaRazonSocial || undefined,
      });

      if (!newCompany?.id) throw new Error("ID de empresa no encontrado");

      await usersApi.createRegister({
        firstName: formData.adminNombre,
        lastName: formData.adminApellido,
        email: formData.adminEmail,
        userName: formData.adminUserName,
        password: formData.adminPassword,
        confirmPassword: formData.adminPasswordConfirm,
        idCompany: newCompany.id,
        phoneNumber: formData.adminPhoneNumber || "",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const loginResponse = await axiosInstance.post<{ token?: string }>(
        "/Auth/Login",
        {
          userName: formData.adminUserName,
          password: formData.adminPassword,
        }
      );

      const token = loginResponse.data?.token;
      if (!token) throw new Error("No se pudo obtener token para inicializar la empresa");
      tokenStorage.setToken(token, false);

      try {
        await Promise.all([
          movementTypesApi.create({
            name: "Carga",
            idCompany: newCompany.id,
            idBusinessUnit: 0,
          }),
          movementTypesApi.create({
            name: "Descarga",
            idCompany: newCompany.id,
            idBusinessUnit: 0,
          }),
        ]);
      } finally {
        tokenStorage.clearTokens();
      }

      setSuccess(true);
      toast.success("¡Registro exitoso!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-[500px] py-10">
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/95 shadow-2xl backdrop-blur-md">
          <div className="bg-primary px-8 py-8 text-center text-primary-foreground">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-blue-500 shadow-lg">
              <Fuel className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Crear Cuenta</h1>

            <div className="mt-6 flex items-center justify-center gap-4">
              {steps.map((label, idx) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold " +
                      (activeStep === idx
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-white/30 text-white/50")
                    }
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={
                      "text-[11px] font-bold uppercase tracking-wider " +
                      (activeStep === idx ? "text-white" : "text-white/40")
                    }
                  >
                    {label}
                  </span>
                  {idx === 0 ? (
                    <div className="mx-2 h-px w-8 bg-white/20" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <CardContent className="px-8 py-8">
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {activeStep === 0 ? (
                <div className="animate-in space-y-4 fade-in slide-in-from-right-4">
                  <AuthField
                    id="empresaNombre"
                    label="Nombre Comercial"
                    placeholder="Ej: Logística Central S.A."
                    value={formData.empresaNombre}
                    onChange={handleChange("empresaNombre")}
                    error={errors.empresaNombre}
                    disabled={isLoading}
                    icon={<Building2 className="h-4 w-4" />}
                  />

                  <div>
                    <Label
                      htmlFor="empresaRazonSocial"
                      className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Razón Social (Opcional)
                    </Label>
                    <Input
                      id="empresaRazonSocial"
                      placeholder="Nombre legal de la empresa"
                      className="mt-2 h-11 rounded-xl border-slate-200 bg-slate-50 text-sm transition-all focus:bg-white"
                      value={formData.empresaRazonSocial}
                      onChange={handleChange("empresaRazonSocial")}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="animate-in space-y-4 fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <AuthField
                      id="adminNombre"
                      label="Nombre"
                      value={formData.adminNombre}
                      onChange={handleChange("adminNombre")}
                      error={errors.adminNombre}
                      disabled={isLoading}
                      icon={<User className="h-4 w-4" />}
                    />

                    <AuthField
                      id="adminApellido"
                      label="Apellido"
                      value={formData.adminApellido}
                      onChange={handleChange("adminApellido")}
                      error={errors.adminApellido}
                      disabled={isLoading}
                      icon={<User className="h-4 w-4" />}
                    />
                  </div>

                  <AuthField
                    id="adminUserName"
                    label="Usuario"
                    placeholder="admin.usuario"
                    value={formData.adminUserName}
                    onChange={handleChange("adminUserName")}
                    error={errors.adminUserName}
                    disabled={isLoading}
                    icon={<UserCircle className="h-4 w-4" />}
                  />

                  <AuthField
                    id="adminEmail"
                    label="Email"
                    type="email"
                    placeholder="admin@miempresa.com"
                    value={formData.adminEmail}
                    onChange={handleChange("adminEmail")}
                    error={errors.adminEmail}
                    disabled={isLoading}
                    icon={<Mail className="h-4 w-4" />}
                  />

                  <AuthField
                    id="adminPhoneNumber"
                    label="Teléfono (Opcional)"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    value={formData.adminPhoneNumber}
                    onChange={handleChange("adminPhoneNumber")}
                    disabled={isLoading}
                    icon={<Phone className="h-4 w-4" />}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <AuthField
                      id="adminPassword"
                      label="Contraseña"
                      type="password"
                      value={formData.adminPassword}
                      onChange={handleChange("adminPassword")}
                      error={errors.adminPassword}
                      disabled={isLoading}
                      icon={<Lock className="h-4 w-4" />}
                    />
                    <AuthField
                      id="adminPasswordConfirm"
                      label="Confirmar"
                      type="password"
                      value={formData.adminPasswordConfirm}
                      onChange={handleChange("adminPasswordConfirm")}
                      error={errors.adminPasswordConfirm}
                      disabled={isLoading}
                      icon={<Lock className="h-4 w-4" />}
                    />
                  </div>

                  <Alert className="bg-slate-50">
                    <AlertDescription className="text-xs text-slate-600">
                      Este usuario será el administrador principal de la empresa
                      y podrá crear otros usuarios.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {activeStep === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep(0)}
                    disabled={isLoading}
                    className="h-11 flex-1 rounded-xl border-slate-200 font-bold"
                  >
                    Atrás
                  </Button>
                ) : null}

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="h-11 flex-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      Procesando...
                    </span>
                  ) : activeStep === 0 ? (
                    "Siguiente"
                  ) : (
                    "Crear mi Empresa"
                  )}
                </Button>
              </div>

              <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                ¿Ya tienes cuenta?{" "}
                <RouterLink
                  to="/login"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Inicia Sesión
                </RouterLink>
              </p>
            </form>
          </CardContent>
        </Card>

        {success ? (
          <Alert className="mt-4 animate-in zoom-in border-emerald-200 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="font-medium">
              ¡Empresa registrada! Redirigiendo...
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </AuthShell>
  );
}
