import { type ReactNode } from "react";
import { TenantContext } from "./tenant-context";
import { useTenantDomain } from "@/hooks/use-tenant-domain";
import type { TenantConfig } from "./types";
import { useQuery } from "@tanstack/react-query";

const getThemeConfig = async ({
  queryKey,
}: {
  queryKey: string[];
}): Promise<TenantConfig> => {
  const tenant = queryKey[1];
  return {
    name: tenant,
    theme: getTenantTheme(tenant),
  };
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const tenant = useTenantDomain();

  const getTenantConfigQuery = useQuery({
    queryKey: ["tenant-config", tenant],
    queryFn: getThemeConfig,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  if (getTenantConfigQuery.isLoading) {
    return <div>Cargando configuración del tenant...</div>;
  }

  if (getTenantConfigQuery.isError) {
    return <div>Error al cargar la configuración del tenant.</div>;
  }

  return (
    <TenantContext.Provider value={getTenantConfigQuery.data}>
      {children}
    </TenantContext.Provider>
  );
};

function getTenantTheme(tenant: string): string {
  const themes: Record<string, string> = {
    empresaA: "blue",
    empresaB: "green",
    clientec: "red",
  };
  return themes[tenant] || "";
}
