// src/stores/ui.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: unknown;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: "light" | "dark" | "system";

  // Modales
  modal: ModalState;

  // Drawer
  drawerOpen: boolean;
  drawerContent: string | null;
  drawerData?: unknown;

  // Loading global
  globalLoading: boolean;
  loadingMessage: string;

  // Acciones Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Acciones Theme
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Acciones Modal
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;

  // Acciones Drawer
  openDrawer: (content: string, data?: unknown) => void;
  closeDrawer: () => void;

  // Acciones Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Estado inicial
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: "light",
      modal: { isOpen: false, type: null },
      drawerOpen: false,
      drawerContent: null,
      globalLoading: false,
      loadingMessage: "",

      // Sidebar
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Theme
      setTheme: (theme) => set({ theme }),

      // Modal
      openModal: (type, data) =>
        set({
          modal: { isOpen: true, type, data },
        }),
      closeModal: () =>
        set({
          modal: { isOpen: false, type: null, data: undefined },
        }),

      // Drawer
      openDrawer: (content, data) =>
        set({
          drawerOpen: true,
          drawerContent: content,
          drawerData: data,
        }),
      closeDrawer: () =>
        set({
          drawerOpen: false,
          drawerContent: null,
          drawerData: undefined,
        }),

      // Loading
      setGlobalLoading: (loading, message = "") =>
        set({
          globalLoading: loading,
          loadingMessage: message,
        }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// Selector hooks
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useTheme = () => useUIStore((state) => state.theme);
export const useModal = () => useUIStore((state) => state.modal);
export const useDrawer = () =>
  useUIStore((state) => ({
    open: state.drawerOpen,
    content: state.drawerContent,
    data: state.drawerData,
  }));
export const useGlobalLoading = () =>
  useUIStore((state) => ({
    loading: state.globalLoading,
    message: state.loadingMessage,
  }));

