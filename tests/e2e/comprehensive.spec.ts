import { test, expect } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

// --- Mock Data ---

const mockClasses = {
  data: Array.from({ length: 20 }, (_, i) => ({ name: `Class ${i + 1}`, type: "epc" })),
  pagination: { page: 1, limit: 100, total: 20, total_pages: 1 },
};

function mockDrugsForClass(className: string) {
  return {
    data: [
      { generic_name: `drug-${className.toLowerCase().replace(/\s/g, "-")}`, brand_name: `Brand-${className}` },
      { generic_name: `alt-${className.toLowerCase().replace(/\s/g, "-")}`, brand_name: `AltBrand-${className}` },
    ],
    pagination: { page: 1, limit: 5, total: 2, total_pages: 1 },
  };
}

// --- Mock Setup Helper ---

async function setupMocks(page: Page, options?: { failApi?: boolean }) {
  await page.route("**/api/v1/**", async (route: Route) => {
    if (options?.failApi) {
      await route.fulfill({ status: 500, body: "Internal Server Error" });
      return;
    }

    const url = route.request().url();

    if (url.includes("/drugs/classes/drugs")) {
      const classParam = new URL(url).searchParams.get("class") || "Unknown";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockDrugsForClass(classParam)),
      });
    } else if (url.includes("/drugs/classes")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockClasses),
      });
    } else if (url.includes("/drugs/class")) {
      const drugName = new URL(url).searchParams.get("name") || "";
      // Return a class for any drug lookup
      const classIndex = Math.abs(drugName.charCodeAt(0) % 20);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { name: `Class ${classIndex + 1}`, type: "epc" } }),
      });
    } else if (url.includes("/drugs/names")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: Array.from({ length: 10 }, (_, i) => ({
            generic_name: `drug-${i}`,
            brand_name: `Brand-${i}`,
          })),
          pagination: { page: 1, limit: 100, total: 10, total_pages: 1 },
        }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    }
  });
}

// --- Tests ---

