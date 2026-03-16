import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.DRUG_GATE_URL || "http://localhost:8081",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
        headers: {
          "X-API-Key": process.env.DRUG_GATE_API_KEY || "",
        },
      },
    },
  },
});
