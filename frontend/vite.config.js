import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path aliases mirror tsconfig.json's "paths" below — keep both in sync when adding a new one.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/data": path.resolve(__dirname, "./src/data"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/app": path.resolve(__dirname, "./src/app"),
    },
  },
  server: {
    port: 5173,
  },
});