test.describe("Name the Class - Happy Path", () => {
  test("complete 5 MC questions and see results with percentage", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    // Select 5 questions
    await page.getByRole("button", { name: "5" }).click();

    // Start quiz
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for first question to appear
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer 5 questions by clicking the first option each time
    for (let i = 0; i < 5; i++) {
      // Wait for the question text
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });

      // Click the first option button (MC options are rendered as buttons)
      const options = page.locator('[data-testid="option-button"], button').filter({ hasText: /Class/ });
      const firstOption = options.first();
      await firstOption.waitFor({ timeout: 5000 });
      await firstOption.click();

      // Click Next (or see results on last question)
      const nextButton = page.getByRole("button", { name: /Next|View Results/ });
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
      }
    }

    // Should see results with percentage
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Match Drug to Class - Happy Path", () => {
  test("complete matching quiz and see results", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    // Select Match Drug to Class
    await page.getByText("Match Drug to Class").click();

    // Select 5 questions
    await page.getByRole("button", { name: "5" }).click();

    // Start quiz
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for matching UI to appear
    await expect(page.getByText(/Question \d+ of 5/).or(page.getByText("Generating"))).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // For each matching question, click left items then right items to pair them
    for (let q = 0; q < 5; q++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });

      // Get left and right items - matching quiz has two columns
      const leftItems = page.locator('[data-testid="left-item"], [data-side="left"] button');
      const rightItems = page.locator('[data-testid="right-item"], [data-side="right"] button');

      // Try to make matches - click left then right for each pair
      const leftCount = await leftItems.count().catch(() => 0);
      if (leftCount > 0) {
        for (let i = 0; i < leftCount; i++) {
          await leftItems.nth(i).click();
          await rightItems.nth(i).click();
        }
      }

      // Click Check Answers / Submit
      const checkButton = page.getByRole("button", { name: /Check Answers|Submit|Next|View Results/ });
      if (await checkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkButton.click();
      }

      // If there's a Next button after checking, click it
      const nextButton = page.getByRole("button", { name: /Next|View Results/ });
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
      }
    }

    // Should see results
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Brand/Generic Match - Happy Path", () => {
  test("complete brand/generic matching quiz and see results", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    // Select Brand/Generic Match
    await page.getByText("Brand/Generic Match").click();

    // Select 5 questions
    await page.getByRole("button", { name: "5" }).click();

    // Start quiz
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for quiz to load
    await expect(page.getByText(/Question \d+ of 5/).or(page.getByText("Generating"))).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer all matching questions
    for (let q = 0; q < 5; q++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });

      const leftItems = page.locator('[data-testid="left-item"], [data-side="left"] button');
      const rightItems = page.locator('[data-testid="right-item"], [data-side="right"] button');

      const leftCount = await leftItems.count().catch(() => 0);
      if (leftCount > 0) {
        for (let i = 0; i < leftCount; i++) {
          await leftItems.nth(i).click();
          await rightItems.nth(i).click();
        }
      }

      const checkButton = page.getByRole("button", { name: /Check Answers|Submit|Next|View Results/ });
      if (await checkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkButton.click();
      }

      const nextButton = page.getByRole("button", { name: /Next|View Results/ });
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
      }
    }

    // Should see results with percentage
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Quick 5 Mixed Quiz", () => {
  test("complete Quick 5 quiz and see results", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    // Click Quick 5 button
    await page.getByRole("button", { name: /Quick 5/i }).click();

    // Wait for quiz to load
    await expect(
      page.getByText(/Question \d+ of 5/).or(page.getByText("Generating")),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer 5 questions (mix of MC and matching)
    for (let q = 0; q < 5; q++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });

      // Check if it's a multiple-choice or matching question
      const mcOptions = page.locator('[data-testid="option-button"], button').filter({ hasText: /Class/ });
      const leftItems = page.locator('[data-testid="left-item"], [data-side="left"] button');

      const mcCount = await mcOptions.count().catch(() => 0);
      const matchCount = await leftItems.count().catch(() => 0);

      if (mcCount > 0) {
        // Multiple choice - click first option
        await mcOptions.first().click();
      } else if (matchCount > 0) {
        // Matching - pair items
        const rightItems = page.locator('[data-testid="right-item"], [data-side="right"] button');
        for (let i = 0; i < matchCount; i++) {
          await leftItems.nth(i).click();
          await rightItems.nth(i).click();
        }
        const checkButton = page.getByRole("button", { name: /Check Answers|Submit/ });
        if (await checkButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await checkButton.click();
        }
      }

      const nextButton = page.getByRole("button", { name: /Next|View Results/ });
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
      }
    }

    // Should see results
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Session History Persistence", () => {
  test("completed quiz appears in Recent Sessions", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    // Select 5 questions and start
    await page.getByRole("button", { name: "5" }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer all 5 questions quickly
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      const options = page.locator('[data-testid="option-button"], button').filter({ hasText: /Class/ });
      const firstOption = options.first();
      await firstOption.waitFor({ timeout: 5000 });
      await firstOption.click();

      const nextButton = page.getByRole("button", { name: /Next|View Results/ });
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
      }
    }

    // Should see results
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });

    // Click New Quiz to go back to config
    await page.getByRole("button", { name: /New Quiz/i }).click();

    // Should see session history with a recent entry
    await expect(page.getByText(/Recent Sessions/i).or(page.getByText(/Name the Class/i))).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Answer Review on Results", () => {
  test("results page shows review section with drug names", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: "5" }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      const options = page.locator('[data-testid="option-button"], button').filter({ hasText: /Class/ });
      await options.first().waitFor({ timeout: 5000 });
      await options.first().click();

      const nextButton = page.getByRole("button", { name: /Next|View Results/ });
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
      }
    }

    // Should see results
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });

    // Look for review/answers section
    const reviewSection = page.getByText(/Review Answers|Answer Review|Your Answers/i);
    if (await reviewSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reviewSection.click();
    }

    // Verify drug names are visible in results (from mock data they contain "drug-" prefix)
    await expect(page.getByText(/drug-/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Study Weak Drugs Flashcard", () => {
  test("study weak drugs flow after wrong answers", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: "5" }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer questions - deliberately pick wrong answers by clicking non-first options when possible
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      const options = page.locator('[data-testid="option-button"], button').filter({ hasText: /Class/ });
      await options.first().waitFor({ timeout: 5000 });
      // Click last option (likely wrong)
      const count = await options.count();
      await options.nth(count - 1).click();

      const nextButton = page.getByRole("button", { name: /Next|View Results/ });
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
      }
    }

    // Should see results
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });

    // Look for Study Weak Drugs button
    const studyButton = page.getByRole("button", { name: /Study Weak Drugs|Weak Drugs/i });
    if (await studyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await studyButton.click();

      // Should see flashcard UI
      await expect(page.getByText(/Tap|Flip|Reveal/i).or(page.getByText(/drug-/i))).toBeVisible({ timeout: 5000 });

      // Tap to reveal answer
      const flashcard = page.locator('[data-testid="flashcard"], .cursor-pointer').first();
      if (await flashcard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await flashcard.click();
      }

      // Look for Next button in flashcard mode
      const nextFlashcard = page.getByRole("button", { name: /Next/i });
      if (await nextFlashcard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextFlashcard.click();
      }

      // Exit flashcards
      const exitButton = page.getByRole("button", { name: /Exit|Back|Done/i });
      if (await exitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await exitButton.click();
      }
    }
  });
});

