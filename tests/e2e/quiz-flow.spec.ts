import { test, expect } from "@playwright/test";

test.describe("Quiz Flow", () => {
  test("shows the home screen with quiz configuration", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("drugs-quiz")).toBeVisible();
    await expect(page.getByText("Name the Class")).toBeVisible();
    await expect(page.getByText("Match Drug to Class")).toBeVisible();
    await expect(page.getByText("Brand/Generic Match")).toBeVisible();
    await expect(page.getByText("Start Quiz")).toBeVisible();
  });

  test("Name the Class is selected by default", async ({ page }) => {
    await page.goto("/");

    const nameTheClass = page.getByText("Name the Class").locator("..");
    await expect(nameTheClass).toHaveAttribute("aria-pressed", "true");
  });

  test("can select a different quiz type", async ({ page }) => {
    await page.goto("/");

    await page.getByText("Match Drug to Class").click();
    const matchDrug = page.getByText("Match Drug to Class").locator("..");
    await expect(matchDrug).toHaveAttribute("aria-pressed", "true");
  });

  test("can select a different question count", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "20" }).click();
    await expect(page.getByRole("button", { name: "20" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("shows loading state after starting quiz", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Start Quiz").click();

    // Should show either loading or a question (depends on API speed)
    await expect(
      page.getByText("Generating questions...").or(page.getByText("What class")),
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows Exit button during quiz", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Start Quiz").click();

    await expect(page.getByText("Exit")).toBeVisible({ timeout: 10000 });
  });

  test("Exit returns to config screen", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Start Quiz").click();

    await page.getByText("Exit").click({ timeout: 10000 });
    await expect(page.getByText("Start Quiz")).toBeVisible();
  });
});
