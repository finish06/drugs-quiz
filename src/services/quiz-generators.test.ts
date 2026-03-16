import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateNameTheClassQuestion,
  generateMatchDrugToClassQuestion,
  generateBrandGenericMatchQuestion,
  generateQuestions,
  isExamRelevantDrug,
} from "./quiz-generators";
import * as apiClient from "./api-client";

vi.mock("./api-client");

const mockedApi = vi.mocked(apiClient);

beforeEach(() => {
  vi.resetAllMocks();
});

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
  it("returns a multiple-choice question with 4 options", async () => {
    // Fetch EPC classes
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "HMG-CoA Reductase Inhibitor", type: "epc" },
        { name: "ACE Inhibitor", type: "epc" },
        { name: "Proton Pump Inhibitor", type: "epc" },
        { name: "Beta Adrenergic Blocker", type: "epc" },
        { name: "Calcium Channel Blocker", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 5, total_pages: 1 },
    });
    // Get a drug from the first class tried
    mockedApi.getDrugsInClass.mockResolvedValueOnce({
      data: [{ generic_name: "simvastatin", brand_name: "Zocor" }],
      pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
    });

    const question = await generateNameTheClassQuestion();

    expect(question.kind).toBe("multiple-choice");
    expect(question.options).toHaveLength(4);
    expect(question.options).toContain(question.correctAnswer);
  });

  it("skips classes with no drugs and finds one that works", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Empty Class", type: "epc" },
        { name: "ACE Inhibitor", type: "epc" },
        { name: "PPI", type: "epc" },
        { name: "SSRI", type: "epc" },
        { name: "Beta Blocker", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 5, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Empty Class") {
        return { data: [], pagination: { page: 1, limit: 5, total: 0, total_pages: 0 } };
      }
      return {
        data: [{ generic_name: `drug-for-${params.class}`, brand_name: "" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateNameTheClassQuestion();

    expect(question.drugName).not.toContain("Empty");
    expect(question.correctAnswer).not.toBe("Empty Class");
  });

  it("skips classes that throw errors (502 upstream)", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Failing Class", type: "epc" },
        { name: "Good Class", type: "epc" },
        { name: "Distractor-A", type: "epc" },
        { name: "Distractor-B", type: "epc" },
        { name: "Distractor-C", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 5, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Failing Class") {
        throw new Error("upstream_error");
      }
      return {
        data: [{ generic_name: `drug-for-${params.class}`, brand_name: "" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateNameTheClassQuestion();
    expect(question.correctAnswer).not.toBe("Failing Class");
  });

  it("throws when not enough distractor classes", async () => {
    // Only 2 classes total — after using 1 as correct, only 1 distractor (need 3)
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Only Class", type: "epc" },
        { name: "One Distractor", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 2, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockResolvedValueOnce({
      data: [{ generic_name: "some-drug", brand_name: "" }],
      pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
    });

    await expect(generateNameTheClassQuestion()).rejects.toThrow(
      "Not enough distractor classes available",
    );
  });

  it("filters out obscure non-exam-relevant drugs", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "HMG-CoA Reductase Inhibitor", type: "epc" },
        { name: "ACE Inhibitor", type: "epc" },
        { name: "PPI", type: "epc" },
        { name: "Beta Blocker", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
    });
    // First class returns only obscure drugs, second returns a real drug
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

    const question = await generateNameTheClassQuestion();
    // Should skip the obscure drugs and pick lisinopril
    expect(question.drugName).toBe("Lisinopril");
  });

  it("throws when no classes have drugs", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Empty-1", type: "epc" },
        { name: "Empty-2", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 2, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
    });

    await expect(generateNameTheClassQuestion()).rejects.toThrow(
      "Failed to find a drug with an EPC class",
    );
  });
});

