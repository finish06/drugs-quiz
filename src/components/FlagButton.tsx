interface FlagButtonProps {
  flagged: boolean;
  onToggle: () => void;
}

export function FlagButton({ flagged, onToggle }: FlagButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={flagged ? "Unflag this question" : "Flag this question"}
      className={`p-1.5 rounded-lg transition-all duration-200 ${
        flagged
          ? "text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
          : "text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500"
      }`}
      title={flagged ? "Unflag" : "Flag for review"}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill={flagged ? "currentColor" : "none"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
      </svg>
    </button>
  );
}
