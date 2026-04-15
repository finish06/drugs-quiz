import { describe, it, expect } from "vitest";
import { BADGE_CATALOG, VALID_BADGE_IDS, getBadge } from "./badges";

/**
 * AC-001: Five launch badges exist in a static catalog with required fields.
 */
describe("AC-001: badge catalog", () => {
  it("should contain exactly 5 badges", () => {
    expect(BADGE_CATALOG).toHaveLength(5);
  });

  it("should include 'first-quiz' badge", () => {
    const badge = BADGE_CATALOG.find((b) => b.id === "first-quiz");
    expect(badge).toBeDefined();
    expect(badge!.name).toBe("First Quiz");
    expect(badge!.icon).toBe("Trophy");
  });

  it("should include 'perfect-score' badge", () => {
    const badge = BADGE_CATALOG.find((b) => b.id === "perfect-score");
    expect(badge).toBeDefined();
    expect(badge!.name).toBe("Perfect Score");
    expect(badge!.icon).toBe("Target");
  });

  it("should include 'class-master' badge", () => {
    const badge = BADGE_CATALOG.find((b) => b.id === "class-master");
    expect(badge).toBeDefined();
    expect(badge!.name).toBe("Class Master");
    expect(badge!.icon).toBe("Award");
  });

  it("should include 'centurion' badge", () => {
    const badge = BADGE_CATALOG.find((b) => b.id === "centurion");
    expect(badge).toBeDefined();
    expect(badge!.name).toBe("Centurion");
    expect(badge!.icon).toBe("Medal");
  });

  it("should include 'streak-seeker' badge", () => {
    const badge = BADGE_CATALOG.find((b) => b.id === "streak-seeker");
    expect(badge).toBeDefined();
    expect(badge!.name).toBe("Streak Seeker");
    expect(badge!.icon).toBe("Flame");
  });

  it("every badge should have id, name, description, criteria, and icon", () => {
    for (const badge of BADGE_CATALOG) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.criteria).toBeTruthy();
      expect(badge.icon).toBeTruthy();
    }
  });

  it("VALID_BADGE_IDS should contain all 5 badge ids", () => {
    expect(VALID_BADGE_IDS.size).toBe(5);
    expect(VALID_BADGE_IDS.has("first-quiz")).toBe(true);
    expect(VALID_BADGE_IDS.has("perfect-score")).toBe(true);
    expect(VALID_BADGE_IDS.has("class-master")).toBe(true);
    expect(VALID_BADGE_IDS.has("centurion")).toBe(true);
    expect(VALID_BADGE_IDS.has("streak-seeker")).toBe(true);
  });

  it("getBadge should return correct badge by id", () => {
    const badge = getBadge("centurion");
    expect(badge).toBeDefined();
    expect(badge!.id).toBe("centurion");
  });

  it("getBadge should return undefined for unknown id", () => {
    expect(getBadge("unknown")).toBeUndefined();
  });
});