describe("generateMatchDrugToClassQuestion", () => {
  it("returns a matching question with 4 pairs", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Class A", type: "epc" },
        { name: "Class B", type: "epc" },
        { name: "Class C", type: "epc" },
        { name: "Class D", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
    });

    mockedApi.getDrugsInClass
      .mockResolvedValueOnce({
        data: [{ generic_name: "drug-a", brand_name: "Brand-A" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      })
      .mockResolvedValueOnce({
        data: [{ generic_name: "drug-b", brand_name: "Brand-B" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      })
      .mockResolvedValueOnce({
        data: [{ generic_name: "drug-c", brand_name: "Brand-C" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      })
      .mockResolvedValueOnce({
        data: [{ generic_name: "drug-d", brand_name: "Brand-D" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      });

    const question = await generateMatchDrugToClassQuestion();

    expect(question.kind).toBe("matching");
    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).toHaveLength(4);
    expect(Object.keys(question.correctPairs)).toHaveLength(4);

    // Verify correct pairs exist
    for (const [drug, cls] of Object.entries(question.correctPairs)) {
      expect(question.leftItems).toContain(drug);
      expect(question.rightItems).toContain(cls);
    }
  });

  it("skips classes with no drugs and still returns 4 pairs", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Empty-1", type: "epc" },
        { name: "Empty-2", type: "epc" },
        { name: "Class A", type: "epc" },
        { name: "Class B", type: "epc" },
        { name: "Class C", type: "epc" },
        { name: "Class D", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 6, total_pages: 1 },
    });

    // The shuffle makes order unpredictable, so mock all calls.
    // Empty classes return no data, valid classes return drugs.
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class.startsWith("Empty")) {
        return { data: [], pagination: { page: 1, limit: 5, total: 0, total_pages: 0 } };
      }
      return {
        data: [{ generic_name: `drug-for-${params.class}`, brand_name: `Brand-${params.class}` }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateMatchDrugToClassQuestion();

    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).toHaveLength(4);
    // None of the empty classes should appear in results
    for (const item of question.rightItems) {
      expect(item).not.toMatch(/^Empty/);
    }
  });

  it("skips classes that throw errors (502 upstream)", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Failing", type: "epc" },
        { name: "Class A", type: "epc" },
        { name: "Class B", type: "epc" },
        { name: "Class C", type: "epc" },
        { name: "Class D", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 5, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Failing") throw new Error("upstream_error");
      return {
        data: [{ generic_name: `drug-${params.class}`, brand_name: `Brand-${params.class}` }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      };
    });

    const question = await generateMatchDrugToClassQuestion();
    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).not.toContain("Failing");
  });

  it("throws when not enough classes have drugs", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Empty-1", type: "epc" },
        { name: "Empty-2", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 2, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, total_pages: 0 },
    });

    await expect(generateMatchDrugToClassQuestion()).rejects.toThrow(
      "Could not find 4 classes with drugs",
    );
  });

  it("throws when all classes throw errors", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Fail-1", type: "epc" },
        { name: "Fail-2", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 2, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockRejectedValue(new Error("upstream_error"));

    await expect(generateMatchDrugToClassQuestion()).rejects.toThrow(
      "Could not find 4 classes with drugs",
    );
  });
});

