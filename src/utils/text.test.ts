import { describe, it, expect } from "vitest";
import { toTitleCase } from "./text";

describe("toTitleCase", () => {
  it('converts ALL CAPS → title case ("SIMVASTATIN" → "Simvastatin")', () => {
    expect(toTitleCase("SIMVASTATIN")).toBe("Simvastatin");
  });

  it('converts lowercase → title case ("anakinra" → "Anakinra")', () => {
    expect(toTitleCase("anakinra")).toBe("Anakinra");
  });

  it('preserves already-correct title case ("Cromolyn Sodium" → "Cromolyn Sodium")', () => {
    expect(toTitleCase("Cromolyn Sodium")).toBe("Cromolyn Sodium");
  });

  it('handles hyphenated names ("eptinezumab-jjmr" → "Eptinezumab-Jjmr")', () => {
    expect(toTitleCase("eptinezumab-jjmr")).toBe("Eptinezumab-Jjmr");
  });

  it("returns empty string for empty input", () => {
    expect(toTitleCase("")).toBe("");
  });

  it('normalises class names with hyphens ("HMG-CoA Reductase Inhibitor" → "Hmg-Coa Reductase Inhibitor")', () => {
    expect(toTitleCase("HMG-CoA Reductase Inhibitor")).toBe(
      "Hmg-Coa Reductase Inhibitor",
    );
  });
});
