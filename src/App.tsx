// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "./components/providers/theme/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { Routing } from "../src/components/pages/_S/routes";
import { useEffect } from "react";
import { useAuthStore } from "./stores/auth.store";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <ThemeProvider
            defaultTheme="system"
            storageKey="multitenant-ui-theme"
          >
            <Routing />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
