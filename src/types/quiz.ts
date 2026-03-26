/** Available quiz types (including quick-5 for mixed sessions) */
export type QuizType = "name-the-class" | "match-drug-to-class" | "brand-generic-match";
export type SessionQuizType = QuizType | "quick-5";

/** A saved quiz session result */
export interface SessionRecord {
  id: string;
  completedAt: string;
  quizType: SessionQuizType;
  questionCount: number;
  correctCount: number;
  percentage: number;
  timedMode?: boolean;
  timeLimitSeconds?: number;
}

/** Quiz configuration chosen by the user */
export interface QuizConfig {
  type: QuizType | "quick-5";
  questionCount: number;
  timedMode?: boolean;
  timeLimitSeconds?: 30 | 60 | 90;
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
  /** Which quiz type generated this question (needed for Quick 5 mixed rendering) */
  sourceType?: QuizType;
}

export type Question = MultipleChoiceQuestion | MatchingQuestion;

/** User's answer to a question (basic) */
export interface Answer {
  questionIndex: number;
  correct: boolean;
}

/** User's answer with full review data */
export interface AnswerDetail extends Answer {
  /** The question that was asked (for review) */
  question: Question;
  /** User's selected answer (option string for MC, pairs record for matching) */
  userAnswer: string | Record<string, string>;
  /** Seconds spent on this question (timed mode only) */
  timeSpentSeconds?: number;
  /** Whether this question timed out (timed mode only) */
  timedOut?: boolean;
}

/** Session state */
export interface QuizSession {
  config: QuizConfig;
  questions: Question[];
  answers: AnswerDetail[];
  currentIndex: number;
  status: "loading" | "in-progress" | "complete";
  generationComplete: boolean;
}

/** Session results */
export interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  answers: AnswerDetail[];
  averageTimeSeconds?: number;
  timedOutCount?: number;
}
