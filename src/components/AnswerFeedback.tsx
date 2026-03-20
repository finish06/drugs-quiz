interface AnswerFeedbackProps {
  correct: boolean;
  drugName: string;
  correctClass: string;
}

export function AnswerFeedback({ correct, drugName, correctClass }: AnswerFeedbackProps) {
  return (
    <div
      role="status"
      className={`rounded-lg p-4 text-sm font-medium ${
        correct
          ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
      }`}
    >
      {correct ? (
        <span>{drugName} is a {correctClass}</span>
      ) : (
        <span>Incorrect — {drugName} belongs to {correctClass}</span>
      )}
    </div>
  );
}
