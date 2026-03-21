import { getDrugClasses, getDrugsInClass } from "./api-client";
import type { DrugClass, DrugInClass } from "@/types/api";
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
 * Pre-fetch drugs for a batch of classes in parallel using Promise.allSettled.
 * Returns a map of className → drugs array for successful fetches.
 */
async function batchFetchDrugs(
  classes: DrugClass[],
  limit: number,
): Promise<Map<string, DrugInClass[]>> {
  const results = await Promise.allSettled(
    classes.map(async (cls) => {
      const resp = await getDrugsInClass({ class: cls.name, limit });
      return { className: cls.name, drugs: resp.data };
    }),
  );

  const map = new Map<string, DrugInClass[]>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      map.set(result.value.className, result.value.drugs);
    }
  }
  return map;
}

/**
 * Fetch a large pool of EPC classes from multiple random pages.
 * Fetches 2 random pages in parallel to get ~200 classes for variety.
 */
export async function fetchEpcClassPool(): Promise<DrugClass[]> {
  const initial = await getDrugClasses({ type: "epc", limit: 100, page: 1 });
  const totalPages = initial.pagination.total_pages;

  if (totalPages <= 1) {
    return initial.data;
  }

  const page1 = randomInt(1, totalPages);
  const page2Num = page1 === totalPages ? (page1 % totalPages) + 1 : page1 + 1;

  // Fetch both pages in parallel
  const [page1Result, page2Result] = await Promise.allSettled([
    page1 === 1
      ? Promise.resolve(initial.data)
      : getDrugClasses({ type: "epc", limit: 100, page: page1 }).then((r) => r.data),
    page2Num !== page1
      ? getDrugClasses({ type: "epc", limit: 100, page: page2Num }).then((r) => r.data)
      : Promise.resolve([] as DrugClass[]),
  ]);

  const data1 = page1Result.status === "fulfilled" ? page1Result.value : initial.data;
  const data2 = page2Result.status === "fulfilled" ? page2Result.value : [];

  return [...data1, ...data2];
}

/**
 * Generate a "Name the Class" question.
 * Pre-fetches drugs for a batch of classes in parallel, then picks one.
 */
export async function generateNameTheClassQuestion(
  classPool: DrugClass[],
  usedDrugs: Set<string>,
): Promise<MultipleChoiceQuestion> {
  const shuffledClasses = shuffle(classPool);
  const BATCH_SIZE = 8;

  for (let offset = 0; offset < shuffledClasses.length; offset += BATCH_SIZE) {
    const batch = shuffledClasses.slice(offset, offset + BATCH_SIZE);
    const drugMap = await batchFetchDrugs(batch, 5);

    for (const cls of batch) {
      const drugs = drugMap.get(cls.name);
      if (!drugs) continue;

      const examDrugs = drugs.filter(
        (d) => isExamRelevantDrug(d.generic_name) && !usedDrugs.has(d.generic_name.toLowerCase()),
      );
      const drug = examDrugs[0];
      if (drug) {
        const drugName = toTitleCase(drug.generic_name);
        const correctClass = cls.name;
        usedDrugs.add(drug.generic_name.toLowerCase());

        const distractors = shuffledClasses
          .map((c) => c.name)
          .filter((name) => name !== correctClass)
          .slice(0, 3);

        if (distractors.length < 3) {
          throw new Error("Not enough distractor classes available");
        }

        return {
          kind: "multiple-choice",
          drugName,
          correctAnswer: correctClass,
          options: shuffle([correctClass, ...distractors]),
        };
      }
    }
  }

  throw new Error("Failed to find a drug with an EPC class");
}

/**
 * Generate a "Match Drug to Class" question.
 * Pre-fetches drugs for a batch of classes in parallel, then picks 4.
 */
export async function generateMatchDrugToClassQuestion(
  classPool: DrugClass[],
  usedDrugs: Set<string>,
): Promise<MatchingQuestion> {
  const shuffledClasses = shuffle(classPool);
  const BATCH_SIZE = 12;
  const pairs: { drug: string; className: string }[] = [];

  for (let offset = 0; offset < shuffledClasses.length && pairs.length < 4; offset += BATCH_SIZE) {
    const batch = shuffledClasses.slice(offset, offset + BATCH_SIZE);
    const drugMap = await batchFetchDrugs(batch, 5);

    for (const cls of batch) {
      if (pairs.length >= 4) break;
      const drugs = drugMap.get(cls.name);
      if (!drugs) continue;

      const examDrugs = drugs.filter(
        (d) => isExamRelevantDrug(d.generic_name) && !usedDrugs.has(d.generic_name.toLowerCase()),
      );
      const drug = examDrugs[0];
      if (drug) {
        pairs.push({ drug: toTitleCase(drug.generic_name), className: cls.name });
        usedDrugs.add(drug.generic_name.toLowerCase());
      }
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
    sourceType: "match-drug-to-class",
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
 * Pre-fetches drugs for a batch of classes in parallel, then picks 4 with brand names.
 */
export async function generateBrandGenericMatchQuestion(
  classPool: DrugClass[],
  usedDrugs: Set<string>,
): Promise<MatchingQuestion> {
  const shuffledClasses = shuffle(classPool);
  const BATCH_SIZE = 12;
  const pairs: { generic: string; brand: string }[] = [];

  for (let offset = 0; offset < shuffledClasses.length && pairs.length < 4; offset += BATCH_SIZE) {
    const batch = shuffledClasses.slice(offset, offset + BATCH_SIZE);
    const drugMap = await batchFetchDrugs(batch, 10);

    for (const cls of batch) {
      if (pairs.length >= 4) break;
      const drugs = drugMap.get(cls.name);
      if (!drugs) continue;

      const examDrugs = drugs.filter((d) => isExamRelevantDrug(d.generic_name));
      for (const drug of examDrugs) {
        if (pairs.length >= 4) break;
        const genericKey = drug.generic_name.toLowerCase();
        if (hasRealBrandName(drug) && !usedDrugs.has(genericKey)) {
          pairs.push({ generic: toTitleCase(drug.generic_name), brand: toTitleCase(drug.brand_name) });
          usedDrugs.add(genericKey);
        }
      }
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
    sourceType: "brand-generic-match",
  };
}

/**
 * Generate a single question of the given type.
 * Uses the provided classPool and usedDrugs set for deduplication.
 */
const QUIZ_TYPES: QuizType[] = ["name-the-class", "match-drug-to-class", "brand-generic-match"];

export async function generateSingleQuestion(
  type: QuizType | "quick-5",
  classPool: DrugClass[],
  usedDrugs: Set<string>,
): Promise<Question> {
  const generators = {
    "name-the-class": generateNameTheClassQuestion,
    "match-drug-to-class": generateMatchDrugToClassQuestion,
    "brand-generic-match": generateBrandGenericMatchQuestion,
  };

  const resolvedType = type === "quick-5"
    ? QUIZ_TYPES[randomInt(0, QUIZ_TYPES.length - 1)]!
    : type;

  const generator = generators[resolvedType];
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
