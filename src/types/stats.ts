export interface QuizTypeStats {
  quizType: string;
  accuracy: number;
  count: number;
}

export interface ClassStat {
  className: string;
  accuracy: number;
  totalSeen: number;
}

export interface TrendPoint {
  date: string;
  accuracy: number;
  count: number;
}

export interface StatsData {
  overallAccuracy: number;
  totalQuizzes: number;
  totalQuestions: number;
  currentStreak: number;
  longestStreak: number;
  quizTypeBreakdown: QuizTypeStats[];
  weakestClasses: ClassStat[];
  strongestClasses: ClassStat[];
  trendData: TrendPoint[];
}
