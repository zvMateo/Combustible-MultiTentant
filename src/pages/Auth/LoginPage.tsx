// src/pages/Auth/LoginPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Fuel, Lock, User } from "lucide-react";

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
    } catch {
      // Error ya manejado en el store
    }
  };

  const displayError = localError || error;

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center gap-6 bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: "url('/images/LoginFondo.png')" }}
    >
      {/* Botón de volver */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute left-4 top-4 z-20 text-white/90"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al inicio
      </Button>

      {/* Card de Login */}
      <div className="relative z-10 w-full max-w-md">
        <Card
          className="overflow-hidden border-0 shadow-2xl"
          style={{
            borderRadius: "16px",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header con color primario */}
          <div
            className="px-8 py-8 text-center text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div
              className="mx-auto mb-5 flex h-17 w-17 items-center justify-center rounded-full"
              style={{
                background: `linear-gradient(145deg, ${secondaryColor}, ${secondaryColor}CC)`,
                boxShadow: `0 0 20px ${secondaryColor}55, 0 4px 12px rgba(0,0,0,0.25)`,
                border: "3px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "5px auto 1.25rem auto",
              }}
            >
              <Fuel className="h-10 w-10 text-white mx-auto my-auto" />
            </div>

            <h1 className="mb-2 text-2xl font-bold tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-sm opacity-90">
              Sistema de Gestión de Combustibles
            </p>
          </div>

          {/* Contenido del formulario */}
          <CardContent className="px-6 py-8">
            <div className="space-y-12">
              <div className="flex justify-center">
                <form
                  onSubmit={handleSubmit}
                  className="w-full max-w-xs space-y-6"
                >
                  {/* Campo Usuario */}
                  <div className="space-y-2">
                    <label
                      htmlFor="username"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Usuario
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                      <Input
                        id="username"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg border-gray-300 bg-gray-50 pl-11 pr-3 text-base focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Campo Contraseña */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-gray-700"
                      >
                        Contraseña
                      </label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg border-gray-300 bg-gray-50 pl-11 pr-3 text-base focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Mensaje de error */}
                  {displayError && (
                    <Alert variant="destructive" className="rounded-lg">
                      <AlertDescription className="text-sm font-medium">
                        {displayError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Botón de login */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-lg text-base font-bold transition-all duration-200"
                    style={{
                      marginTop: "1rem",
                      color: "white",
                      backgroundColor: primaryColor,
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner className="h-5 w-5 text-white" />
                        <span>Ingresando...</span>
                      </span>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </form>
              </div>

              {/* Enlace de registro */}
              <div className="border-gray-200 pt-8 text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{" "}
                  <RouterLink
                    to="/registro"
                    className="font-semibold hover:underline"
                    style={{ color: secondaryColor }}
                  >
                    Registra tu empresa
                  </RouterLink>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-white/80">
          © 2025 GoodApps - Gestión de Combustibles
        </p>
      </div>
    </div>
  );
}
