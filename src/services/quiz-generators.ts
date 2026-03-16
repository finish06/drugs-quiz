import { getDrugClasses, getDrugsInClass } from "./api-client";
import type { DrugClass } from "@/types/api";
import type { MultipleChoiceQuestion, MatchingQuestion } from "@/types/quiz";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Fetch a random page of EPC classes from the full catalog.
 * First call gets total_pages, then fetches a random page.
 */
async function fetchRandomEpcClasses(): Promise<DrugClass[]> {
  const initial = await getDrugClasses({ type: "epc", limit: 100, page: 1 });
  const totalPages = initial.pagination.total_pages;

  if (totalPages <= 1) {
    return shuffle(initial.data);
  }

  const page = randomInt(1, totalPages);
  if (page === 1) {
    return shuffle(initial.data);
  }

  const response = await getDrugClasses({ type: "epc", limit: 100, page });
  return shuffle(response.data);
}

/**
 * Generate a "Name the Class" question.
 *
 * Approach: Fetch a random page of EPC classes, pick one that has
 * drugs, use it as the correct answer, and pull distractors from
 * the same page.
 */
export async function generateNameTheClassQuestion(): Promise<MultipleChoiceQuestion> {
  const shuffledClasses = await fetchRandomEpcClasses();

  let drugName: string | null = null;
  let correctClass: string | null = null;

  for (const cls of shuffledClasses) {
    try {
      const drugsResponse = await getDrugsInClass({ class: cls.name, limit: 5 });
      const drug = drugsResponse.data[0];
      if (drug) {
        drugName = drug.generic_name;
        correctClass = cls.name;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!drugName || !correctClass) {
    throw new Error("Failed to find a drug with an EPC class");
  }

  // Pick 3 distractor classes (different from the correct one)
  const distractors = shuffledClasses
    .map((c) => c.name)
    .filter((name) => name !== correctClass)
    .slice(0, 3);

  if (distractors.length < 3) {
    throw new Error("Not enough distractor classes available");
  }

  const options = shuffle([correctClass, ...distractors]);

  return {
    kind: "multiple-choice",
    drugName,
    correctAnswer: correctClass,
    options,
  };
}

/**
 * Generate a "Match Drug to Class" question.
 *
 * Fetches a random page of EPC classes, picks 4 that have drugs.
 */
export async function generateMatchDrugToClassQuestion(): Promise<MatchingQuestion> {
  const shuffledClasses = await fetchRandomEpcClasses();

  const pairs: { drug: string; className: string }[] = [];

  for (const cls of shuffledClasses) {
    if (pairs.length >= 4) break;

    try {
      const drugsResponse = await getDrugsInClass({ class: cls.name, limit: 5 });
      const drug = drugsResponse.data[0];
      if (drug) {
        pairs.push({ drug: drug.generic_name, className: cls.name });
      }
    } catch {
      continue;
    }
  }

  if (pairs.length < 4) {
    throw new Error("Could not find 4 classes with drugs");
  }

  const correctPairs: Record<string, string> = {};
  for (const pair of pairs) {
    correctPairs[pair.drug] = pair.className;
  }

  return {
    kind: "matching",
    leftItems: shuffle(pairs.map((p) => p.drug)),
    rightItems: shuffle(pairs.map((p) => p.className)),
    correctPairs,
  };
}

/**
 * Check if a drug has a real brand name (not just the generic name repeated).
 */
function hasRealBrandName(d: { generic_name: string; brand_name: string }): boolean {
  const generic = d.generic_name.toLowerCase().trim();
  const brand = d.brand_name.toLowerCase().trim();
  return brand !== "" && brand !== generic && brand.length < 50;
}

/**
 * Generate a "Brand/Generic Match" question.
 *
 * Collects drugs with distinct brand names from across multiple EPC
 * classes on a random page.
 */
export async function generateBrandGenericMatchQuestion(): Promise<MatchingQuestion> {
  const shuffledClasses = await fetchRandomEpcClasses();

  const pairs: { generic: string; brand: string }[] = [];
  const usedGenerics = new Set<string>();

  for (const cls of shuffledClasses) {
    if (pairs.length >= 4) break;

    try {
      const drugsResponse = await getDrugsInClass({ class: cls.name, limit: 10 });

      for (const drug of drugsResponse.data) {
        if (pairs.length >= 4) break;
        const genericKey = drug.generic_name.toLowerCase();
        if (hasRealBrandName(drug) && !usedGenerics.has(genericKey)) {
          pairs.push({ generic: drug.generic_name, brand: drug.brand_name });
          usedGenerics.add(genericKey);
        }
      }
    } catch {
      continue;
    }
  }

  if (pairs.length < 4) {
    throw new Error("Could not find 4 drugs with distinct brand names");
  }

  const correctPairs: Record<string, string> = {};
  for (const pair of pairs) {
    correctPairs[pair.generic] = pair.brand;
  }

  return {
    kind: "matching",
    leftItems: shuffle(pairs.map((p) => p.generic)),
    rightItems: shuffle(pairs.map((p) => p.brand)),
    correctPairs,
  };
}

/**
 * Generate multiple questions of a given type.
 */
export async function generateQuestions(
  type: "name-the-class" | "match-drug-to-class" | "brand-generic-match",
  count: number,
): Promise<(MultipleChoiceQuestion | MatchingQuestion)[]> {
  const generators = {
    "name-the-class": generateNameTheClassQuestion,
    "match-drug-to-class": generateMatchDrugToClassQuestion,
    "brand-generic-match": generateBrandGenericMatchQuestion,
  };

  const generator = generators[type];
  const questions: (MultipleChoiceQuestion | MatchingQuestion)[] = [];

  for (let i = 0; i < count; i++) {
    const question = await generator();
    questions.push(question);
  }

  return questions;
}
