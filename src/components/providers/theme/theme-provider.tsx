// providers/theme/ThemeProvider.tsx
import { useEffect, useState } from "react";
import { ThemeProviderContext } from "./theme-context";
import type { Theme, ThemeProviderProps, TenantThemeConfig } from "./types";

// Tema default
const DEFAULT_TENANT_THEME: TenantThemeConfig = {
  primaryColor: "#1E2C56",
  secondaryColor: "#3b82f6",
  sidebarBg: "#1E2C56",
  sidebarText: "#ffffff",
  accentColor: "#10b981",
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  // Estado del tema - usa valores por defecto
  const [tenantTheme, setTenantTheme] = useState<TenantThemeConfig>(() => {
    // Intenta cargar desde localStorage
    const savedTheme = localStorage.getItem("app-theme-config");
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        console.log("🎨 Tema cargado desde localStorage:", parsed);
        return parsed;
      } catch (e) {
        console.error("Error parsing saved theme:", e);
      }
    }

    console.log("🎨 Usando tema por defecto");
    return DEFAULT_TENANT_THEME;
  });

  // Aplicar CSS variables cuando cambia el tema
  useEffect(() => {
    const root = document.documentElement;

    console.log("🎨 Aplicando tema:", tenantTheme);

    // Aplicar variables CSS
    root.style.setProperty("--primary-color", tenantTheme.primaryColor);
    root.style.setProperty("--secondary-color", tenantTheme.secondaryColor);
    root.style.setProperty("--sidebar-bg", tenantTheme.sidebarBg);
    root.style.setProperty("--sidebar-text", tenantTheme.sidebarText);
    root.style.setProperty("--accent-color", tenantTheme.accentColor);

    // ✅ Guardar en localStorage SOLO cuando cambia (no en el primer render)
    // Esto evita sobreescribir el tema guardado
    localStorage.setItem("app-theme-config", JSON.stringify(tenantTheme));
  }, [tenantTheme]);

  // ✅ Cambiar el tipo para aceptar objeto completo O parcial
  const updateTenantTheme = (config: TenantThemeConfig | Partial<TenantThemeConfig>) => {
    console.log("🎨 updateTenantTheme llamado con:", config);
    
    setTenantTheme((prev) => {
      const newTheme = { ...prev, ...config };
      console.log("🎨 Nuevo tema calculado:", newTheme);
      return newTheme;
    });
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
