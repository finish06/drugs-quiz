import { test, expect } from "@playwright/test";

test.describe("Dark Mode", () => {
  test("toggle switches between light and dark mode", async ({ page }) => {
    await page.goto("/");

    // Should start in light mode (default OS preference in test)
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    // Click the theme toggle button (sun/moon icon)
    const toggleButton = page.locator("button").filter({ has: page.locator("svg") }).first();
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
    const toggleButton = page.locator("button").filter({ has: page.locator("svg") }).first();
    await toggleButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Reload the page
    await page.reload();

    // Should still be dark (persisted in localStorage)
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
