// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { compression } from "vite-plugin-compression2";
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Compresión gzip y brotli para producción
    compression(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5177,
    host: true,
    proxy: {
      // "/api": {
      //   target: "https://api.controlcombustible.com.ar",
      //   changeOrigin: true,
      //   secure: false,
      // },
      "/naftas": {
        target: "https://naftas.com.ar",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/naftas/, ""),
      },
    },
  },
  build: {
    // Optimizaciones de build
    target: "es2022",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    // Dividir chunks para mejor caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - se cachean por separado
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
          ],
          "vendor-charts": ["recharts"],
          "vendor-utils": ["axios", "date-fns", "zustand", "zod"],
          "vendor-xlsx": ["xlsx"],
        },
        // Nombres de chunks optimizados para cache
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Aumentar límite de warning (opcional)
    chunkSizeWarningLimit: 500,
  },
  // Optimizaciones adicionales
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "axios",
      "zustand",
    ],
  },
});
