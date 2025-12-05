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

interface AdminAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 AdminAuthProvider: Verificando sesión...");

    const currentUser = authService.getCurrentUser();
    console.log("👤 Admin usuario encontrado:", currentUser);

    if (currentUser?.role === "superadmin") {
      setUser(currentUser);
    }
    // No llamamos logout aquí - solo no establecemos el usuario
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(credentials);
      if (loggedUser.role !== "superadmin") {
        throw new Error("Solo usuarios de GoodApps pueden acceder");
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
    navigate("/a/login");
    toast.info("Sesión cerrada correctamente (admin).");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider");
  }
  return context;
}
