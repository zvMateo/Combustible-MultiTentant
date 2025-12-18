import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AuthShell } from "@/pages/Auth/components/AuthShell";
import { AuthField } from "@/pages/Auth/components/AuthField";
import { Fuel, Lock, User } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } =
    useAuthStore();

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
    <AuthShell onBack={() => navigate("/")}>
      <div className="mx-auto w-full max-w-[440px] py-8 animate-fade-in">
        <Card className="overflow-hidden rounded-3xl border-0 bg-white/98 shadow-2xl backdrop-blur-xl">
          <div
            className="relative px-8 py-12 text-center text-white overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #2d3f73 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
            <div className="relative">
              <div
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl transition-transform duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(145deg, ${secondaryColor}, #0ea5e9)`,
                  boxShadow: `0 8px 32px ${secondaryColor}50`,
                  border: "3px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <Fuel className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Bienvenido</h1>
              <p className="mt-2 text-sm font-medium tracking-wide opacity-70">
                Ingresa a tu cuenta para continuar
              </p>
            </div>
          </div>

          <CardContent className="px-8 py-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthField
                id="username"
                label="Usuario"
                placeholder="Tu usuario"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isLoading}
                icon={<User className="h-4 w-4" />}
              />

              <AuthField
                id="password"
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                icon={<Lock className="h-4 w-4" />}
              />

              {displayError ? (
                <Alert
                  variant="destructive"
                  className="rounded-xl border-none bg-red-50/80 py-3 text-red-600 animate-scale-in"
                >
                  <AlertDescription className="text-center text-xs font-semibold">
                    {displayError}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                disabled={isLoading}
                size="xl"
                className="w-full font-bold tracking-wide shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-5 w-5 text-white" />
                    Ingresando...
                  </span>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                ¿No tienes cuenta?{" "}
                <RouterLink
                  to="/registro"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Registra tu empresa
                </RouterLink>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs font-medium tracking-widest text-white/50">
          © 2025 GOODAPPS
        </p>
      </div>
    </AuthShell>
  );
}
