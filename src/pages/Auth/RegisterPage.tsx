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

  const primaryColor = "#1E2C56";
  const secondaryColor = "#3b82f6";

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!formData.adminNombre.trim()) newErrors.adminNombre = "Obligatorio";
    if (!formData.adminEmail.trim()) newErrors.adminEmail = "Obligatorio";
    if (formData.adminPassword.length < 8) newErrors.adminPassword = "Mínimo 8 caracteres";
    if (formData.adminPassword !== formData.adminPasswordConfirm) newErrors.adminPasswordConfirm = "No coinciden";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
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

      setSuccess(true);
      toast.success("¡Registro exitoso!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4 overflow-y-auto bg-slate-900">
      {/* Fondo optimizado */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/LoginFondo.png')" }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute left-4 top-4 z-20 text-white hover:bg-white/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <div className="relative z-10 w-full max-w-[500px] my-auto">
        <Card className="overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-md rounded-2xl">
          {/* Header sólido */}
          <div className="bg-[#1E2C56] px-8 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg border-2 border-white/20">
              <Fuel className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Crear Cuenta</h1>
            
            {/* Stepper horizontal sutil */}
            <div className="mt-6 flex justify-center items-center gap-4">
              {steps.map((label, idx) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${activeStep === idx ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/30 text-white/50'}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${activeStep === idx ? 'text-white' : 'text-white/40'}`}>
                    {label}
                  </span>
                  {idx === 0 && <div className="w-8 h-[1px] bg-white/20 mx-2" />}
                </div>
              ))}
            </div>
          </div>

          <CardContent className="px-8 py-8">
            <form className="space-y-5">
              {activeStep === 0 ? (
                /* PASO 1: EMPRESA */
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Nombre Comercial</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Ej: Logística Central S.A." 
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                        value={formData.empresaNombre}
                        onChange={handleChange("empresaNombre")}
                      />
                    </div>
                    {errors.empresaNombre && <p className="text-[10px] font-bold text-red-500">{errors.empresaNombre}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Razón Social (Opcional)</Label>
                    <Input 
                      placeholder="Nombre legal de la empresa" 
                      className="h-11 rounded-xl bg-slate-50 border-slate-200"
                      value={formData.empresaRazonSocial}
                      onChange={handleChange("empresaRazonSocial")}
                    />
                  </div>
                </div>
              ) : (
                /* PASO 2: ADMIN */
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Nombre</Label>
                      <Input value={formData.adminNombre} onChange={handleChange("adminNombre")} className="h-10 rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Apellido</Label>
                      <Input value={formData.adminApellido} onChange={handleChange("adminApellido")} className="h-10 rounded-lg" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Email Corporativo</Label>
                    <Input type="email" value={formData.adminEmail} onChange={handleChange("adminEmail")} className="h-10 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Contraseña</Label>
                      <Input type="password" value={formData.adminPassword} onChange={handleChange("adminPassword")} className="h-10 rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Confirmar</Label>
                      <Input type="password" value={formData.adminPasswordConfirm} onChange={handleChange("adminPasswordConfirm")} className="h-10 rounded-lg" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                {activeStep === 1 && (
                  <Button variant="outline" onClick={() => setActiveStep(0)} className="h-11 flex-1 font-bold rounded-xl border-slate-200">
                    Atrás
                  </Button>
                )}
                <Button 
                  onClick={handleNext} 
                  disabled={isLoading}
                  className="h-11 flex-[2] bg-[#1E2C56] text-white font-bold rounded-xl shadow-lg hover:bg-[#2a3c74]"
                >
                  {isLoading ? <Spinner className="h-4 w-4" /> : activeStep === 0 ? "Siguiente" : "Crear mi Empresa"}
                </Button>
              </div>

              <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
                ¿Ya tienes cuenta? <RouterLink to="/login" className="text-blue-600 font-bold hover:underline">Inicia Sesión</RouterLink>
              </p>
            </form>
          </CardContent>
        </Card>
        
        {success && (
          <Alert className="mt-4 bg-emerald-50 border-emerald-200 text-emerald-800 animate-in zoom-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="font-medium">¡Empresa registrada! Redirigiendo...</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}