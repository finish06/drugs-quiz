import { getDrugClasses, getDrugsInClass } from "./api-client";
import type { MultipleChoiceQuestion, MatchingQuestion } from "@/types/quiz";

/** Popular EPC classes for exam prep — used as seeds for brand/generic matching */
const POPULAR_CLASSES = [
  "HMG-CoA Reductase Inhibitor",
  "ACE Inhibitor",
  "Proton Pump Inhibitor",
  "Beta Adrenergic Blocker",
  "Angiotensin 2 Receptor Blocker",
  "Selective Serotonin Reuptake Inhibitor",
  "Calcium Channel Blocker",
  "Benzodiazepine",
  "Thiazide Diuretic",
  "Opioid Agonist",
];

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
 * Generate a "Name the Class" question.
 *
 * Approach: Start from EPC classes (guaranteed to have drugs),
 * pick a random class, get a drug from it, then use other classes
 * as distractors. This avoids the problem of random drugs not
 * having EPC class data.
 */
export async function generateNameTheClassQuestion(): Promise<MultipleChoiceQuestion> {
  // Fetch a page of EPC classes
  const classesResponse = await getDrugClasses({ type: "epc", limit: 100 });
  const shuffledClasses = shuffle(classesResponse.data);

  let drugName: string | null = null;
  let correctClass: string | null = null;

  // Find a class that has at least one drug
  for (const cls of shuffledClasses) {
    const drugsResponse = await getDrugsInClass({ class: cls.name, limit: 5 });
    const drug = drugsResponse.data[0];
    if (drug) {
      drugName = drug.generic_name;
      correctClass = cls.name;
      break;
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
 * Recipe:
 * 1. Pick 4 random EPC classes
 * 2. For each class, get one drug
 * 3. Present drugs vs classes as a matching exercise
 */
export async function generateMatchDrugToClassQuestion(): Promise<MatchingQuestion> {
  const classesResponse = await getDrugClasses({ type: "epc", limit: 100 });
  const shuffledClasses = shuffle(classesResponse.data);

  const pairs: { drug: string; className: string }[] = [];

  for (const cls of shuffledClasses) {
    if (pairs.length >= 4) break;

    const drugsResponse = await getDrugsInClass({ class: cls.name, limit: 5 });
    const drug = drugsResponse.data[0];
    if (drug) {
      pairs.push({ drug: drug.generic_name, className: cls.name });
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
 * Generate a "Brand/Generic Match" question.
 *
 * Recipe:
 * 1. Pick a popular EPC class
 * 2. Fetch drugs with brand names
 * 3. Pick 4 with non-empty brand names
 * 4. Present generic vs brand as matching exercise
 */
export async function generateBrandGenericMatchQuestion(): Promise<MatchingQuestion> {
  const shuffledPopular = shuffle(POPULAR_CLASSES);

  for (const className of shuffledPopular) {
    const drugsResponse = await getDrugsInClass({ class: className, limit: 20 });
    const withBrand = drugsResponse.data.filter(
      (d) => d.brand_name && d.brand_name.trim() !== "",
    );

    if (withBrand.length >= 4) {
      const selected = shuffle(withBrand).slice(0, 4);

      const correctPairs: Record<string, string> = {};
      for (const drug of selected) {
        correctPairs[drug.generic_name] = drug.brand_name;
      }

      return {
        kind: "matching",
        leftItems: shuffle(selected.map((d) => d.generic_name)),
        rightItems: shuffle(selected.map((d) => d.brand_name)),
        correctPairs,
      };
    }
  }

  throw new Error("No popular class found with 4+ drugs having brand names");
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
