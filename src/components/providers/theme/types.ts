// providers/theme/types.ts
export type Theme = "dark" | "light" | "system" | string;

export type TenantThemeConfig = {
  primaryColor: string;
  secondaryColor: string;
  sidebarBg: string;
  sidebarText: string;
  accentColor: string;
  logoUrl?: string;
};

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  tenantTheme?: TenantThemeConfig;
  updateTenantTheme?: (config: Partial<TenantThemeConfig>) => void;
};
