/**
 * Generate src/generated/changelog.ts from CHANGELOG.md.
 * Run this before type checking or building.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseChangelog, generateChangelogModule } from "./parse-changelog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const changelogPath = path.join(root, "CHANGELOG.md");
const pkgPath = path.join(root, "package.json");
const outDir = path.join(root, "src", "generated");
const outFile = path.join(outDir, "changelog.ts");

const markdown = fs.existsSync(changelogPath)
  ? fs.readFileSync(changelogPath, "utf-8")
  : "";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const versions = parseChangelog(markdown);
const module = generateChangelogModule(versions, pkg.version);

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, module);
console.log(
  `Generated changelog: ${versions.length} versions, ${versions.reduce((s, v) => s + v.entries.length, 0)} entries`,
);
