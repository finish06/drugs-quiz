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

  it("renders timed mode toggle", () => {
    render(<QuizConfig onStart={vi.fn()} />);
    expect(screen.getByLabelText("Toggle timed mode")).toBeInTheDocument();
  });

  it("enables timed mode and shows time limit options", async () => {
    const user = userEvent.setup();
    render(<QuizConfig onStart={vi.fn()} />);

    await user.click(screen.getByLabelText("Toggle timed mode"));

    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByText("90s")).toBeInTheDocument();
  });

  it("includes timed config in onStart when timed mode is enabled", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<QuizConfig onStart={onStart} />);

    await user.click(screen.getByLabelText("Toggle timed mode"));
    await user.click(screen.getByText("30s"));
    await user.click(screen.getByText("Start Quiz"));

    expect(onStart).toHaveBeenCalledWith({
      type: "name-the-class",
      questionCount: 10,
      timedMode: true,
      timeLimitSeconds: 30,
    });
  });

  it("passes timed config to Quick 5 when timed mode is on", async () => {
    const user = userEvent.setup();
    const onQuick5 = vi.fn();
    render(<QuizConfig onStart={vi.fn()} onQuick5={onQuick5} />);

    await user.click(screen.getByLabelText("Toggle timed mode"));
    await user.click(screen.getByText(/Quick 5/));

    expect(onQuick5).toHaveBeenCalledWith({ timedMode: true, timeLimitSeconds: 60 });
  });

  it("passes undefined timed config to Quick 5 when timed mode is off", async () => {
    const user = userEvent.setup();
    const onQuick5 = vi.fn();
    render(<QuizConfig onStart={vi.fn()} onQuick5={onQuick5} />);

    await user.click(screen.getByText(/Quick 5/));

    expect(onQuick5).toHaveBeenCalledWith(undefined);
  });

  it("shows flagged questions section when count > 0", () => {
    const onReviewFlagged = vi.fn();
    render(<QuizConfig onStart={vi.fn()} flaggedCount={3} onReviewFlagged={onReviewFlagged} />);

    expect(screen.getByText("Flagged Questions")).toBeInTheDocument();
    expect(screen.getByText(/3 questions saved/)).toBeInTheDocument();
    expect(screen.getByText("Review Flagged")).toBeInTheDocument();
  });

  it("does not show flagged section when count is 0", () => {
    render(<QuizConfig onStart={vi.fn()} flaggedCount={0} onReviewFlagged={vi.fn()} />);
    expect(screen.queryByText("Flagged Questions")).not.toBeInTheDocument();
  });

  it("calls onReviewFlagged when Review Flagged is clicked", async () => {
    const user = userEvent.setup();
    const onReviewFlagged = vi.fn();
    render(<QuizConfig onStart={vi.fn()} flaggedCount={5} onReviewFlagged={onReviewFlagged} />);

    await user.click(screen.getByText("Review Flagged"));
    expect(onReviewFlagged).toHaveBeenCalledTimes(1);
  });

  describe("Analytics: Umami event attributes (specs/analytics-events.md)", () => {
    it("AC-001: Start Quiz button has quiz-start umami event with default props", () => {
      render(<QuizConfig onStart={vi.fn()} />);
      const button = screen.getByText("Start Quiz");
      expect(button).toHaveAttribute("data-umami-event", "quiz-start");
      expect(button).toHaveAttribute("data-umami-event-type", "name-the-class");
      expect(button).toHaveAttribute("data-umami-event-questions", "10");
      expect(button).toHaveAttribute("data-umami-event-timed", "off");
    });

    it("AC-003: type attribute reflects selected quiz type", async () => {
      const user = userEvent.setup();
      render(<QuizConfig onStart={vi.fn()} />);
      const button = screen.getByText("Start Quiz");

      await user.click(screen.getByText("Match Drug to Class"));
      expect(button).toHaveAttribute("data-umami-event-type", "match-drug-to-class");

      await user.click(screen.getByText("Brand/Generic Match"));
      expect(button).toHaveAttribute("data-umami-event-type", "brand-generic-match");
    });

    it("AC-004: questions attribute reflects selected count", async () => {
      const user = userEvent.setup();
      render(<QuizConfig onStart={vi.fn()} />);
      const button = screen.getByText("Start Quiz");

      await user.click(screen.getByText("20"));
      expect(button).toHaveAttribute("data-umami-event-questions", "20");

      await user.click(screen.getByText("5"));
      expect(button).toHaveAttribute("data-umami-event-questions", "5");
    });

    it("AC-005: timed attribute shows 'off' when disabled, '{N}s' when enabled", async () => {
      const user = userEvent.setup();
      render(<QuizConfig onStart={vi.fn()} />);
      const button = screen.getByText("Start Quiz");

      expect(button).toHaveAttribute("data-umami-event-timed", "off");

      await user.click(screen.getByLabelText("Toggle timed mode"));
      expect(button).toHaveAttribute("data-umami-event-timed", "60s");

      await user.click(screen.getByText("30s"));
      expect(button).toHaveAttribute("data-umami-event-timed", "30s");
    });
  });
});
