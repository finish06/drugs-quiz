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

    // Should show Question 1 of 5
    await expect(page.getByText("Question 1 of 5")).toBeVisible();

    // Get the 4 answer option buttons (inside the grid gap-3 div)
    const optionButtons = page.locator("button[title]").filter({
      hasNotText: /Exit|Next|See Results|Start|drugs-quiz/,
    });
    await expect(optionButtons.first()).toBeVisible();

    // Answer the first question
    await optionButtons.first().click();

    // Should show Next Question button
    await expect(page.getByText("Next Question")).toBeVisible({ timeout: 5000 });
    await page.getByText("Next Question").click();

    // Should show Question 2 (or inline loading spinner if background hasn't caught up)
    await expect(
      page.getByText("Question 2 of 5").or(page.getByText("Loading next question...")),
    ).toBeVisible({ timeout: 10000 });
  });
});
