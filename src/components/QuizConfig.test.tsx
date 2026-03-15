import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QuizConfig } from "./QuizConfig";

describe("QuizConfig", () => {
  it("renders all three quiz type options", () => {
    render(<QuizConfig onStart={vi.fn()} />);

    expect(screen.getByText("Name the Class")).toBeInTheDocument();
    expect(screen.getByText("Match Drug to Class")).toBeInTheDocument();
    expect(screen.getByText("Brand/Generic Match")).toBeInTheDocument();
  });

  it("renders question count options", () => {
    render(<QuizConfig onStart={vi.fn()} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("has Name the Class selected by default", () => {
    render(<QuizConfig onStart={vi.fn()} />);

    const nameTheClass = screen.getByText("Name the Class").closest("button");
    expect(nameTheClass).toHaveAttribute("aria-pressed", "true");
  });

  it("has 10 questions selected by default", () => {
    render(<QuizConfig onStart={vi.fn()} />);

    const ten = screen.getByText("10");
    expect(ten).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onStart with default config when Start Quiz is clicked", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    await user.click(screen.getByText("Start Quiz"));

    expect(onStart).toHaveBeenCalledWith({
      type: "name-the-class",
      questionCount: 10,
    });
  });

  it("allows selecting a different quiz type", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    await user.click(screen.getByText("Match Drug to Class"));
    await user.click(screen.getByText("Start Quiz"));

    expect(onStart).toHaveBeenCalledWith({
      type: "match-drug-to-class",
      questionCount: 10,
    });
  });

  it("allows selecting a different question count", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    await user.click(screen.getByText("20"));
    await user.click(screen.getByText("Start Quiz"));

    expect(onStart).toHaveBeenCalledWith({
      type: "name-the-class",
      questionCount: 20,
    });
  });

  it("allows changing both quiz type and question count", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    await user.click(screen.getByText("Brand/Generic Match"));
    await user.click(screen.getByText("5"));
    await user.click(screen.getByText("Start Quiz"));

    expect(onStart).toHaveBeenCalledWith({
      type: "brand-generic-match",
      questionCount: 5,
    });
  });
});
