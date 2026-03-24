import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./UserMenu";
import { AuthProvider } from "@/contexts/AuthContext";

function renderWithAuth(authResponse: Response) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(authResponse);
  return render(
    <AuthProvider>
      <UserMenu />
    </AuthProvider>
  );
}

describe("AC-001: Sign in button when unauthenticated", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should show 'Sign in' button when not authenticated", async () => {
    renderWithAuth(
      new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
    );

    await waitFor(() => {
      expect(screen.getByText("Sign in")).toBeInTheDocument();
    });
  });

  it("should show loading skeleton initially", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    );

    // Loading state shows a pulse animation div, no sign-in button yet
    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
  });
});

describe("AC-005: Header shows user info when authenticated", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Jane Doe",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should show user name and avatar when authenticated", async () => {
    renderWithAuth(
      new Response(JSON.stringify(mockUser), { status: 200 })
    );

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    const avatar = screen.getByAltText("Jane Doe");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("should show initials when no avatar URL", async () => {
    renderWithAuth(
      new Response(
        JSON.stringify({ ...mockUser, avatarUrl: null }),
        { status: 200 }
      )
    );

    await waitFor(() => {
      expect(screen.getByText("J")).toBeInTheDocument(); // First letter of "Jane Doe"
    });
  });
});

describe("AC-008: Sign out flow", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Jane Doe",
    avatarUrl: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should show dropdown with Sign out when clicking user menu", async () => {
    const user = userEvent.setup();
    renderWithAuth(
      new Response(JSON.stringify(mockUser), { status: 200 })
    );

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("User menu"));

    expect(screen.getByText("Sign out")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("should revert to Sign in button after signing out", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockUser), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("User menu"));
    await user.click(screen.getByText("Sign out"));

    await waitFor(() => {
      expect(screen.getByText("Sign in")).toBeInTheDocument();
    });
  });
});
