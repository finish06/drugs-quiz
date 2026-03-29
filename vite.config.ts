import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { parseChangelog, generateChangelogModule } from "./scripts/parse-changelog";

function changelogPlugin(): Plugin {
  return {
    name: "changelog-plugin",
    buildStart() {
      const changelogPath = path.resolve(__dirname, "CHANGELOG.md");
      const pkgPath = path.resolve(__dirname, "package.json");
      const outDir = path.resolve(__dirname, "src/generated");
      const outFile = path.join(outDir, "changelog.ts");

      try {
        const markdown = fs.existsSync(changelogPath)
          ? fs.readFileSync(changelogPath, "utf-8")
          : "";
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const versions = parseChangelog(markdown);
        const module = generateChangelogModule(versions, pkg.version);

        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outFile, module);
      } catch (err) {
        console.warn("[changelog-plugin] Failed to parse CHANGELOG.md:", err);
        // Write empty fallback
        const outDir2 = path.resolve(__dirname, "src/generated");
        if (!fs.existsSync(outDir2)) fs.mkdirSync(outDir2, { recursive: true });
        fs.writeFileSync(
          path.join(outDir2, "changelog.ts"),
          'import type { ChangelogEntry } from "@/types/changelog";\nexport const changelog: ChangelogEntry[] = [];\nexport const appVersion = "0.0.0";\n',
        );
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss(), changelogPlugin()],
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
