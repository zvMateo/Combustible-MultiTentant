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
import { Spinner } from "./components/ui/spinner";
import { setUnauthorizedHandler } from "./lib/axios";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().handleSessionExpired();
      queryClient.clear();
    });
    checkAuth();
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
