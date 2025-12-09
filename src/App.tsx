// src/App.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "./components/providers/theme/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { AppRoutes } from "./routes";
import { useEffect } from "react";
import { useAuthStore } from "./stores/auth.store";
import { queryClient } from "./lib/query-client";
import Profile from "./pages/Auth/components/Profile";
import LoginButton from "./pages/Auth/components/LoginButton";
import LogoutButton from "./pages/Auth/components/LogoutButton";
import { useAuth0 } from "@auth0/auth0-react";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <ThemeProvider
            defaultTheme="system"
            storageKey="multitenant-ui-theme"
          >
            <AppRoutes />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthInitializer>
      </BrowserRouter>
      {/* DevTools solo en desarrollo */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
