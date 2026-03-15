import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the app header", () => {
    render(<App />);
    expect(screen.getByText("drugs-quiz")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<App />);
    expect(
      screen.getByText(/pharmacy exam prep/i),
    ).toBeInTheDocument();
  });

  it("shows a prompt to select quiz type", () => {
    render(<App />);
    expect(
      screen.getByText(/select a quiz type/i),
    ).toBeInTheDocument();
  });
});
