import { getDrugNames, getDrugClasses, getDrugClass, getDrugsInClass } from "./api-client";
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
 * Recipe:
 * 1. Pick a random generic drug
 * 2. Look up its EPC class (correct answer)
 * 3. Fetch 3 distractor EPC classes
 * 4. Present as multiple choice
 */
export async function generateNameTheClassQuestion(): Promise<MultipleChoiceQuestion> {
  // Get total pages for random selection
  const initial = await getDrugNames({ type: "generic", limit: 1 });
  const totalPages = initial.pagination.total_pages;

  let drugName: string | null = null;
  let correctClass: string | null = null;

  // Retry loop: pick a drug that has an EPC class
  for (let attempt = 0; attempt < 5; attempt++) {
    const page = randomInt(1, totalPages);
    const drugsPage = await getDrugNames({ type: "generic", limit: 1, page });
    const drug = drugsPage.data[0];
    if (!drug) continue;

    try {
      const lookup = await getDrugClass(drug.name);
      const epcClass = lookup.classes.find(
        (c) => c.type.toUpperCase() === "EPC",
      );
      if (epcClass) {
        drugName = drug.name;
        correctClass = epcClass.name;
        break;
      }
    } catch {
      // Drug not found or no class — try another
      continue;
    }
  }

  if (!drugName || !correctClass) {
    throw new Error("Failed to find a drug with an EPC class after 5 attempts");
  }

  // Fetch distractor classes
  const classesResponse = await getDrugClasses({ type: "epc", limit: 100 });
  const allClasses = classesResponse.data
    .map((c) => c.name)
    .filter((name) => name !== correctClass);

  const distractors = shuffle(allClasses).slice(0, 3);

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