describe("generateBrandGenericMatchQuestion", () => {
  it("returns a matching question with 4 brand/generic pairs", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Class A", type: "epc" },
        { name: "Class B", type: "epc" },
        { name: "Class C", type: "epc" },
        { name: "Class D", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
    });
    // Each class returns 1 drug with a real brand name
    mockedApi.getDrugsInClass
      .mockResolvedValueOnce({
        data: [{ generic_name: "simvastatin", brand_name: "Zocor" }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      })
      .mockResolvedValueOnce({
        data: [{ generic_name: "atorvastatin", brand_name: "Lipitor" }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      })
      .mockResolvedValueOnce({
        data: [{ generic_name: "rosuvastatin", brand_name: "Crestor" }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      })
      .mockResolvedValueOnce({
        data: [{ generic_name: "pravastatin", brand_name: "Pravachol" }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      });

    const question = await generateBrandGenericMatchQuestion();

    expect(question.kind).toBe("matching");
    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).toHaveLength(4);
    expect(Object.keys(question.correctPairs)).toHaveLength(4);
  });

  it("skips drugs where brand name equals generic name", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Class A", type: "epc" },
        { name: "Class B", type: "epc" },
        { name: "Class C", type: "epc" },
        { name: "Class D", type: "epc" },
        { name: "Class E", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 5, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      // Class A has brand = generic (should skip)
      if (params.class === "Class A") {
        return {
          data: [{ generic_name: "SIMVASTATIN", brand_name: "SIMVASTATIN" }],
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        };
      }
      return {
        data: [{ generic_name: `drug-${params.class}`, brand_name: `Brand-${params.class}` }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      };
    });

    const question = await generateBrandGenericMatchQuestion();

    expect(question.leftItems).toHaveLength(4);
    // SIMVASTATIN should not appear
    expect(question.leftItems).not.toContain("SIMVASTATIN");
  });

  it("collects pairs from multiple classes", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Class A", type: "epc" },
        { name: "Class B", type: "epc" },
        { name: "Class C", type: "epc" },
        { name: "Class D", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockImplementation(async (params) => ({
      data: [{ generic_name: `gen-${params.class}`, brand_name: `brand-${params.class}` }],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    }));

    const question = await generateBrandGenericMatchQuestion();

    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).toHaveLength(4);
  });

  it("throws when not enough drugs with distinct brand names", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Class A", type: "epc" },
        { name: "Class B", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 2, total_pages: 1 },
    });
    // All return brand = generic
    mockedApi.getDrugsInClass.mockResolvedValue({
      data: [{ generic_name: "same", brand_name: "same" }],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    });

    await expect(generateBrandGenericMatchQuestion()).rejects.toThrow(
      "Could not find 4 drugs with distinct brand names",
    );
  });

  it("skips classes that throw errors (502 upstream)", async () => {
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "Failing", type: "epc" },
        { name: "Class A", type: "epc" },
        { name: "Class B", type: "epc" },
        { name: "Class C", type: "epc" },
        { name: "Class D", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 5, total_pages: 1 },
    });
    mockedApi.getDrugsInClass.mockImplementation(async (params) => {
      if (params.class === "Failing") throw new Error("upstream_error");
      return {
        data: [{ generic_name: `gen-${params.class}`, brand_name: `brand-${params.class}` }],
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      };
    });

    const question = await generateBrandGenericMatchQuestion();
    expect(question.leftItems).toHaveLength(4);
  });
});

describe("generateQuestions", () => {
  it("calls onProgress callback with (completed, total) for each question", async () => {
    for (let i = 0; i < 3; i++) {
      mockedApi.getDrugClasses.mockResolvedValueOnce({
        data: [
          { name: `Class-${i}`, type: "epc" },
          { name: "Distractor-A", type: "epc" },
          { name: "Distractor-B", type: "epc" },
          { name: "Distractor-C", type: "epc" },
        ],
        pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
      });
      mockedApi.getDrugsInClass.mockResolvedValueOnce({
        data: [{ generic_name: `drug-${i}`, brand_name: "" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      });
    }

    const onProgress = vi.fn();
    const questions = await generateQuestions("name-the-class", 3, onProgress);

    expect(questions).toHaveLength(3);
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
    expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
  });

  it("generates multiple name-the-class questions", async () => {
    // Set up mocks for 2 questions — each call fetches classes then a drug
    for (let i = 0; i < 2; i++) {
      mockedApi.getDrugClasses.mockResolvedValueOnce({
        data: [
          { name: `Class-${i}`, type: "epc" },
          { name: "Distractor-A", type: "epc" },
          { name: "Distractor-B", type: "epc" },
          { name: "Distractor-C", type: "epc" },
        ],
        pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
      });
      mockedApi.getDrugsInClass.mockResolvedValueOnce({
        data: [{ generic_name: `drug-${i}`, brand_name: "" }],
        pagination: { page: 1, limit: 5, total: 1, total_pages: 1 },
      });
    }

    const questions = await generateQuestions("name-the-class", 2);

    expect(questions).toHaveLength(2);
    expect(questions[0]!.kind).toBe("multiple-choice");
    expect(questions[1]!.kind).toBe("multiple-choice");
  });
});
