// providers/theme/theme-context.ts
import { createContext } from "react";
import type { ThemeProviderState } from "./types";

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  tenantTheme: undefined,
  updateTenantTheme: undefined,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
