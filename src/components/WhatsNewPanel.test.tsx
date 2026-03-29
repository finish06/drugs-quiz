import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WhatsNewPanel } from "./WhatsNewPanel";
import type { ChangelogEntry } from "@/types/changelog";

const mockChangelog: ChangelogEntry[] = [
  {
    version: "0.5.0",
    date: "March 29, 2026",
    entries: [
      { category: "new", title: "Google Sign-In", description: "Sign in with Google to sync your quiz history." },
      { category: "fix", title: "Quiz Loading", description: "Fixed a rare issue where quizzes could fail to load." },
    ],
  },
  {
    version: "0.4.0",
    date: "March 22, 2026",
    entries: [
      { category: "improvement", title: "Faster Quizzes", description: "Quiz questions now load faster." },
    ],
  },
];

describe("WhatsNewPanel — AC-004 through AC-011, AC-019, AC-021", () => {
  it("AC-004: renders modal overlay", () => {
    const { container } = render(
      <WhatsNewPanel changelog={mockChangelog} onClose={vi.fn()} />,
    );
    expect(container.querySelector("[data-testid='whats-new-backdrop']")).toBeInTheDocument();
  });

  it("AC-005: renders two-panel layout with sidebar and content", () => {
    render(<WhatsNewPanel changelog={mockChangelog} onClose={vi.fn()} />);
    expect(screen.getByText("What's New")).toBeInTheDocument();
    // Sidebar has version buttons
    expect(screen.getAllByText(/v0\.5\.0/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/v0\.4\.0/).length).toBeGreaterThan(0);
  });

  it("AC-006: sidebar lists all versions with dates", () => {
    render(<WhatsNewPanel changelog={mockChangelog} onClose={vi.fn()} />);
    expect(screen.getAllByText("March 29, 2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("March 22, 2026").length).toBeGreaterThan(0);
  });

  it("AC-011: defaults to showing the latest version", () => {
    render(<WhatsNewPanel changelog={mockChangelog} onClose={vi.fn()} />);
    // Latest version's entries should be visible (appears in both desktop + mobile views)
    expect(screen.getAllByText("Google Sign-In").length).toBeGreaterThan(0);
  });

  it("AC-007: clicking a version in sidebar shows its entries", () => {
    render(<WhatsNewPanel changelog={mockChangelog} onClose={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    const v040Button = buttons.find((b) => b.textContent?.includes("v0.4.0"));
    expect(v040Button).toBeDefined();
    fireEvent.click(v040Button!);
    // v0.4.0 entries should appear (desktop content pane + mobile view)
    expect(screen.getAllByText("Faster Quizzes").length).toBeGreaterThan(0);
  });

  it("AC-009: renders category badges", () => {
    render(<WhatsNewPanel changelog={mockChangelog} onClose={vi.fn()} />);
    expect(screen.getAllByText("NEW").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BUG FIX").length).toBeGreaterThan(0);
  });

  it("AC-010: renders entry title and description", () => {
    render(<WhatsNewPanel changelog={mockChangelog} onClose={vi.fn()} />);
    expect(screen.getAllByText("Google Sign-In").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sign in with Google/).length).toBeGreaterThan(0);
  });

  it("AC-021: closes via X button", () => {
    const onClose = vi.fn();
    render(<WhatsNewPanel changelog={mockChangelog} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("AC-021: closes via backdrop click", () => {
    const onClose = vi.fn();
    const { container } = render(
      <WhatsNewPanel changelog={mockChangelog} onClose={onClose} />,
    );
    const backdrop = container.querySelector("[data-testid='whats-new-backdrop']")!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no entries", () => {
    render(<WhatsNewPanel changelog={[]} onClose={vi.fn()} />);
    expect(screen.getByText("No updates yet.")).toBeInTheDocument();
  });
});
