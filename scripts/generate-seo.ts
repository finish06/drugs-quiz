/**
 * Generate robots.txt and sitemap.xml from VITE_APP_URL env var.
 * Run at build time before Vite bundles the public/ directory.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const appUrl = process.env.VITE_APP_URL;

if (!appUrl) {
  console.warn("[generate-seo] VITE_APP_URL not set — generating SEO files with empty URL");
}

const url = appUrl || "https://localhost";

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${url}/sitemap.xml
`;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt);
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapXml);

// Generate health.json
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const healthJson = JSON.stringify({ status: "healthy", version: pkg.version }, null, 2) + "\n";
fs.writeFileSync(path.join(publicDir, "health.json"), healthJson);

console.log(`Generated robots.txt, sitemap.xml, and health.json for ${url} (v${pkg.version})`);
