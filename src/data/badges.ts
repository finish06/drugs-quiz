/**
 * Badge catalog — compile-time data for the 5 launch achievements.
 * Spec: specs/achievements-badges.md AC-001
 */

export type BadgeId =
  | "first-quiz"
  | "perfect-score"
  | "class-master"
  | "centurion"
  | "streak-seeker";

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  /** Human-readable unlock description shown to locked users */
  criteria: string;
  /** lucide-react icon name */
  icon: string;
}

export const BADGE_CATALOG: BadgeDef[] = [
  {
    id: "first-quiz",
    name: "First Quiz",
    description: "Completed your first quiz on Rx Drill.",
    criteria: "Complete any quiz session.",
    icon: "Trophy",
  },
  {
    id: "perfect-score",
    name: "Perfect Score",
    description: "Scored 100% on a quiz with at least 5 questions.",
    criteria: "Score 100% on a quiz with 5 or more questions.",
    icon: "Target",
  },
  {
    id: "class-master",
    name: "Class Master",
    description: "Answered every drug in a pharmacological class correctly.",
    criteria: "Answer all drugs in a single pharmacological class correctly across any sessions.",
    icon: "Award",
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Answered 100 questions in total.",
    criteria: "Reach 100 cumulative answered questions.",
    icon: "Medal",
  },
  {
    id: "streak-seeker",
    name: "Streak Seeker",
    description: "Studied 7 days in a row.",
    criteria: "Complete at least one quiz on 7 consecutive calendar days.",
    icon: "Flame",
  },
];

/** Set of all valid badge IDs for fast lookup */
export const VALID_BADGE_IDS = new Set<string>(BADGE_CATALOG.map((b) => b.id));

/** Look up a badge definition by id */
export function getBadge(id: string): BadgeDef | undefined {
  return BADGE_CATALOG.find((b) => b.id === id);
}
