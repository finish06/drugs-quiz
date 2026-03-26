import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerBar } from "./TimerBar";

describe("TimerBar", () => {
  it("shows seconds remaining", () => {
    render(<TimerBar secondsLeft={15} fraction={0.5} expired={false} />);
    expect(screen.getByText("15s")).toBeVisible();
  });

  it("shows Time's up when expired", () => {
    render(<TimerBar secondsLeft={0} fraction={0} expired={true} />);
    expect(screen.getByText("Time's up!")).toBeVisible();
  });

  it("renders green bar when fraction > 0.5", () => {
    const { container } = render(<TimerBar secondsLeft={20} fraction={0.7} expired={false} />);
    const bar = container.querySelector(".bg-green-500");
    expect(bar).toBeTruthy();
  });

  it("renders yellow bar when fraction is between 0.25 and 0.5", () => {
    const { container } = render(<TimerBar secondsLeft={10} fraction={0.35} expired={false} />);
    const bar = container.querySelector(".bg-yellow-500");
    expect(bar).toBeTruthy();
  });

  it("renders red bar when fraction < 0.25", () => {
    const { container } = render(<TimerBar secondsLeft={3} fraction={0.1} expired={false} />);
    const bar = container.querySelector(".bg-red-500");
    expect(bar).toBeTruthy();
  });
});
