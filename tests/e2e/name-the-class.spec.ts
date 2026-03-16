import { test, expect } from "@playwright/test";

test.describe("Name the Class Quiz", () => {
  test("completes a full Name the Class quiz session", async ({ page }) => {
    await page.goto("/");

    // Select Name the Class (default) with 5 questions
    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByText("Start Quiz").click();

    // Wait for loading to finish and question to appear
    await expect(page.getByText("What class does this drug belong to?")).toBeVisible({
      timeout: 15000,
    });

    // Should show a drug name and 4 options
    const questionText = page.getByText("Question 1 of 5");
    await expect(questionText).toBeVisible();

    // Click the first option (we don't know which is correct)
    const options = page.locator("button").filter({ hasNotText: /Exit|Next|See Results|Start/ });
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(4);

    // Answer the first question
    await options.first().click();

    // Should show Next Question button
    await expect(page.getByText("Next Question")).toBeVisible();
    await page.getByText("Next Question").click();

    // Should show Question 2
    await expect(page.getByText("Question 2 of 5")).toBeVisible({ timeout: 5000 });
  });
});
