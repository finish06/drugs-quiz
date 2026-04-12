import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KeyboardHintsOverlay } from "./KeyboardHintsOverlay";

describe("KeyboardHintsOverlay", () => {
  it("renders keyboard shortcut hints", () => {
    render(<KeyboardHintsOverlay onDismiss={vi.fn()} />);
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Select an answer")).toBeInTheDocument();
    expect(screen.getByText("Continue to next question")).toBeInTheDocument();
    expect(screen.getByText("Exit quiz")).toBeInTheDocument();
  });

  it("renders number keys 1-4", () => {
    render(<KeyboardHintsOverlay onDismiss={vi.fn()} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("calls onDismiss when Got it button is clicked", () => {
    const onDismiss = vi.fn();
    render(<KeyboardHintsOverlay onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText("Got it"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when backdrop is clicked", () => {
    const onDismiss = vi.fn();
    const { container } = render(<KeyboardHintsOverlay onDismiss={onDismiss} />);
    const backdrop = container.querySelector("[data-testid='keyboard-hints-backdrop']")!;
    fireEvent.click(backdrop);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss when inner panel is clicked", () => {
    const onDismiss = vi.fn();
    render(<KeyboardHintsOverlay onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText("Keyboard Shortcuts"));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
