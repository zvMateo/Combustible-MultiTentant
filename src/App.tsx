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
import { Box, CircularProgress } from "@mui/material";
import { setUnauthorizedHandler } from "./lib/axios";

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "#F8FAFB",
        }}
      >
        <CircularProgress sx={{ color: "#284057" }} />
      </Box>
    );
  }

  return <>{children}</>;
}

function App() {
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
