import { useContext } from "react";
import { TenantContext } from "./tenant-context";
import type { TenantConfig } from "./types";


export function useTenantContext(): TenantConfig {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext debe ser usado dentro de TenantProvider");
  }
  return context;
}
