interface KeyboardHintsOverlayProps {
  onDismiss: () => void;
}

export function KeyboardHintsOverlay({ onDismiss }: KeyboardHintsOverlayProps) {
  return (
    <div
      data-testid="keyboard-hints-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Keyboard Shortcuts
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Speed through quizzes with your keyboard.
          </p>
          <div className="space-y-2 text-left">
            <ShortcutRow keys={["1", "2", "3", "4"]} label="Select an answer" />
            <ShortcutRow keys={["Enter", "↵"]} label="Continue to next question" />
            <ShortcutRow keys={["Esc"]} label="Exit quiz" />
          </div>
          <button
            onClick={onDismiss}
            className="w-full rounded-xl bg-brand py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="inline-flex min-w-[1.75rem] items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 py-0.5 text-xs font-semibold font-mono text-gray-700 dark:text-gray-200"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
