// providers/theme/ThemeProvider.tsx
import { useEffect, useState } from "react";
import { ThemeProviderContext } from "./theme-context";
import type { Theme, ThemeProviderProps, TenantThemeConfig } from "./types";
import { useTenantStore } from "@/stores/tenant.store";

// Tema default
const DEFAULT_TENANT_THEME: TenantThemeConfig = {
  primaryColor: '#284057',
  secondaryColor: '#66FF99',
  sidebarBg: '#284057',
  sidebarText: '#ffffff',
  accentColor: '#66FF99',
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const { tenantConfig } = useTenantStore();
  
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  // Estado del tema del tenant - derivado del store
  const [tenantTheme, setTenantTheme] = useState<TenantThemeConfig>(() => {
    // Si hay config del tenant, usarla
    if (tenantConfig?.theme) {
      return {
        primaryColor: tenantConfig.theme.primaryColor || DEFAULT_TENANT_THEME.primaryColor,
        secondaryColor: tenantConfig.theme.secondaryColor || DEFAULT_TENANT_THEME.secondaryColor,
        sidebarBg: tenantConfig.theme.primaryColor || DEFAULT_TENANT_THEME.sidebarBg,
        sidebarText: DEFAULT_TENANT_THEME.sidebarText,
        accentColor: tenantConfig.theme.secondaryColor || DEFAULT_TENANT_THEME.accentColor,
      };
    }
    
    // Intenta cargar desde localStorage
    const savedTheme = localStorage.getItem(`tenant-theme-${tenantConfig?.id}`);
    if (savedTheme) {
      try {
        return JSON.parse(savedTheme);
      } catch (e) {
        console.error('Error parsing saved theme:', e);
      }
    }
    
    return DEFAULT_TENANT_THEME;
  });

  // Actualizar tema cuando cambia la config del tenant
  useEffect(() => {
    if (tenantConfig?.theme) {
      setTenantTheme({
        primaryColor: tenantConfig.theme.primaryColor || DEFAULT_TENANT_THEME.primaryColor,
        secondaryColor: tenantConfig.theme.secondaryColor || DEFAULT_TENANT_THEME.secondaryColor,
        sidebarBg: tenantConfig.theme.primaryColor || DEFAULT_TENANT_THEME.sidebarBg,
        sidebarText: DEFAULT_TENANT_THEME.sidebarText,
        accentColor: tenantConfig.theme.secondaryColor || DEFAULT_TENANT_THEME.accentColor,
      });
    }
  }, [tenantConfig?.theme]);

  // Aplicar CSS variables cuando cambia el tema del tenant
  useEffect(() => {
    const root = document.documentElement;
    
    // Aplicar variables CSS
    root.style.setProperty('--primary-color', tenantTheme.primaryColor);
    root.style.setProperty('--secondary-color', tenantTheme.secondaryColor);
    root.style.setProperty('--sidebar-bg', tenantTheme.sidebarBg);
    root.style.setProperty('--sidebar-text', tenantTheme.sidebarText);
    root.style.setProperty('--accent-color', tenantTheme.accentColor);

    // Guardar en localStorage si hay tenant
    if (tenantConfig?.id) {
      localStorage.setItem(`tenant-theme-${tenantConfig.id}`, JSON.stringify(tenantTheme));
    }
  }, [tenantTheme, tenantConfig?.id]);

  const updateTenantTheme = (config: Partial<TenantThemeConfig>) => {
    setTenantTheme((prev) => ({ ...prev, ...config }));
  };

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    tenantTheme,
    updateTenantTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
