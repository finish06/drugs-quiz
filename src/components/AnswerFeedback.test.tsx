import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AnswerFeedback } from "./AnswerFeedback";

describe("AC-001/AC-003: Correct answer inline feedback", () => {
  it("should show green banner with drug name and class for correct MC answer", () => {
    render(
      <AnswerFeedback
        correct={true}
        drugName="Simvastatin"
        correctClass="HMG-CoA Reductase Inhibitor"
      />,
    );

    expect(screen.getByText(/Simvastatin/)).toBeInTheDocument();
    expect(screen.getByText(/HMG-CoA Reductase Inhibitor/)).toBeInTheDocument();
    // Green styling
    const banner = screen.getByRole("status");
    expect(banner.className).toMatch(/green/);
  });
});

describe("AC-004: Incorrect answer inline feedback", () => {
  it("should show red banner with correct class for incorrect MC answer", () => {
    render(
      <AnswerFeedback
        correct={false}
        drugName="Simvastatin"
        correctClass="HMG-CoA Reductase Inhibitor"
      />,
    );

    expect(screen.getByText(/Incorrect/)).toBeInTheDocument();
    expect(screen.getByText(/Simvastatin/)).toBeInTheDocument();
    expect(screen.getByText(/HMG-CoA Reductase Inhibitor/)).toBeInTheDocument();
    // Red styling
    const banner = screen.getByRole("status");
    expect(banner.className).toMatch(/red/);
  });
});
