/// <reference types="vitest/globals" />
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const indexPath = resolve(__dirname, "../../index.html");
const publicDir = resolve(__dirname, "../../public");

let html: string;

beforeAll(() => {
  html = readFileSync(indexPath, "utf-8");
});

describe("AC-001: Open Graph meta tags", () => {
  it("should have og:title", () => {
    expect(html).toMatch(/<meta\s+property="og:title"/);
  });

  it("should have og:description", () => {
    expect(html).toMatch(/<meta\s+property="og:description"/);
  });

  it("should have og:image", () => {
    expect(html).toMatch(/<meta\s+property="og:image"/);
  });

  it("should have og:url", () => {
    expect(html).toMatch(/<meta\s+property="og:url"/);
  });

  it("should have og:type", () => {
    expect(html).toMatch(/<meta\s+property="og:type"/);
  });
});

describe("AC-002: Twitter Card meta tags", () => {
  it("should have twitter:card", () => {
    expect(html).toMatch(/<meta\s+name="twitter:card"/);
  });

  it("should have twitter:title", () => {
    expect(html).toMatch(/<meta\s+name="twitter:title"/);
  });

  it("should have twitter:description", () => {
    expect(html).toMatch(/<meta\s+name="twitter:description"/);
  });

  it("should have twitter:image", () => {
    expect(html).toMatch(/<meta\s+name="twitter:image"/);
  });
});

describe("AC-003: OG banner image", () => {
  it("should have og-banner.png in public/", () => {
    expect(existsSync(resolve(publicDir, "og-banner.png"))).toBe(true);
  });
});

describe("AC-004: robots.txt", () => {
  it("should exist in public/", () => {
    expect(existsSync(resolve(publicDir, "robots.txt"))).toBe(true);
  });

  it("should allow all crawlers", () => {
    const robots = readFileSync(resolve(publicDir, "robots.txt"), "utf-8");
    expect(robots).toMatch(/User-agent:\s*\*/);
    expect(robots).toMatch(/Allow:\s*\//);
  });

  it("should reference sitemap", () => {
    const robots = readFileSync(resolve(publicDir, "robots.txt"), "utf-8");
    expect(robots).toMatch(/Sitemap:/i);
  });
});

describe("AC-005: sitemap.xml", () => {
  it("should exist in public/", () => {
    expect(existsSync(resolve(publicDir, "sitemap.xml"))).toBe(true);
  });

  it("should contain production URL", () => {
    const sitemap = readFileSync(resolve(publicDir, "sitemap.xml"), "utf-8");
    expect(sitemap).toContain("https://drug-quiz.calebdunn.tech");
  });

  it("should be valid XML with urlset", () => {
    const sitemap = readFileSync(resolve(publicDir, "sitemap.xml"), "utf-8");
    expect(sitemap).toMatch(/<urlset/);
    expect(sitemap).toMatch(/<\/urlset>/);
  });
});

describe("AC-006: JSON-LD structured data", () => {
  it("should have a script tag with application/ld+json", () => {
    expect(html).toMatch(/<script\s+type="application\/ld\+json">/);
  });

  it("should contain WebApplication schema type", () => {
    expect(html).toContain('"@type"');
    expect(html).toContain("WebApplication");
  });
});

describe("AC-007: Canonical URL", () => {
  it("should have a canonical link tag", () => {
    expect(html).toMatch(/<link\s+rel="canonical"/);
  });

  it("should point to production URL", () => {
    expect(html).toContain('href="https://drug-quiz.calebdunn.tech"');
  });
});

describe("AC-008: Keyword-rich meta description", () => {
  it("should contain pharmacy-related keywords", () => {
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    expect(descMatch).not.toBeNull();
    const desc = descMatch?.[1]?.toLowerCase() ?? "";
    expect(desc).toMatch(/pharmacy/);
    expect(desc).toMatch(/quiz|practice|exam/);
    expect(desc).toMatch(/drug/);
  });
});

describe("AC-009: Optimized page title", () => {
  it("should have a concise keyword-first title", () => {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    expect(titleMatch).not.toBeNull();
    const title = titleMatch?.[1]?.toLowerCase() ?? "";
    expect(title).toMatch(/pharmacy|drug/);
    expect(title.length).toBeLessThanOrEqual(60);
  });
});
