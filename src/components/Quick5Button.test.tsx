import { render, screen, fireEvent } from "@testing-library/react";
import { Quick5Button } from "./Quick5Button";

describe("AC-001: Quick 5 button on home screen", () => {
  it("should render the Quick 5 button", () => {
    render(<Quick5Button onStart={() => {}} />);
    expect(screen.getByRole("button", { name: /quick 5/i })).toBeInTheDocument();
  });
});

describe("AC-002: Visually distinct with lightning bolt", () => {
  it("should have brand accent background class", () => {
    render(<Quick5Button onStart={() => {}} />);
    const button = screen.getByRole("button", { name: /quick 5/i });
    expect(button.className).toMatch(/bg-brand/);
  });

  it("should contain an SVG lightning bolt icon", () => {
    render(<Quick5Button onStart={() => {}} />);
    const button = screen.getByRole("button", { name: /quick 5/i });
    expect(button.querySelector("svg")).not.toBeNull();
  });
});

describe("AC-003: Tapping starts a 5-question quiz", () => {
  it("should call onStart when clicked", () => {
    const onStart = vi.fn();
    render(<Quick5Button onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /quick 5/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe("AC-010: Accessibility", () => {
  it("should have an accessible label", () => {
    render(<Quick5Button onStart={() => {}} />);
    const button = screen.getByRole("button", { name: /quick 5/i });
    expect(button).toBeInTheDocument();
  });
});
