// src/components/guards/admin-auth.guard.tsx
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Box, CircularProgress } from "@mui/material";

interface AdminAuthGuardProps {
  children: ReactNode;
  requireRole?: "superadmin";
}

export function AdminAuthGuard({ children, requireRole }: AdminAuthGuardProps) {
  const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();

  // Verificar autenticación al montar
  useEffect(() => {
    checkAuth();
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

  if (!isAuthenticated) {
    return <Navigate to="/a/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
