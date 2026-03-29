import { useState } from "react";
import type { ChangelogEntry, ChangelogCategory } from "@/types/changelog";

interface WhatsNewPanelProps {
  changelog: ChangelogEntry[];
  onClose: () => void;
}

const BADGE_STYLES: Record<ChangelogCategory, string> = {
  new: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  improvement: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  fix: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

const BADGE_LABELS: Record<ChangelogCategory, string> = {
  new: "NEW",
  improvement: "IMPROVEMENT",
  fix: "BUG FIX",
};

export function WhatsNewPanel({ changelog, onClose }: WhatsNewPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState(
    changelog[0]?.version ?? "",
  );

  const selectedEntry = changelog.find((v) => v.version === selectedVersion);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  if (changelog.length === 0) {
    return (
      <div
        data-testid="whats-new-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="mx-4 w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl text-center">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">What&apos;s New</h2>
            <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No updates yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="whats-new-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 w-full max-w-3xl max-h-[80vh] rounded-2xl bg-white dark:bg-gray-800 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">What&apos;s New</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Desktop: two-panel layout */}
        <div className="flex-1 overflow-hidden hidden sm:flex">
          {/* Sidebar */}
          <nav className="w-48 border-r border-gray-200 dark:border-gray-700 overflow-y-auto py-2" aria-label="Version list">
            {changelog.map((version) => (
              <button
                key={version.version}
                onClick={() => setSelectedVersion(version.version)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  version.version === selectedVersion
                    ? "border-l-2 border-brand text-brand font-semibold bg-blue-50 dark:bg-blue-900/20"
                    : "border-l-2 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="font-medium">v{version.version}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{version.date}</div>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedEntry && (
              <VersionContent entry={selectedEntry} />
            )}
          </div>
        </div>

        {/* Mobile: single-column layout */}
        <div className="flex-1 overflow-y-auto sm:hidden p-4 space-y-6">
          {changelog.map((version) => (
            <div key={version.version}>
              <VersionContent entry={version} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VersionContent({ entry }: { entry: ChangelogEntry }) {
  return (
    <div>
      <div className="mb-4">
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">v{entry.version}</span>
        <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">{entry.date}</span>
      </div>
      <hr className="mb-4 border-gray-200 dark:border-gray-700" />
      <div className="space-y-4">
        {entry.entries.map((item, i) => (
          <div key={i}>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${BADGE_STYLES[item.category]}`}>
              {BADGE_LABELS[item.category]}
            </span>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
              <span className="font-medium">{item.title}</span>
              {item.description && (
                <span className="text-gray-600 dark:text-gray-400"> — {item.description}</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
