import { test, expect } from "@playwright/test";

test.describe("Match Drug to Class Quiz", () => {
  test("loads and displays a matching question with drugs and classes", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");

    // Select Match Drug to Class
    await page.getByText("Match Drug to Class").click();
    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByText("Start Quiz").click();

    // Wait for question to load
    await expect(
      page.getByText("Match each item on the left with its pair on the right"),
    ).toBeVisible({ timeout: 30000 });

    // Should show Drugs and Classes labels (exact match to avoid matching drug names containing "Drugs")
    await expect(page.getByText("Drugs", { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Classes", { exact: true })).toBeVisible({ timeout: 5000 });

    // Should show Question 1 of 5
    await expect(page.getByText("Question 1 of 5")).toBeVisible();
  });
});
