interface Quick5ButtonProps {
  onStart: () => void;
}

export function Quick5Button({ onStart }: Quick5ButtonProps) {
  return (
    <button
      onClick={onStart}
      data-umami-event="quiz-start"
      data-umami-event-type="quick-5"
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-4 text-lg font-bold text-white shadow-md transition-all duration-200 hover:bg-brand-dark dark:hover:bg-brand-light hover:shadow-lg active:scale-[0.98]"
      aria-label="Quick 5 — Start a 5-question mixed quiz"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
      Quick 5
    </button>
  );
}
