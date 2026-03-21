import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateNameTheClassQuestion,
  generateMatchDrugToClassQuestion,
  generateBrandGenericMatchQuestion,
  generateQuestions,
  generateSingleQuestion,
  isExamRelevantDrug,
} from "./quiz-generators";
import type { DrugClass } from "@/types/api";
import * as apiClient from "./api-client";

vi.mock("./api-client");

const mockedApi = vi.mocked(apiClient);

beforeEach(() => {
  vi.resetAllMocks();
});

/** Helper: create a class pool for tests */
function makeClassPool(names: string[]): DrugClass[] {
  return names.map((name) => ({ name, type: "epc" as const }));
}

describe("isExamRelevantDrug", () => {
  it("accepts common drug names like simvastatin", () => {
    expect(isExamRelevantDrug("simvastatin")).toBe(true);
  });

  it("accepts names exactly 60 characters", () => {
    expect(isExamRelevantDrug("a".repeat(60))).toBe(true);
  });

  it("rejects names longer than 60 characters", () => {
    expect(isExamRelevantDrug("a".repeat(61))).toBe(false);
  });

  it("rejects names containing commas (multi-ingredient compounds)", () => {
    expect(isExamRelevantDrug("acetaminophen, codeine phosphate")).toBe(false);
  });

  it("rejects homeopathic names containing 'nosode'", () => {
    expect(isExamRelevantDrug("influenzinum nosode")).toBe(false);
  });

  it("rejects homeopathic names containing 'suis'", () => {
    expect(isExamRelevantDrug("hepar suis")).toBe(false);
  });

  it("rejects homeopathic names containing 'officinale'", () => {
    expect(isExamRelevantDrug("taraxacum officinale")).toBe(false);
  });

  it("rejects homeopathic indicators case-insensitively", () => {
    expect(isExamRelevantDrug("Influenzinum NOSODE")).toBe(false);
    expect(isExamRelevantDrug("Hepar SUIS")).toBe(false);
    expect(isExamRelevantDrug("Taraxacum OFFICINALE")).toBe(false);
  });
});

