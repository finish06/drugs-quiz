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
});

describe("generateQuestions", () => {
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
