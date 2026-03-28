import { useState } from "react";

interface MigrationModalProps {
  sessionCount: number;
  onSync: () => Promise<{ migrated: number; skipped: number }>;
  onSkip: () => void;
}

type ModalState = "prompt" | "syncing" | "success" | "error";

export function MigrationModal({ sessionCount, onSync, onSkip }: MigrationModalProps) {
  const [state, setState] = useState<ModalState>("prompt");
  const [migratedCount, setMigratedCount] = useState(0);

  async function handleSync() {
    setState("syncing");
    try {
      const result = await onSync();
      setMigratedCount(result.migrated);
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <div
      data-testid="migration-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl">
        {state === "prompt" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Sync Your Quiz History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sessionCount} quiz sessions found on this device. Sync to your account so they&apos;re available everywhere.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="flex-1 rounded-xl border-2 border-gray-300 dark:border-gray-600 py-2.5 font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:border-gray-400 dark:hover:border-gray-500"
              >
                Skip
              </button>
              <button
                onClick={handleSync}
                className="flex-1 rounded-xl bg-brand py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md"
              >
                Sync Now
              </button>
            </div>
          </div>
        )}

        {state === "syncing" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-r-transparent" />
            <button disabled className="w-full rounded-xl bg-gray-300 dark:bg-gray-600 py-2.5 font-semibold text-gray-500 dark:text-gray-400 cursor-not-allowed">
              Syncing...
            </button>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Synced {migratedCount} sessions to your account
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Something went wrong
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your local data is safe — try again later.
            </p>
            <button
              onClick={onSkip}
              className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 py-2.5 font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:border-gray-400 dark:hover:border-gray-500"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
