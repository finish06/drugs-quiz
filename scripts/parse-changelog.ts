/**
 * Parse CHANGELOG.md into structured changelog data for the What's New panel.
 * Transforms developer-facing entries into customer-friendly language.
 * Filters out technical/internal entries.
 */

export interface ParsedItem {
  category: "new" | "improvement" | "fix";
  title: string;
  description: string;
}

export interface ParsedVersion {
  version: string;
  date: string;
  entries: ParsedItem[];
}

const SECTION_MAP: Record<string, "new" | "improvement" | "fix"> = {
  added: "new",
  changed: "improvement",
  performance: "improvement",
  fixed: "fix",
};

/** Patterns that indicate technical/internal entries to filter out */
const TECHNICAL_PATTERNS = [
  /\bCI\b/i,
  /\bCD\b/i,
  /\bCI\/CD\b/i,
  /\bdocker\b/i,
  /\bDockerfile\b/i,
  /\bdocker.compose\b/i,
  /\bcoverage\b/i,
  /\blint\b/i,
  /\beslint\b/i,
  /\be2e\b/i,
  /\bplaywright\b/i,
  /\bvitest\b/i,
  /\btest suite\b/i,
  /\btest infrastructure\b/i,
  /\btotal tests\b/i,
  /\btype.check\b/i,
  /\btsc\b/i,
  /\bGHCR\b/i,
  /\bregistry\b/i,
  /\bbranch coverage\b/i,
  /\bthreshold\b/i,
  /\bdeploy.hook\b/i,
  /\bnginx\b/i,
  /\bproxy\b/i,
  /\bBFF\b/,
  /\bmigration.?folder\b/i,
  /\bdrizzle\b/i,
  /\bwebhook\b/i,
  /\bHMAC\b/i,
  /\bsmoke test\b/i,
  /\bmulti.stage\b/i,
  /\bselector ambiguity\b/i,
  /\bbrowser config\b/i,
  /\bvolume mount\b/i,
  /\breturns safe defaults\b/i,
  /\bPostgres\b/i,
  /\bPostgreSQL\b/i,
  /\bORM\b/,
  /\bCRUD\b/,
  /\bAPI client\b/i,
  /\btyped endpoints\b/i,
  /\bAuthProvider\b/,
  /\buseAuth\b/,
  /\buseSessionHistory\b/,
  /\bAuthContext\b/,
  /\bmaturity promotion\b/i,
  /\bevidence score\b/i,
  /\bPromise\.allSettled\b/,
  /\bserver.rendered\b/i,
  /\bOG meta\b/i,
  /\bhealthcheck\b/i,
  /\bpersistent volume\b/i,
];

function isTechnicalEntry(text: string): boolean {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(text));
}

/** Parse bold title and description from a changelog line */
function parseEntry(
  line: string,
  category: "new" | "improvement" | "fix",
): ParsedItem | null {
  // Remove leading "- " or "* "
  const content = line.replace(/^[-*]\s+/, "").trim();
  if (!content) return null;

  // Check for **bold title** — description pattern
  const boldMatch = content.match(/^\*\*(.+?)\*\*\s*[-—–:]\s*(.+)$/);
  if (boldMatch) {
    const title = boldMatch[1].trim();
    const description = boldMatch[2].trim();
    const fullText = `${title} ${description}`;
    if (isTechnicalEntry(fullText)) return null;
    return { category, title, description };
  }

  // Check for **bold title** without description
  const boldOnlyMatch = content.match(/^\*\*(.+?)\*\*\s*$/);
  if (boldOnlyMatch) {
    const title = boldOnlyMatch[1].trim();
    if (isTechnicalEntry(title)) return null;
    return { category, title, description: "" };
  }

  // Plain text — use as title
  if (isTechnicalEntry(content)) return null;
  return { category, title: content, description: "" };
}

export function parseChangelog(markdown: string): ParsedVersion[] {
  const versions: ParsedVersion[] = [];
  let currentVersion: ParsedVersion | null = null;
  let currentCategory: "new" | "improvement" | "fix" | null = null;

  const lines = markdown.split("\n");

  for (const line of lines) {
    // Match version header: ## [0.5.0] - 2026-03-29
    const versionMatch = line.match(
      /^## \[(\d+\.\d+\.\d+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/,
    );
    if (versionMatch) {
      if (currentVersion && currentVersion.entries.length > 0) {
        versions.push(currentVersion);
      }
      const rawDate = versionMatch[2];
      const date = formatDate(rawDate);
      currentVersion = {
        version: versionMatch[1],
        date,
        entries: [],
      };
      currentCategory = null;
      continue;
    }

    // Skip [Unreleased] header
    if (/^## \[Unreleased\]/i.test(line)) {
      if (currentVersion && currentVersion.entries.length > 0) {
        versions.push(currentVersion);
      }
      currentVersion = null;
      currentCategory = null;
      continue;
    }

    // Match section header: ### Added, ### Changed, ### Fixed, ### Performance
    const sectionMatch = line.match(/^### (\w+)/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].toLowerCase();
      currentCategory = SECTION_MAP[sectionName] || null;
      continue;
    }

    // Match entry line: - **Title** — Description
    if (
      currentVersion &&
      currentCategory &&
      (line.startsWith("- ") || line.startsWith("* "))
    ) {
      const entry = parseEntry(line, currentCategory);
      if (entry) {
        currentVersion.entries.push(entry);
      }
    }
  }

  // Push final version
  if (currentVersion && currentVersion.entries.length > 0) {
    versions.push(currentVersion);
  }

  return versions;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

export function generateChangelogModule(
  versions: ParsedVersion[],
  appVersion: string,
): string {
  const json = JSON.stringify(versions, null, 2);
  return `// Auto-generated by scripts/parse-changelog.ts — do not edit
import type { ChangelogEntry } from "@/types/changelog";

export const changelog: ChangelogEntry[] = ${json};

export const appVersion = ${JSON.stringify(appVersion)};
`;
}
