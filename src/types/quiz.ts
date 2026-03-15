/** Available quiz types */
export type QuizType = "name-the-class" | "match-drug-to-class" | "brand-generic-match";

/** Quiz configuration chosen by the user */
export interface QuizConfig {
  type: QuizType;
  questionCount: number;
}

/** A single multiple-choice question (Name the Class) */
export interface MultipleChoiceQuestion {
  kind: "multiple-choice";
  drugName: string;
  correctAnswer: string;
  options: string[];
}

/** A single matching question (Match Drug to Class, Brand/Generic) */
export interface MatchingQuestion {
  kind: "matching";
  leftItems: string[];
  rightItems: string[];
  correctPairs: Record<string, string>;
}

export type Question = MultipleChoiceQuestion | MatchingQuestion;

/** User's answer to a question */
export interface Answer {
  questionIndex: number;
  correct: boolean;
}

/** Session state */
export interface QuizSession {
  config: QuizConfig;
  questions: Question[];
  answers: Answer[];
  currentIndex: number;
  status: "loading" | "in-progress" | "complete";
}

/** Session results */
export interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  answers: Answer[];
}
