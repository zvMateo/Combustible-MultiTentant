// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5177,
    host: true, // ← Importante para subdominios
    proxy: {
      // Proxy para evitar CORS en desarrollo
      "/api": {
        target: "https://apicombustibles.ubiko.com.ar",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
