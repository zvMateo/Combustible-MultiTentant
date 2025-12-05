// src/components/guards/tenant-auth.guard.tsx
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useTenantStore } from "@/stores/tenant.store";
import { Box, CircularProgress } from "@mui/material";

interface TenantAuthGuardProps {
  children: ReactNode;
  requireRole?: "admin" | "supervisor" | "operador" | "auditor";
}

export function TenantAuthGuard({
  children,
  requireRole,
}: TenantAuthGuardProps) {
  const { user, isLoading, isAuthenticated, checkAuth } = useTenantStore();

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
          bgcolor: "#F4F8FA",
        }}
      >
        <CircularProgress sx={{ color: "#1E2C56" }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/s/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
