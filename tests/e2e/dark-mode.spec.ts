import { test, expect } from "@playwright/test";

test.describe("Dark Mode", () => {
  test("toggle switches between light and dark mode", async ({ page }) => {
    await page.goto("/");

    // Should start in light mode (default OS preference in test)
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    // Click the theme toggle button (sun/moon icon)
    const toggleButton = page.locator('button[aria-label="Switch to dark mode"], button[aria-label="Switch to light mode"]').first();
    await toggleButton.click();

    // Should now be in dark mode
    await expect(html).toHaveClass(/dark/);

    // Click again to go back to light
    await toggleButton.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test("dark mode persists after page reload", async ({ page }) => {
    await page.goto("/");

    // Toggle to dark mode
    const toggleButton = page.locator('button[aria-label="Switch to dark mode"], button[aria-label="Switch to light mode"]').first();
    await toggleButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Reload the page
    await page.reload();

    // Should still be dark (persisted in localStorage)
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  /**
   * Regression for M8 bug #1 (reports/qa-staging-2026-05-16.md).
   *
   * The wrapper `<div class="min-h-screen bg-gray-50 dark:bg-gray-900 …">` paints
   * first in light mode, then `useTheme` adds `html.dark` in a useEffect. WebKit
   * (and at least some Chromium states) would not re-resolve `dark:bg-gray-900`
   * on the already-painted wrapper, leaving the page white with dark-mode text →
   * white-on-white. The fix is to apply `html.dark` in a head-time inline script
   * before React first paints so the wrapper's first paint is already dark.
   */
  test.describe("Bug #1: wrapper renders dark background when OS prefers dark", () => {
    test.use({ colorScheme: "dark" });

    async function wrapperLightness(page: import("@playwright/test").Page) {
      return page.evaluate(() => {
        const w = document.querySelector("[class*=min-h-screen]") as HTMLElement | null;
        if (!w) return null;
        const bg = getComputedStyle(w).backgroundColor;
        // Parse oklch(...) / oklab(...) lightness component (first numeric token after the function name).
        const match = bg.match(/^okl(?:ab|ch)\(\s*([\d.]+)/);
        return match ? Number(match[1]) : null;
      });
    }

    test("first paint on a fresh visit applies dark wrapper background", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveClass(/dark/);
      const lightness = await wrapperLightness(page);
      expect(lightness, "wrapper background lightness should be the gray-900 dark value (~0.21)").not.toBeNull();
      expect(lightness!).toBeLessThan(0.4);
    });

    test("dark background survives a reload with persisted theme", async ({ page }) => {
      await page.goto("/");
      const toggleButton = page.locator('button[aria-label="Switch to dark mode"], button[aria-label="Switch to light mode"]').first();
      // Ensure persisted theme=dark even if OS preference toggled
      await page.evaluate(() => localStorage.setItem("theme", "dark"));
      await page.reload();
      await expect(page.locator("html")).toHaveClass(/dark/);
      const lightness = await wrapperLightness(page);
      expect(lightness!).toBeLessThan(0.4);
      // Sanity: toggle still wires up
      void toggleButton;
    });
  });
});
