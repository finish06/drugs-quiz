/**
 * Convert a drug or class name to Title Case.
 *
 * Each word (split on spaces) is capitalised per hyphen-segment:
 *   "eptinezumab-jjmr" → "Eptinezumab-Jjmr"
 *   "SIMVASTATIN"      → "Simvastatin"
 */
export function toTitleCase(text: string): string {
  if (text === "") return "";

  return text
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
        .join("-"),
    )
    .join(" ");
}
