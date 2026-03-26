import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlagButton } from "./FlagButton";

describe("FlagButton", () => {
  it("renders unflagged state", () => {
    render(<FlagButton flagged={false} onToggle={() => {}} />);
    expect(screen.getByLabelText("Flag this question")).toBeVisible();
  });

  it("renders flagged state", () => {
    render(<FlagButton flagged={true} onToggle={() => {}} />);
    expect(screen.getByLabelText("Unflag this question")).toBeVisible();
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    render(<FlagButton flagged={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByLabelText("Flag this question"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
