import { describe, it, expect } from "vitest";
import { renderRobotsTxt, renderSitemapXml } from "./generate-seo";

describe("renderRobotsTxt", () => {
  it("emits Allow: / and a sitemap line when indexing is enabled", () => {
    const out = renderRobotsTxt({ allowIndexing: true, appUrl: "https://rxdrill.com" });
    expect(out).toContain("User-agent: *");
    expect(out).toContain("Allow: /");
    expect(out).not.toContain("Disallow: /");
    expect(out).toContain("Sitemap: https://rxdrill.com/sitemap.xml");
  });

  it("emits Disallow: / and omits the sitemap when indexing is disabled (M8 bug #4)", () => {
    const out = renderRobotsTxt({ allowIndexing: false, appUrl: "https://drug-quiz.staging.calebdunn.tech" });
    expect(out).toContain("User-agent: *");
    expect(out).toContain("Disallow: /");
    expect(out).not.toMatch(/^Allow:/m);
    expect(out).not.toMatch(/Sitemap:/);
  });
});

describe("renderSitemapXml", () => {
  it("emits a single <url> entry pointing at appUrl when indexing is enabled", () => {
    const out = renderSitemapXml({ allowIndexing: true, appUrl: "https://rxdrill.com" });
    expect(out).toContain("<urlset");
    expect(out).toContain("<loc>https://rxdrill.com</loc>");
  });

  it("emits an empty urlset (no entries) when indexing is disabled (M8 bug #4)", () => {
    const out = renderSitemapXml({ allowIndexing: false, appUrl: "https://drug-quiz.staging.calebdunn.tech" });
    expect(out).toContain("<urlset");
    expect(out).not.toContain("<loc>");
    expect(out).not.toContain("<url>");
  });
});