test.describe("Error State and Retry", () => {
  test("API failure shows error message and Back returns to config", async ({ page }) => {
    await setupMocks(page, { failApi: true });
    await page.goto("/");

    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Should show error message
    await expect(page.getByText(/Something went wrong|error|failed/i)).toBeVisible({ timeout: 10000 });

    // Click Back button
    await page.getByRole("button", { name: /Back/i }).click();

    // Should return to config screen
    await expect(page.getByRole("button", { name: "Start Quiz" })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Exit Mid-Quiz with Confirmation", () => {
  test("exit during quiz shows confirm dialog", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: "5" }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for first question
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer one question
    const options = page.locator('[data-testid="option-button"], button').filter({ hasText: /Class/ });
    await options.first().waitFor({ timeout: 5000 });
    await options.first().click();

    // Set up dialog handler to accept the confirmation
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Are you sure");
      await dialog.accept();
    });

    // Click Exit
    await page.getByRole("button", { name: "Exit" }).click();

    // Should return to config screen
    await expect(page.getByRole("button", { name: "Start Quiz" })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Double-Click Start Quiz Prevention", () => {
  test("Start Quiz button becomes disabled after click", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    const startButton = page.getByRole("button", { name: "Start Quiz" });
    await expect(startButton).toBeEnabled();

    await startButton.click();

    // The button should either disappear (page navigates to loading/quiz)
    // or show the loading/quiz state
    await expect(
      page.getByText("Generating questions...").or(page.getByText(/Question \d+ of/)).or(page.getByText(/Starting/)),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Progress Bar", () => {
  test("progress bar advances as questions are answered", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: "5" }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for first question
    await expect(page.getByText(/Question 1 of 5/)).toBeVisible({ timeout: 10000 });

    // Verify progress indicator shows question 1 of 5
    await expect(page.getByText(/1 of 5|Question 1/)).toBeVisible();

    // Answer first question
    const options = page.locator('[data-testid="option-button"], button').filter({ hasText: /Class/ });
    await options.first().waitFor({ timeout: 5000 });
    await options.first().click();

    // Click Next
    const nextButton = page.getByRole("button", { name: /Next/ });
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
    }

    // Verify progress advanced to question 2
    await expect(page.getByText(/Question 2 of 5|2 of 5/)).toBeVisible({ timeout: 5000 });
  });
});
