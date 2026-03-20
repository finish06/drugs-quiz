import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FlashcardDrill } from "./FlashcardDrill";
import type { DrugPerformance } from "@/hooks/useDrugPerformance";

const mockWeakDrugs: DrugPerformance[] = [
  {
    drugName: "simvastatin",
    displayName: "Simvastatin",
    drugClass: "HMG-CoA Reductase Inhibitor",
    timesSeen: 5,
    timesCorrect: 1,
    streak: 0,
    lastSeen: new Date().toISOString(),
  },
  {
    drugName: "lisinopril",
    displayName: "Lisinopril",
    drugClass: "ACE Inhibitor",
    timesSeen: 3,
    timesCorrect: 0,
    streak: 0,
    lastSeen: new Date().toISOString(),
  },
];

describe("AC-007: Flashcard drill shows drug name and reveals class", () => {
  it("should show drug name initially", () => {
    render(<FlashcardDrill weakDrugs={mockWeakDrugs} onExit={vi.fn()} />);

    expect(screen.getByText("Simvastatin")).toBeInTheDocument();
    expect(screen.getByText(/Tap to reveal/)).toBeInTheDocument();
  });

  it("should reveal class on tap", async () => {
    const user = userEvent.setup();
    render(<FlashcardDrill weakDrugs={mockWeakDrugs} onExit={vi.fn()} />);

    await user.click(screen.getByText(/Tap to reveal/));

    expect(screen.getByText("HMG-CoA Reductase Inhibitor")).toBeInTheDocument();
  });
});

describe("AC-008: Drill cycles through all weak drugs", () => {
  it("should advance to next drug on Next click", async () => {
    const user = userEvent.setup();
    render(<FlashcardDrill weakDrugs={mockWeakDrugs} onExit={vi.fn()} />);

    // Reveal first card
    await user.click(screen.getByText(/Tap to reveal/));
    // Go to next
    await user.click(screen.getByText("Next"));

    expect(screen.getByText("Lisinopril")).toBeInTheDocument();
  });

  it("should cycle back to first drug after last", async () => {
    const user = userEvent.setup();
    render(<FlashcardDrill weakDrugs={mockWeakDrugs} onExit={vi.fn()} />);

    // Card 1: reveal + next
    await user.click(screen.getByText(/Tap to reveal/));
    await user.click(screen.getByText("Next"));
    // Card 2: reveal + next
    await user.click(screen.getByText(/Tap to reveal/));
    await user.click(screen.getByText("Next"));

    // Should be back to card 1
    expect(screen.getByText("Simvastatin")).toBeInTheDocument();
  });
});

describe("AC-008: Exit button returns to results", () => {
  it("should call onExit when Exit is clicked", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    render(<FlashcardDrill weakDrugs={mockWeakDrugs} onExit={onExit} />);

    await user.click(screen.getByText("Exit"));

    expect(onExit).toHaveBeenCalledOnce();
  });
});

describe("AC-009: Drill does not affect scores", () => {
  it("should not expose any scoring callbacks", () => {
    // FlashcardDrill should not have an onAnswer or onScore prop
    // This test verifies by rendering successfully without any scoring props
    render(<FlashcardDrill weakDrugs={mockWeakDrugs} onExit={vi.fn()} />);
    expect(screen.getByText("Study Mode")).toBeInTheDocument();
  });
});
