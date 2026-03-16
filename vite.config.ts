import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
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
          target: env.DRUG_GATE_URL || "http://192.168.1.86:8085",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
          headers: {
            "X-API-Key": env.DRUG_GATE_API_KEY || "",
          },
        },
      },
    },
  };
});
