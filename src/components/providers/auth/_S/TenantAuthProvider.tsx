import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { User, LoginCredentials } from "@/types/auth";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

interface TenantAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(
  undefined
);

export function TenantAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 TenantAuthProvider: Verificando sesión...");

    const currentUser = authService.getCurrentUser();
    console.log("👤 Tenant usuario encontrado:", currentUser);

    // en tenant NO aceptamos superadmin, pero no cerramos sesión global
    if (currentUser && currentUser.role !== "superadmin") {
      setUser(currentUser);
    }
    // No llamamos logout aquí - solo no establecemos el usuario
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(credentials);
      if (loggedUser.role === "superadmin") {
        throw new Error("Usa el panel de administración");
      }
      setUser(loggedUser);
      toast.success(`Bienvenido ${loggedUser.name}`);
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate("/s/login");
    toast.info("Sesión cerrada correctamente (tenant).");
  };

  return (
    <TenantAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </TenantAuthContext.Provider>
  );
}

export function useTenantAuth() {
  const context = useContext(TenantAuthContext);
  if (!context) {
    throw new Error("useTenantAuth debe usarse dentro de TenantAuthProvider");
  }
  return context;
}