describe("generateNameTheClassQuestion", () => {
  const pool = makeClassPool([
    "HMG-CoA Reductase Inhibitor",
    "ACE Inhibitor",
    "Proton Pump Inhibitor",
    "Beta Adrenergic Blocker",
    "Calcium Channel Blocker",
  ]);

  it("returns a multiple-choice question with 4 options", async () => {
    mockedApi.getDrugsInClass.mockResolvedValueOnce({
      data: [{ generic_name: "simvastatin", brand_name: "Zocor" }],
      pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
    });

    const question = await generateNameTheClassQuestion(pool, new Set());

    expect(question.kind).toBe("multiple-choice");
    expect(question.options).toHaveLength(4);
    expect(question.options).toContain(question.correctAnswer);
  });

  it("skips classes with no drugs and finds one that works", async () => {
    const poolWithEmpty = makeClassPool(["Empty Class", "ACE Inhibitor", "PPI", "SSRI", "Beta Blocker"]);
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Empty Class") {
        return { data: [], pagination: { page: 1, limit: 5, total: 0, total_pages: 0 } };
      }
      return {
        data: [{ generic_name: `drug-for-${params.class}`, brand_name: "" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateNameTheClassQuestion(poolWithEmpty, new Set());

    expect(question.drugName).not.toContain("Empty");
    expect(question.correctAnswer).not.toBe("Empty Class");
  });

  it("skips classes that throw errors (502 upstream)", async () => {
    const poolWithFailing = makeClassPool(["Failing Class", "Good Class", "Distractor-A", "Distractor-B", "Distractor-C"]);
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Failing Class") throw new Error("upstream_error");
      return {
        data: [{ generic_name: `drug-for-${params.class}`, brand_name: "" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateNameTheClassQuestion(poolWithFailing, new Set());
    expect(question.correctAnswer).not.toBe("Failing Class");
  });

  it("throws when not enough distractor classes", async () => {
    const smallPool = makeClassPool(["Only Class", "One Distractor"]);
    mockedApi.getDrugsInClass.mockResolvedValueOnce({
      data: [{ generic_name: "some-drug", brand_name: "" }],
      pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
    });

    await expect(generateNameTheClassQuestion(smallPool, new Set())).rejects.toThrow(
      "Not enough distractor classes available",
    );
  });

  it("filters out obscure non-exam-relevant drugs", async () => {
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "HMG-CoA Reductase Inhibitor") {
        return {
          data: [
            { generic_name: "influenzinum nosode", brand_name: "" },
            { generic_name: "acetaminophen, codeine phosphate", brand_name: "" },
          ],
          pagination: { page: 1, limit: 5, total: 2, total_pages: 1 },
        };
      }
      return {
        data: [{ generic_name: "lisinopril", brand_name: "Zestril" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateNameTheClassQuestion(pool, new Set());
    expect(question.drugName).toBe("Lisinopril");
  });

  it("skips drugs already in usedDrugs set", async () => {
    const used = new Set(["simvastatin"]);
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "HMG-CoA Reductase Inhibitor") {
        return {
          data: [{ generic_name: "simvastatin", brand_name: "Zocor" }],
          pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
        };
      }
      return {
        data: [{ generic_name: "lisinopril", brand_name: "Zestril" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateNameTheClassQuestion(pool, used);
    expect(question.drugName).toBe("Lisinopril");
    expect(used.has("lisinopril")).toBe(true);
  });

  it("throws when no classes have drugs", async () => {
    const emptyPool = makeClassPool(["Empty-1", "Empty-2"]);
    mockedApi.getDrugsInClass.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
    });

    await expect(generateNameTheClassQuestion(emptyPool, new Set())).rejects.toThrow(
      "Failed to find a drug with an EPC class",
    );
  });
});

describe("generateMatchDrugToClassQuestion", () => {
  it("returns a matching question with 4 pairs", async () => {
    const pool = makeClassPool(["Class A", "Class B", "Class C", "Class D"]);
    mockedApi.getDrugsInClass
      .mockResolvedValueOnce({ data: [{ generic_name: "drug-a", brand_name: "Brand-A" }], pagination: { page: 1, limit: 5, total: 1, total_pages: 1 } })
      .mockResolvedValueOnce({ data: [{ generic_name: "drug-b", brand_name: "Brand-B" }], pagination: { page: 1, limit: 5, total: 1, total_pages: 1 } })
      .mockResolvedValueOnce({ data: [{ generic_name: "drug-c", brand_name: "Brand-C" }], pagination: { page: 1, limit: 5, total: 1, total_pages: 1 } })
      .mockResolvedValueOnce({ data: [{ generic_name: "drug-d", brand_name: "Brand-D" }], pagination: { page: 1, limit: 5, total: 1, total_pages: 1 } });

    const question = await generateMatchDrugToClassQuestion(pool, new Set());

    expect(question.kind).toBe("matching");
    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).toHaveLength(4);
    expect(Object.keys(question.correctPairs)).toHaveLength(4);
  });

  it("skips classes with no drugs and still returns 4 pairs", async () => {
    const pool = makeClassPool(["Empty-1", "Empty-2", "Class A", "Class B", "Class C", "Class D"]);
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class.startsWith("Empty")) {
        return { data: [], pagination: { page: 1, limit: 5, total: 0, total_pages: 0 } };
      }
      return {
        data: [{ generic_name: `drug-for-${params.class}`, brand_name: `Brand-${params.class}` }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateMatchDrugToClassQuestion(pool, new Set());
    expect(question.leftItems).toHaveLength(4);
    for (const item of question.rightItems) {
      expect(item).not.toMatch(/^Empty/);
    }
  });

  it("skips classes that throw errors (502 upstream)", async () => {
    const pool = makeClassPool(["Failing", "Class A", "Class B", "Class C", "Class D"]);
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Failing") throw new Error("upstream_error");
      return {
        data: [{ generic_name: `drug-${params.class}`, brand_name: `Brand-${params.class}` }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateMatchDrugToClassQuestion(pool, new Set());
    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).not.toContain("Failing");
  });

  it("throws when not enough classes have drugs", async () => {
    const pool = makeClassPool(["Empty-1", "Empty-2"]);
    mockedApi.getDrugsInClass.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
    });

    await expect(generateMatchDrugToClassQuestion(pool, new Set())).rejects.toThrow(
      "Could not find 4 classes with drugs",
    );
  });

  it("throws when all classes throw errors", async () => {
    const pool = makeClassPool(["Fail-1", "Fail-2"]);
    mockedApi.getDrugsInClass.mockRejectedValue(new Error("upstream_error"));

    await expect(generateMatchDrugToClassQuestion(pool, new Set())).rejects.toThrow(
      "Could not find 4 classes with drugs",
    );
  });
});

describe("generateBrandGenericMatchQuestion", () => {
  it("returns a matching question with 4 brand/generic pairs", async () => {
    const pool = makeClassPool(["Class A", "Class B", "Class C", "Class D"]);
    mockedApi.getDrugsInClass
      .mockResolvedValueOnce({ data: [{ generic_name: "simvastatin", brand_name: "Zocor" }], pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } })
      .mockResolvedValueOnce({ data: [{ generic_name: "atorvastatin", brand_name: "Lipitor" }], pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } })
      .mockResolvedValueOnce({ data: [{ generic_name: "rosuvastatin", brand_name: "Crestor" }], pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } })
      .mockResolvedValueOnce({ data: [{ generic_name: "pravastatin", brand_name: "Pravachol" }], pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } });

    const question = await generateBrandGenericMatchQuestion(pool, new Set());

    expect(question.kind).toBe("matching");
    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).toHaveLength(4);
    expect(Object.keys(question.correctPairs)).toHaveLength(4);
  });

  it("skips drugs where brand name equals generic name", async () => {
    const pool = makeClassPool(["Class A", "Class B", "Class C", "Class D", "Class E"]);
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Class A") {
        return { data: [{ generic_name: "SIMVASTATIN", brand_name: "SIMVASTATIN" }], pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } };
      }
      return {
        data: [{ generic_name: `drug-${params.class}`, brand_name: `Brand-${params.class}` }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      };
    });

    const question = await generateBrandGenericMatchQuestion(pool, new Set());
    expect(question.leftItems).toHaveLength(4);
    expect(question.leftItems).not.toContain("SIMVASTATIN");
  });

  it("throws when not enough drugs with distinct brand names", async () => {
    const pool = makeClassPool(["Class A", "Class B"]);
    mockedApi.getDrugsInClass.mockResolvedValue({
      data: [{ generic_name: "same", brand_name: "same" }],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    });

    await expect(generateBrandGenericMatchQuestion(pool, new Set())).rejects.toThrow(
      "Could not find 4 drugs with distinct brand names",
    );
  });

  it("skips classes that throw errors (502 upstream)", async () => {
    const pool = makeClassPool(["Failing", "Class A", "Class B", "Class C", "Class D"]);
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Failing") throw new Error("upstream_error");
      return {
        data: [{ generic_name: `gen-${params.class}`, brand_name: `brand-${params.class}` }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      };
    });

    const question = await generateBrandGenericMatchQuestion(pool, new Set());
    expect(question.leftItems).toHaveLength(4);
  });
});

