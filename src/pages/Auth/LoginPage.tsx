import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Fuel, Lock, User } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const primaryColor = "#1E2C56";
  const secondaryColor = "#3b82f6";

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
    } catch {
      // Error manejado en el store
    }
  };

  const displayError = localError || error;

  return (
    // fixed inset-0 garantiza que el fondo ocupe TODA la pantalla sin barras blancas
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900">
      
      {/* Fondo con imagen y overlay oscuro para resaltar la card */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
        style={{ backgroundImage: "url('/images/LoginFondo.png')" }}
      >
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Botón Volver */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute left-4 top-4 z-20 text-white hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Contenedor Principal (Reemplaza a la Card para evitar gaps internos) */}
        <div 
          className="flex flex-col overflow-hidden shadow-2xl"
          style={{
            borderRadius: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
          }}
        >
          {/* Header Azul Sólido - Pegado arriba sin bordes blancos */}
          <div
            className="flex flex-col items-center px-8 py-10 text-center text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: `linear-gradient(145deg, ${secondaryColor}, ${secondaryColor}CC)`,
                boxShadow: `0 4px 15px ${secondaryColor}66`,
                border: "2px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <Fuel className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Inicio de Sesión</h1>
            <p className="text-sm opacity-80 mt-1 uppercase tracking-widest font-medium">
              Gestión de Combustibles
            </p>
          </div>

          {/* Formulario - Sección Blanca Pegada al Header */}
          <div className="px-8 py-10 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label htmlFor="username" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Tu usuario"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    disabled={isLoading}
                    className="h-12 border-slate-200 bg-slate-50 pl-10 text-sm focus:bg-white transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-12 border-slate-200 bg-slate-50 pl-10 text-sm focus:bg-white transition-all rounded-xl"
                  />
                </div>
              </div>

              {displayError && (
                <Alert variant="destructive" className="py-2 border-none bg-red-50 text-red-600 rounded-lg">
                  <AlertDescription className="text-xs font-bold text-center">
                    {displayError}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full text-base font-bold shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest"
                style={{ backgroundColor: primaryColor, color: "white" }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-5 w-5 text-white" />
                    Ingresando...
                  </span>
                ) : (
                  "INGRESAR"
                )}
              </Button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-xs text-slate-500">
                ¿No tienes cuenta?{" "}
                <RouterLink
                  to="/registro"
                  className="font-bold hover:underline"
                  style={{ color: secondaryColor }}
                >
                  Registra tu empresa
                </RouterLink>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
          © 2025 GoodApps - V2.0
        </p>
      </div>
    </div>
  );
}