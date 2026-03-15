import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateNameTheClassQuestion,
  generateMatchDrugToClassQuestion,
  generateBrandGenericMatchQuestion,
  generateQuestions,
} from "./quiz-generators";
import * as apiClient from "./api-client";

vi.mock("./api-client");

const mockedApi = vi.mocked(apiClient);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("generateNameTheClassQuestion", () => {
  it("returns a multiple-choice question with 4 options", async () => {
    // Initial call to get total pages
    mockedApi.getDrugNames.mockResolvedValueOnce({
      data: [{ name: "simvastatin", type: "generic" }],
      pagination: { page: 1, limit: 1, total: 100, total_pages: 100 },
    });
    // Random page fetch
    mockedApi.getDrugNames.mockResolvedValueOnce({
      data: [{ name: "simvastatin", type: "generic" }],
      pagination: { page: 42, limit: 1, total: 100, total_pages: 100 },
    });
    // Class lookup
    mockedApi.getDrugClass.mockResolvedValueOnce({
      query_name: "simvastatin",
      generic_name: "simvastatin",
      brand_names: ["Zocor"],
      classes: [{ name: "HMG-CoA Reductase Inhibitor", type: "EPC" }],
    });
    // Distractor classes
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

    const question = await generateNameTheClassQuestion();

    expect(question.kind).toBe("multiple-choice");
    expect(question.drugName).toBe("simvastatin");
    expect(question.correctAnswer).toBe("HMG-CoA Reductase Inhibitor");
    expect(question.options).toHaveLength(4);
    expect(question.options).toContain("HMG-CoA Reductase Inhibitor");
  });

  it("retries when drug has no EPC class", async () => {
    // Initial call
    mockedApi.getDrugNames.mockResolvedValueOnce({
      data: [{ name: "unknown", type: "generic" }],
      pagination: { page: 1, limit: 1, total: 100, total_pages: 100 },
    });
    // First attempt — drug has no EPC class
    mockedApi.getDrugNames.mockResolvedValueOnce({
      data: [{ name: "unknown", type: "generic" }],
      pagination: { page: 1, limit: 1, total: 100, total_pages: 100 },
    });
    mockedApi.getDrugClass.mockResolvedValueOnce({
      query_name: "unknown",
      generic_name: "unknown",
      brand_names: [],
      classes: [{ name: "Some MoA", type: "MoA" }], // No EPC
    });
    // Second attempt — drug has EPC class
    mockedApi.getDrugNames.mockResolvedValueOnce({
      data: [{ name: "lisinopril", type: "generic" }],
      pagination: { page: 2, limit: 1, total: 100, total_pages: 100 },
    });
    mockedApi.getDrugClass.mockResolvedValueOnce({
      query_name: "lisinopril",
      generic_name: "lisinopril",
      brand_names: ["Prinivil"],
      classes: [{ name: "ACE Inhibitor", type: "EPC" }],
    });
    // Distractors
    mockedApi.getDrugClasses.mockResolvedValueOnce({
      data: [
        { name: "ACE Inhibitor", type: "epc" },
        { name: "Beta Blocker", type: "epc" },
        { name: "PPI", type: "epc" },
        { name: "SSRI", type: "epc" },
      ],
      pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
    });

    const question = await generateNameTheClassQuestion();

    expect(question.drugName).toBe("lisinopril");
    expect(question.correctAnswer).toBe("ACE Inhibitor");
  });

  it("throws after 5 failed attempts", async () => {
    mockedApi.getDrugNames.mockResolvedValue({
      data: [{ name: "bad-drug", type: "generic" }],
      pagination: { page: 1, limit: 1, total: 1, total_pages: 1 },
    });
    mockedApi.getDrugClass.mockRejectedValue(new Error("Not found"));

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
});

describe("generateBrandGenericMatchQuestion", () => {
  it("returns a matching question with 4 brand/generic pairs", async () => {
    mockedApi.getDrugsInClass.mockResolvedValueOnce({
      data: [
        { generic_name: "simvastatin", brand_name: "Zocor" },
        { generic_name: "atorvastatin calcium", brand_name: "Lipitor" },
        { generic_name: "rosuvastatin calcium", brand_name: "Crestor" },
        { generic_name: "pravastatin sodium", brand_name: "Pravachol" },
        { generic_name: "lovastatin", brand_name: "Mevacor" },
      ],
      pagination: { page: 1, limit: 20, total: 5, total_pages: 1 },
    });

    const question = await generateBrandGenericMatchQuestion();

    expect(question.kind).toBe("matching");
    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).toHaveLength(4);
    expect(Object.keys(question.correctPairs)).toHaveLength(4);
  });

  it("skips classes with fewer than 4 drugs with brand names", async () => {
    // First class: not enough brand names
    mockedApi.getDrugsInClass.mockResolvedValueOnce({
      data: [
        { generic_name: "drug-a", brand_name: "Brand-A" },
        { generic_name: "drug-b", brand_name: "" },
        { generic_name: "drug-c", brand_name: "Brand-C" },
      ],
      pagination: { page: 1, limit: 20, total: 3, total_pages: 1 },
    });
    // Second class: enough brand names
    mockedApi.getDrugsInClass.mockResolvedValueOnce({
      data: [
        { generic_name: "drug-x", brand_name: "Brand-X" },
        { generic_name: "drug-y", brand_name: "Brand-Y" },
        { generic_name: "drug-z", brand_name: "Brand-Z" },
        { generic_name: "drug-w", brand_name: "Brand-W" },
      ],
      pagination: { page: 1, limit: 20, total: 4, total_pages: 1 },
    });

    const question = await generateBrandGenericMatchQuestion();

    expect(question.leftItems).toHaveLength(4);
    expect(question.rightItems).toHaveLength(4);
  });

  it("throws when no class has enough brand names", async () => {
    // All classes return too few drugs
    for (let i = 0; i < 10; i++) {
      mockedApi.getDrugsInClass.mockResolvedValueOnce({
        data: [{ generic_name: "only-one", brand_name: "Only-Brand" }],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      });
    }

    await expect(generateBrandGenericMatchQuestion()).rejects.toThrow(
      "No popular class found",
    );
  });
});

describe("generateQuestions", () => {
  it("generates multiple name-the-class questions", async () => {
    // Set up mocks for 2 questions
    for (let i = 0; i < 2; i++) {
      mockedApi.getDrugNames
        .mockResolvedValueOnce({
          data: [{ name: `drug-${i}`, type: "generic" }],
          pagination: { page: 1, limit: 1, total: 10, total_pages: 10 },
        })
        .mockResolvedValueOnce({
          data: [{ name: `drug-${i}`, type: "generic" }],
          pagination: { page: 1, limit: 1, total: 10, total_pages: 10 },
        });
      mockedApi.getDrugClass.mockResolvedValueOnce({
        query_name: `drug-${i}`,
        generic_name: `drug-${i}`,
        brand_names: [],
        classes: [{ name: `Class-${i}`, type: "EPC" }],
      });
      mockedApi.getDrugClasses.mockResolvedValueOnce({
        data: [
          { name: `Class-${i}`, type: "epc" },
          { name: "Distractor-A", type: "epc" },
          { name: "Distractor-B", type: "epc" },
          { name: "Distractor-C", type: "epc" },
        ],
        pagination: { page: 1, limit: 100, total: 4, total_pages: 1 },
      });
    }

    const questions = await generateQuestions("name-the-class", 2);

    expect(questions).toHaveLength(2);
    expect(questions[0]!.kind).toBe("multiple-choice");
    expect(questions[1]!.kind).toBe("multiple-choice");
  });
});
