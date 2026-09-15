import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        storefront: resolve(import.meta.dirname, "index.html"),
        admin: resolve(import.meta.dirname, "admin/index.html"),
      },
    },
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:5000", "/uploads": "http://localhost:5000" },
  },
  preview: { port: 4173 },
});
