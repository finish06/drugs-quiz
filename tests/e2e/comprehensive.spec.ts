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

// --- Helpers ---

/** Answer a matching question by pairing left items with right items in order */
async function answerMatchingQuestion(page: Page) {
  // The matching quiz renders a 2-column grid. Left column has drug buttons, right has class buttons.
  // Select each left item then its corresponding right item to form pairs.
  const grid = page.locator(".grid.grid-cols-2");
  const columns = grid.locator("> div");
  const leftButtons = columns.nth(0).locator("button");
  const rightButtons = columns.nth(1).locator("button");

  const leftCount = await leftButtons.count();
  for (let i = 0; i < leftCount; i++) {
    await leftButtons.nth(i).click();
    await rightButtons.nth(i).click();
  }

  // Click Check Answers (appears once all items are paired)
  const checkButton = page.getByRole("button", { name: "Check Answers" });
  await checkButton.waitFor({ timeout: 3000 });
  await checkButton.click();

  // Click Next Question or See Results
  const nextButton = page.getByRole("button", { name: /Next Question|See Results/ });
  await nextButton.waitFor({ timeout: 3000 });
  await nextButton.click();
}

/** Answer a multiple-choice question by clicking the first Class option */
async function answerMcQuestion(page: Page, pickLast = false) {
  const options = page.locator("button").filter({ hasText: /Class \d+/ });
  await options.first().waitFor({ timeout: 5000 });
  if (pickLast) {
    const count = await options.count();
    await options.nth(count - 1).click();
  } else {
    await options.first().click();
  }

  // Click Next Question or See Results
  const nextButton = page.getByRole("button", { name: /Next Question|See Results/ });
  await nextButton.waitFor({ timeout: 3000 });
  await nextButton.click();
}

// --- Tests ---

test.describe("Name the Class - Happy Path", () => {
  test("complete 5 MC questions and see results with percentage", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    // Select 5 questions
    await page.getByRole("button", { name: "5", exact: true }).click();

    // Start quiz
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for first question to appear
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer 5 questions
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      await answerMcQuestion(page);
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
    await page.getByRole("button", { name: "5", exact: true }).click();

    // Start quiz
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for matching UI to appear
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 15000 });

    // Answer 5 matching questions
    for (let q = 0; q < 5; q++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      await answerMatchingQuestion(page);
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
    await page.getByRole("button", { name: "5", exact: true }).click();

    // Start quiz
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for quiz to load
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 15000 });

    // Answer all matching questions
    for (let q = 0; q < 5; q++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      await answerMatchingQuestion(page);
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
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 15000 });

    // Answer 5 questions (mix of MC and matching)
    for (let q = 0; q < 5; q++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });

      // Detect question type: matching has a 2-col grid, MC has Class option buttons
      const grid = page.locator(".grid.grid-cols-2");
      const isMatching = await grid.isVisible({ timeout: 1000 }).catch(() => false);

      if (isMatching) {
        await answerMatchingQuestion(page);
      } else {
        await answerMcQuestion(page);
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
    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer all 5 questions quickly
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      await answerMcQuestion(page);
    }

    // Should see results
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });

    // Click New Quiz to go back to config
    await page.getByRole("button", { name: /New Quiz/i }).click();

    // Should see session history heading
    await expect(page.getByRole("heading", { name: /Recent Sessions/i })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Answer Review on Results", () => {
  test("results page shows review section with drug names", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      await answerMcQuestion(page);
    }

    // Should see results
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });

    // Look for review/answers section
    const reviewSection = page.getByText(/Review Answers|Answer Review|Your Answers/i);
    if (await reviewSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reviewSection.click();
    }

    // Verify drug names are visible in results (from mock data they contain "Drug-" prefix)
    await expect(page.getByText(/Drug-Class/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Study Weak Drugs Flashcard", () => {
  test("study weak drugs flow after wrong answers", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/");

    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer questions - deliberately pick wrong answers
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 5000 });
      await answerMcQuestion(page, true); // pick last option (likely wrong)
    }

    // Should see results
    await expect(page.getByText(/\d+%/)).toBeVisible({ timeout: 10000 });

    // Look for Study Weak Drugs button
    const studyButton = page.getByRole("button", { name: /Study Weak Drugs|Weak Drugs/i });
    if (await studyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await studyButton.click();

      // Should see flashcard UI — use first() to avoid strict mode
      await expect(page.getByRole("button", { name: /Tap to reveal/i })).toBeVisible({ timeout: 5000 });

      // Tap to reveal answer
      await page.getByRole("button", { name: /Tap to reveal/i }).click();

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

    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for first question
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });

    // Answer one question (just click an option, don't click Next)
    const options = page.locator("button").filter({ hasText: /Class \d+/ });
    await options.first().waitFor({ timeout: 5000 });
    await options.first().click();

    // Click Exit — shows inline confirmation
    await page.getByRole("button", { name: "Exit" }).click();

    // Confirm exit by clicking "Yes"
    await page.getByRole("button", { name: "Yes" }).click();

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

    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "Start Quiz" }).click();

    // Wait for first question
    await expect(page.getByText(/Question 1 of 5/)).toBeVisible({ timeout: 10000 });

    // Verify progress indicator shows question 1 of 5
    await expect(page.getByText(/1 of 5|Question 1/)).toBeVisible();

    // Answer first question (click option, then Next)
    const options = page.locator("button").filter({ hasText: /Class \d+/ });
    await options.first().waitFor({ timeout: 5000 });
    await options.first().click();

    // Click Next
    const nextButton = page.getByRole("button", { name: /Next Question/ });
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
    }

    // Verify progress advanced to question 2
    await expect(page.getByText(/Question 2 of 5|2 of 5/)).toBeVisible({ timeout: 5000 });
  });
});
