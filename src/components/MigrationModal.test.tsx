import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MigrationModal } from "./MigrationModal";

describe("MigrationModal — AC-001, AC-002, AC-003, AC-008, AC-009, AC-014", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("AC-002: shows session count in the prompt", () => {
    render(
      <MigrationModal sessionCount={5} onSync={vi.fn()} onSkip={vi.fn()} />,
    );
    expect(screen.getByText(/5 quiz sessions/i)).toBeInTheDocument();
  });

  it("AC-003: renders Sync Now and Skip buttons", () => {
    render(
      <MigrationModal sessionCount={3} onSync={vi.fn()} onSkip={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /sync now/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
  });

  it("AC-004: calls onSync when Sync Now is clicked", async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    render(
      <MigrationModal sessionCount={3} onSync={onSync} onSkip={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sync now/i }));
    await waitFor(() => expect(onSync).toHaveBeenCalledTimes(1));
  });

  it("AC-009: calls onSkip when Skip is clicked", () => {
    const onSkip = vi.fn();
    render(
      <MigrationModal sessionCount={3} onSync={vi.fn()} onSkip={onSkip} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("AC-008: shows success message after sync", async () => {
    const onSync = vi.fn().mockResolvedValue({ migrated: 5, skipped: 0 });
    render(
      <MigrationModal sessionCount={5} onSync={onSync} onSkip={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sync now/i }));
    await waitFor(() => {
      expect(screen.getByText(/synced 5 sessions/i)).toBeInTheDocument();
    });
  });

  it("AC-014: renders as a modal overlay", () => {
    const { container } = render(
      <MigrationModal sessionCount={3} onSync={vi.fn()} onSkip={vi.fn()} />,
    );
    // Check for backdrop/overlay element
    const backdrop = container.querySelector("[data-testid='migration-backdrop']");
    expect(backdrop).toBeInTheDocument();
  });

  it("shows loading state while syncing", async () => {
    // Create a promise we control
    let resolveSync: (v: { migrated: number; skipped: number }) => void;
    const syncPromise = new Promise<{ migrated: number; skipped: number }>((resolve) => {
      resolveSync = resolve;
    });
    const onSync = vi.fn().mockReturnValue(syncPromise);

    render(
      <MigrationModal sessionCount={3} onSync={onSync} onSkip={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sync now/i }));

    // Button should be disabled during loading
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /syncing/i });
      expect(button).toBeDisabled();
    });

    // Resolve the sync
    resolveSync!({ migrated: 3, skipped: 0 });
  });

  it("shows error state on sync failure", async () => {
    const onSync = vi.fn().mockRejectedValue(new Error("Network error"));
    render(
      <MigrationModal sessionCount={3} onSync={onSync} onSkip={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sync now/i }));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