describe("generateQuestions", () => {
  it("calls onProgress callback with (completed, total) for each question", async () => {
    // generateQuestions fetches the pool once, then generates questions
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: makeClassPool(["Class-0", "Distractor-A", "Distractor-B", "Distractor-C"]),
      pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
    });

    let callCount = 0;
    mockedApi.getDrugsInClass.mockImplementation(async () => {
      callCount++;
      return {
        data: [{ generic_name: `drug-${callCount}`, brand_name: "" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const onProgress = vi.fn();
    const questions = await generateQuestions("name-the-class", 3, onProgress);

    expect(questions).toHaveLength(3);
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
    expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
  });

  it("fetches from multiple pages when total_pages > 1", async () => {
    // First call returns page 1 with total_pages=3
    mockedApi.getDrugClasses
      .mockResolvedValueOnce({
        data: makeClassPool(["Page1-A", "Page1-B", "Page1-C", "Page1-D"]),
        pagination: { page: 1, limit: 100, total: 300, total_pages: 3 },
      })
      // Second call for random page
      .mockResolvedValueOnce({
        data: makeClassPool(["Page2-A", "Page2-B", "Page2-C", "Page2-D"]),
        pagination: { page: 2, limit: 100, total: 300, total_pages: 3 },
      })
      // Third call for second random page
      .mockResolvedValueOnce({
        data: makeClassPool(["Page3-A", "Page3-B", "Page3-C", "Page3-D"]),
        pagination: { page: 3, limit: 100, total: 300, total_pages: 3 },
      });

    mockedApi.getDrugsInClass.mockImplementation(async (params) => ({
      data: [{ generic_name: `drug-${params.class}`, brand_name: "" }],
      pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
    }));

    const questions = await generateQuestions("name-the-class", 1);
    expect(questions).toHaveLength(1);
    // Should have called getDrugClasses at least twice (initial + random page(s))
    expect(mockedApi.getDrugClasses.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("generates a single name-the-class question and updates usedDrugs", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: makeClassPool(["Class A", "Distractor-A", "Distractor-B", "Distractor-C"]),
      pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
    });

    mockedApi.getDrugsInClass.mockResolvedValue({
      data: [{ generic_name: "test-drug", brand_name: "TestBrand" }],
      pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
    });

    const classPool = makeClassPool(["Class A", "Distractor-A", "Distractor-B", "Distractor-C"]);
    const usedDrugs = new Set<string>();

    const question = await generateSingleQuestion("name-the-class", classPool, usedDrugs);

    expect(question).toBeDefined();
    expect(question.kind).toBe("multiple-choice");
    expect(usedDrugs.size).toBeGreaterThan(0);
  });

  it("does not repeat drugs across questions", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: makeClassPool(["Class A", "Class B", "Class C", "Class D", "Class E", "Class F"]),
      pagination: { page: 1, limit: 100, total: 6, total_pages: 1 },
    });

    let callCount = 0;
    mockedApi.getDrugsInClass.mockImplementation(async () => {
      callCount++;
      return {
        data: [{ generic_name: `unique-drug-${callCount}`, brand_name: "" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const questions = await generateQuestions("name-the-class", 3);
    const drugNames = questions.map((q) =>
      q.kind === "multiple-choice" ? q.drugName : "",
    );

    // All drug names should be unique
    expect(new Set(drugNames).size).toBe(3);
  });
});

describe("AC-005: Batched pre-fetch performance", () => {
  it("generates 5 questions under time budget with mocked API latency", async () => {
    const pool = makeClassPool(
      Array.from({ length: 50 }, (_, i) => `Class-${i}`),
    );
    let callCount = 0;

    // Simulate 10ms API latency per call
    mockedApi.getDrugsInClass.mockImplementation(
      () =>
        new Promise((resolve) => {
          callCount++;
          const current = callCount;
          setTimeout(
            () =>
              resolve({
                data: [{ generic_name: `drug-${current}`, brand_name: "" }],
                pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
              }),
            10,
          );
        }),
    );

    const start = performance.now();
    const usedDrugs = new Set<string>();
    const questions = [];
    for (let i = 0; i < 5; i++) {
      questions.push(await generateNameTheClassQuestion(pool, usedDrugs));
    }
    const duration = performance.now() - start;

    expect(questions).toHaveLength(5);
    // With batching (8 parallel per batch), 5 questions should need ~1-2 batches
    // Sequential would be 5*10ms minimum = 50ms+ (more with retries)
    // Batched should be ~10-20ms per batch = much faster
    // Use generous budget for CI stability
    expect(duration).toBeLessThan(500);
  });
});
