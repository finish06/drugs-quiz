import { describe, it, expect } from "vitest";
import { parseChangelog, generateChangelogModule } from "./parse-changelog";

const SAMPLE_CHANGELOG = `# Changelog

## [Unreleased]

## [0.5.0] - 2026-03-29

### Added
- **Google Sign-In** — Sign in via Google, JWT sessions (httpOnly cookie, 30-day expiry)
- **Shareable Score Cards** — Authenticated users generate public share links
- Postgres service in docker-compose with healthcheck and persistent volume
- nginx \`/s/\` proxy to BFF for server-rendered share pages
- 339 total tests (282 frontend + 57 BFF)

### Changed
- \`useAuth\` returns safe defaults outside AuthProvider instead of throwing
- Branch coverage threshold adjusted to 78% (App.tsx orchestrator complexity)

### Fixed
- **Quiz Loading** — Fixed a rare issue where quizzes could fail to load on slow connections

## [0.4.0] - 2026-03-22

### Added
- Comprehensive E2E test suite — 6 Playwright spec files, 11+ test scenarios
- **Rx Logo** — New app logo and favicon
- Automated staging deploy via deploy-hook webhook (FastAPI)
- CI/CD pipeline: build, test, push images to registry, trigger deploy-hook

### Fixed
- 4 tier-2 bugs: race condition in quiz start, error boundary, double-click guard, exit confirmation
- E2E selector ambiguity and mobile browser config

## [0.3.0] - 2026-03-20

### Added
- **Answer Review** — See correct answers with drug class context after each quiz
- **Spaced Repetition** — Tracks weak drugs and surfaces them more often
- **Session History** — Last 10 sessions on your home screen with personal best tracking
- **Quick 5** — One-tap 5-question mixed quiz for quick study sessions
- BFF proxy service (Hono) — moves API key server-side

### Performance
- Quiz generation uses batched pre-fetching — sub-1s load on warm cache
`;

describe("parseChangelog", () => {
  it("AC-014: parses version blocks from CHANGELOG.md", () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    expect(result).toHaveLength(3);
    expect(result[0].version).toBe("0.5.0");
    expect(result[1].version).toBe("0.4.0");
    expect(result[2].version).toBe("0.3.0");
  });

  it("AC-016: maps Added → new, Changed → improvement, Fixed → fix", () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    const v050 = result[0];
    const newEntries = v050.entries.filter((e) => e.category === "new");
    const fixEntries = v050.entries.filter((e) => e.category === "fix");
    expect(newEntries.length).toBeGreaterThan(0);
    expect(fixEntries.length).toBeGreaterThan(0);
  });

  it("AC-016: maps Performance → improvement", () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    const v030 = result[2];
    const improvements = v030.entries.filter((e) => e.category === "improvement");
    expect(improvements.length).toBeGreaterThan(0);
  });

  it("AC-023: extracts bold title and description", () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    const v050 = result[0];
    const googleEntry = v050.entries.find((e) => e.title === "Google Sign-In");
    expect(googleEntry).toBeDefined();
    expect(googleEntry!.description).toContain("Sign in via Google");
  });

  it("AC-017: filters out technical entries", () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    const v050 = result[0];
    // These should be filtered: Postgres, nginx, total tests, useAuth defaults, coverage threshold
    const allTitles = v050.entries.map((e) => e.title);
    expect(allTitles).not.toContain(expect.stringMatching(/nginx/i));
    expect(allTitles).not.toContain(expect.stringMatching(/total tests/i));
    expect(allTitles).not.toContain(expect.stringMatching(/coverage/i));
  });

  it("AC-017: filters out CI/CD and E2E entries", () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    const v040 = result[1];
    const allText = v040.entries.map((e) => `${e.title} ${e.description}`).join(" ");
    expect(allText).not.toMatch(/E2E test suite/i);
    expect(allText).not.toMatch(/CI\/CD/i);
    expect(allText).not.toMatch(/deploy-hook/i);
  });

  it("formats dates as human-readable", () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    expect(result[0].date).toBe("March 29, 2026");
    expect(result[1].date).toBe("March 22, 2026");
  });

  it("skips [Unreleased] section", () => {
    const result = parseChangelog(SAMPLE_CHANGELOG);
    const versions = result.map((v) => v.version);
    expect(versions).not.toContain("Unreleased");
  });

  it("skips versions with no user-facing entries", () => {
    const technicalOnly = `# Changelog

## [0.1.0] - 2026-03-15

### Added
- Playwright E2E tests for quiz flow
- CI Docker registry push for beta and release images
`;
    const result = parseChangelog(technicalOnly);
    expect(result).toHaveLength(0);
  });

  it("handles entries without bold text", () => {
    const simple = `# Changelog

## [0.1.0] - 2026-03-15

### Fixed
- Fixed a bug where the quiz would crash on slow connections
`;
    const result = parseChangelog(simple);
    expect(result).toHaveLength(1);
    expect(result[0].entries[0].title).toContain("Fixed a bug");
  });
});

describe("generateChangelogModule", () => {
  it("AC-015: generates valid TypeScript module", () => {
    const versions = parseChangelog(SAMPLE_CHANGELOG);
    const output = generateChangelogModule(versions, "0.5.0");
    expect(output).toContain("export const changelog");
    expect(output).toContain('export const appVersion = "0.5.0"');
    expect(output).toContain("ChangelogEntry");
  });
});
