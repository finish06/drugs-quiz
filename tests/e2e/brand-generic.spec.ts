import { test, expect } from "@playwright/test";

test.describe("Brand/Generic Match Quiz", () => {
  test("loads and displays a brand/generic matching question", async ({ page }) => {
    await page.goto("/");

    // Select Brand/Generic Match
    await page.getByText("Brand/Generic Match").click();
    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByText("Start Quiz").click();

    // Wait for question to load (may take a while scanning classes)
    await expect(
      page.getByText("Match each item on the left with its pair on the right"),
    ).toBeVisible({ timeout: 30000 });

    // Should show Generic and Brand labels
    await expect(page.getByText("Generic")).toBeVisible();
    await expect(page.getByText("Brand")).toBeVisible();

    // Should show Question 1 of 5
    await expect(page.getByText("Question 1 of 5")).toBeVisible();
  });
});
