/**
 * Generate robots.txt, sitemap.xml, and health.json from build-time env vars.
 * Run at build time before Vite bundles the public/ directory.
 *
 * Indexing is controlled by VITE_ALLOW_INDEXING:
 *   - "true"  → emit a permissive robots.txt and a populated sitemap (production).
 *   - "false" / unset → emit Disallow: / and an empty sitemap (staging, dev, etc).
 *     This guards against staging URLs leaking into search results (M8 bug #4).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface SeoOptions {
  allowIndexing: boolean;
  appUrl: string;
}

export function renderRobotsTxt({ allowIndexing, appUrl }: SeoOptions): string {
  if (!allowIndexing) {
    return `User-agent: *\nDisallow: /\n`;
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${appUrl}/sitemap.xml\n`;
}

export function renderSitemapXml({ allowIndexing, appUrl }: SeoOptions): string {
  if (!allowIndexing) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${appUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

// Only execute the file-writing side effects when invoked as a script,
// so the unit tests can import the pure render functions cheaply.
const isMain = (() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(thisFile);
  } catch {
    return false;
  }
})();

if (isMain) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.join(__dirname, "..", "public");

  const appUrlRaw = process.env.VITE_APP_URL;
  if (!appUrlRaw) {
    console.warn("[generate-seo] VITE_APP_URL not set — generating SEO files with empty URL");
  }
  const appUrl = appUrlRaw || "https://localhost";

  const allowIndexing = process.env.VITE_ALLOW_INDEXING === "true";

  fs.writeFileSync(path.join(publicDir, "robots.txt"), renderRobotsTxt({ allowIndexing, appUrl }));
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), renderSitemapXml({ allowIndexing, appUrl }));

  // health.json
  const pkgPath = path.join(__dirname, "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const healthJson = JSON.stringify({ status: "healthy", version: pkg.version }, null, 2) + "\n";
  fs.writeFileSync(path.join(publicDir, "health.json"), healthJson);

  console.log(
    `Generated robots.txt, sitemap.xml, and health.json for ${appUrl} (v${pkg.version}, indexing=${allowIndexing})`,
  );
}
