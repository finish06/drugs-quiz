import { getDrugClasses, getDrugsInClass } from "./api-client";
import type { DrugClass } from "@/types/api";
import type { MultipleChoiceQuestion, MatchingQuestion, QuizType, Question } from "@/types/quiz";
import { toTitleCase } from "@/utils/text";

const HOMEOPATHIC_INDICATORS = /nosode|suis|officinale/i;

/**
 * Filter out obscure, non-exam-relevant drug names:
 * - Too long (> 60 chars)
 * - Multi-ingredient compounds (contain commas)
 * - Homeopathic preparations
 */
export function isExamRelevantDrug(name: string): boolean {
  if (name.length > 60) return false;
  if (name.includes(",")) return false;
  if (HOMEOPATHIC_INDICATORS.test(name)) return false;
  return true;
}

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
 * Fetch a large pool of EPC classes from multiple random pages.
 * Fetches 2 random pages to get ~200 classes for variety.
 */
export async function fetchEpcClassPool(): Promise<DrugClass[]> {
  const initial = await getDrugClasses({ type: "epc", limit: 100, page: 1 });
  const totalPages = initial.pagination.total_pages;

  if (totalPages <= 1) {
    return initial.data;
  }

  // Fetch 2 different random pages for a larger pool
  const page1 = randomInt(1, totalPages);
  const page2Data: DrugClass[] = [];

  const data1 = page1 === 1
    ? initial.data
    : (await getDrugClasses({ type: "epc", limit: 100, page: page1 })).data;

  // Try a second different page for more variety
  let page2 = randomInt(1, totalPages);
  if (page2 === page1 && totalPages > 1) {
    page2 = (page1 % totalPages) + 1;
  }
  if (page2 !== page1) {
    try {
      const resp = await getDrugClasses({ type: "epc", limit: 100, page: page2 });
      page2Data.push(...resp.data);
    } catch {
      // Fine — one page is enough
    }
  }

  return [...data1, ...page2Data];
}

/**
 * Generate a "Name the Class" question.
 * Accepts a usedDrugs set to avoid repeating drugs across questions.
 */
export async function generateNameTheClassQuestion(
  classPool: DrugClass[],
  usedDrugs: Set<string>,
): Promise<MultipleChoiceQuestion> {
  const shuffledClasses = shuffle(classPool);

  let drugName: string | null = null;
  let correctClass: string | null = null;

  for (const cls of shuffledClasses) {
    try {
      const drugsResponse = await getDrugsInClass({ class: cls.name, limit: 5 });
      const examDrugs = drugsResponse.data.filter(
        (d) => isExamRelevantDrug(d.generic_name) && !usedDrugs.has(d.generic_name.toLowerCase()),
      );
      const drug = examDrugs[0];
      if (drug) {
        drugName = toTitleCase(drug.generic_name);
        correctClass = cls.name;
        usedDrugs.add(drug.generic_name.toLowerCase());
        break;
      }
    } catch {
      continue;
    }
  }

  if (!drugName || !correctClass) {
    throw new Error("Failed to find a drug with an EPC class");
  }

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
 * Accepts a usedDrugs set to avoid repeating drugs across questions.
 */
export async function generateMatchDrugToClassQuestion(
  classPool: DrugClass[],
  usedDrugs: Set<string>,
): Promise<MatchingQuestion> {
  const shuffledClasses = shuffle(classPool);

  const pairs: { drug: string; className: string }[] = [];

  for (const cls of shuffledClasses) {
    if (pairs.length >= 4) break;

    try {
      const drugsResponse = await getDrugsInClass({ class: cls.name, limit: 5 });
      const examDrugs = drugsResponse.data.filter(
        (d) => isExamRelevantDrug(d.generic_name) && !usedDrugs.has(d.generic_name.toLowerCase()),
      );
      const drug = examDrugs[0];
      if (drug) {
        pairs.push({ drug: toTitleCase(drug.generic_name), className: cls.name });
        usedDrugs.add(drug.generic_name.toLowerCase());
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
 * Accepts a usedDrugs set to avoid repeating drugs across questions.
 */
export async function generateBrandGenericMatchQuestion(
  classPool: DrugClass[],
  usedDrugs: Set<string>,
): Promise<MatchingQuestion> {
  const shuffledClasses = shuffle(classPool);

  const pairs: { generic: string; brand: string }[] = [];

  for (const cls of shuffledClasses) {
    if (pairs.length >= 4) break;

    try {
      const drugsResponse = await getDrugsInClass({ class: cls.name, limit: 10 });
      const examDrugs = drugsResponse.data.filter((d) => isExamRelevantDrug(d.generic_name));

      for (const drug of examDrugs) {
        if (pairs.length >= 4) break;
        const genericKey = drug.generic_name.toLowerCase();
        if (hasRealBrandName(drug) && !usedDrugs.has(genericKey)) {
          pairs.push({ generic: toTitleCase(drug.generic_name), brand: toTitleCase(drug.brand_name) });
          usedDrugs.add(genericKey);
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
 * Generate a single question of the given type.
 * Uses the provided classPool and usedDrugs set for deduplication.
 */
export async function generateSingleQuestion(
  type: QuizType,
  classPool: DrugClass[],
  usedDrugs: Set<string>,
): Promise<Question> {
  const generators = {
    "name-the-class": generateNameTheClassQuestion,
    "match-drug-to-class": generateMatchDrugToClassQuestion,
    "brand-generic-match": generateBrandGenericMatchQuestion,
  };

  const generator = generators[type];
  return generator(classPool, usedDrugs);
}

/**
 * Generate multiple questions of a given type.
 * Fetches a class pool once, then passes a shared usedDrugs set
 * to each generator to prevent repeating drugs across questions.
 */
export async function generateQuestions(
  type: QuizType,
  count: number,
  onProgress?: (completed: number, total: number) => void,
): Promise<(MultipleChoiceQuestion | MatchingQuestion)[]> {
  const classPool = await fetchEpcClassPool();
  const usedDrugs = new Set<string>();

  const questions: (MultipleChoiceQuestion | MatchingQuestion)[] = [];

  for (let i = 0; i < count; i++) {
    const question = await generateSingleQuestion(type, classPool, usedDrugs);
    questions.push(question);
    onProgress?.(i + 1, count);
  }

  return questions;
}
