/**
 * E2E tests for achievements & badges feature.
 * Spec: specs/achievements-badges.md
 * TC-001: First Quiz + badge toast
 * TC-002: Stacked unlocks (multiple badges in one session)
 * TC-005: Guest → auth migration
 *
 * NOTE: These tests require a running local server with a seeded test DB.
 * They are written as "skip" stubs for CI; run manually against docker-compose.
 */

import { test, expect } from "@playwright/test";

test.describe("TC-001: First quiz badge unlock toast", () => {
  test.skip("shows badge unlock toast after completing first quiz (requires auth)", async ({ page }) => {
    // Pre-condition: authenticated user with 0 prior sessions
    await page.goto("/");

    // Complete a 5-question Name the Class quiz
    await page.getByRole("button", { name: /name the class/i }).click();
    // Select 5 questions
    await page.getByRole("button", { name: "5" }).click();
    await page.getByRole("button", { name: /start quiz/i }).click();

    // Answer all questions (answers don't matter for badge unlock)
    for (let i = 0; i < 5; i++) {
      const options = page.locator("[data-testid='answer-option'], button[class*='option']");
      await options.first().click();
      await page.waitForTimeout(600);
    }

    // Badge toast should appear after results load
    await expect(page.getByRole("status")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/first quiz/i)).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/achievements/step-01-badge-toast-first-quiz.png", fullPage: true });
  });
});

test.describe("TC-002: Stacked badge unlocks (seeded at 99 questions)", () => {
  test.skip("shows multiple badge toasts when centurion + first-quiz unlock in same session", async ({ page }) => {
    // Pre-condition: authenticated user with 99 prior correct answers (seeded)
    await page.goto("/");

    // Complete a 10-question quiz to hit 100 correct and unlock Centurion
    await page.getByRole("button", { name: /name the class/i }).click();
    await page.getByRole("button", { name: "10" }).click();
    await page.getByRole("button", { name: /start quiz/i }).click();

    // Answer all 10 questions
    for (let i = 0; i < 10; i++) {
      const options = page.locator("[data-testid='answer-option'], button[class*='option']");
      await options.first().click();
      await page.waitForTimeout(600);
    }

    // Multiple badges should appear in toast
    await expect(page.getByRole("status")).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: "tests/screenshots/achievements/step-02-stacked-badge-unlocks.png", fullPage: true });
  });
});

test.describe("TC-005: Guest to authenticated badge migration", () => {
  test.skip("migrates localStorage guest badges to server on sign-in", async ({ page }) => {
    // Pre-condition: unauthenticated user
    await page.goto("/");

    // Complete a quiz as guest
    await page.getByRole("button", { name: /start quiz/i }).click();
    for (let i = 0; i < 5; i++) {
      const options = page.locator("[data-testid='answer-option'], button[class*='option']");
      await options.first().click();
      await page.waitForTimeout(600);
    }

    // Guest badge should be in localStorage
    const guestBadge = await page.evaluate(() => {
      const raw = localStorage.getItem("rxdrill:achievements:v1");
      return raw ? JSON.parse(raw) : null;
    });
    expect(guestBadge).not.toBeNull();

    // Simulate sign-in (would trigger migration in AuthContext)
    // Verify localStorage cleared after migration
    // NOTE: Full OAuth flow cannot be automated here — manual verification required
    // This test documents the expected behavior

    await page.screenshot({ path: "tests/screenshots/achievements/step-05-guest-migration-prep.png", fullPage: true });
  });
});
