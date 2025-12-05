import { useMemo } from "react";

/**
 * Hook para detectar el tenant actual basado en el subdominio
 * 
 * Ejemplos:
 * - empresaa.combustible.local → "empresaa"
 * - localhost:5173 → "default"
 * - empresaa.localhost:5173 → "empresaa"
 */
export const useTenantDomain = (): string => {
  const tenant = useMemo(() => {
    const hostname = window.location.hostname;
    const appDomain = import.meta.env.VITE_APP_DOMAIN || "localhost";
    const defaultTenant = import.meta.env.VITE_APP_DEFAULT_TENANT || "default";

    // Caso especial: localhost sin subdominio
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return defaultTenant;
    }

    // Extraer el subdominio
    // Para: empresaa.combustible.local → empresaa
    // Para: empresaa.localhost → empresaa
    const subdomain = hostname.split(".")[0];

    // Validar que no sea el dominio principal
    if (subdomain && subdomain !== appDomain && subdomain !== "localhost") {
      return subdomain.toLowerCase();
    }

    return defaultTenant;
  }, []);

  return tenant;
};
