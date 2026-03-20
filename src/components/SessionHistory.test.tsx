import { render, screen, fireEvent } from "@testing-library/react";
import { SessionHistory } from "./SessionHistory";
import type { SessionRecord } from "@/types/quiz";

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: `session-${Math.random()}`,
    completedAt: new Date().toISOString(),
    quizType: "name-the-class",
    questionCount: 10,
    correctCount: 7,
    percentage: 70,
    ...overrides,
  };
}

describe("AC-002: Collapsible section on home screen", () => {
  it("should render a Recent Sessions heading", () => {
    render(
      <SessionHistory sessions={[]} personalBest={{}} isCollapsed={false} onToggleCollapsed={() => {}} />,
    );
    expect(screen.getByText("Recent Sessions")).toBeInTheDocument();
  });

  it("should be expanded by default when isCollapsed is false", () => {
    render(
      <SessionHistory
        sessions={[makeSession()]}
        personalBest={{ "name-the-class": 70 }}
        isCollapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.getByText(/7\/10/)).toBeInTheDocument();
  });

  it("should hide content when collapsed", () => {
    render(
      <SessionHistory
        sessions={[makeSession()]}
        personalBest={{ "name-the-class": 70 }}
        isCollapsed={true}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.queryByText(/7\/10/)).not.toBeInTheDocument();
  });

  it("should call onToggleCollapsed when header is clicked", () => {
    const onToggle = vi.fn();
    render(
      <SessionHistory sessions={[]} personalBest={{}} isCollapsed={false} onToggleCollapsed={onToggle} />,
    );
    fireEvent.click(screen.getByText("Recent Sessions"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("AC-004: Session entry display", () => {
  it("should show quiz type, score, and percentage", () => {
    render(
      <SessionHistory
        sessions={[makeSession({ quizType: "name-the-class", correctCount: 8, questionCount: 10, percentage: 80 })]}
        personalBest={{ "name-the-class": 80 }}
        isCollapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.getByText("Name the Class")).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
    // Personal best badge + session entry both show percentage
    expect(screen.getAllByText(/80%/).length).toBeGreaterThanOrEqual(1);
  });
});

describe("AC-005: Personal best display", () => {
  it("should show personal best per quiz type", () => {
    render(
      <SessionHistory
        sessions={[makeSession()]}
        personalBest={{ "name-the-class": 90, "match-drug-to-class": 75 }}
        isCollapsed={false}
        onToggleCollapsed={() => {}}
      />,
    );
    expect(screen.getByText(/90%/)).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });
});

describe("AC-008: Empty state", () => {
  it("should show empty state message when no sessions", () => {
    render(
      <SessionHistory sessions={[]} personalBest={{}} isCollapsed={false} onToggleCollapsed={() => {}} />,
    );
    expect(screen.getByText("Complete your first quiz to start tracking progress")).toBeInTheDocument();
  });
});
