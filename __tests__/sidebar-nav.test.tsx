import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SidebarNav from "@/app/ui/sidebar-nav";

const mockUsePathname = vi.fn();
const mockUseSession = vi.fn();
const mockUseSearchParams = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe("SidebarNav", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUseSession.mockReset();
    mockUseSearchParams.mockReset();
    mockSignIn.mockReset();
    mockSignOut.mockReset();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders the primary navigation links", async () => {
    mockUsePathname.mockReturnValue("/");
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<SidebarNav />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeVisible();
    expect(
      await screen.findByRole("button", { name: /Switch to .* mode/ }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeVisible();
  });

  it("marks the current page link", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass(
      "bg-brand-muted",
    );
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders the signed-in user profile when user data is provided", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Ava Green",
          email: "ava@example.com",
          image: "https://example.com/avatar.png",
        },
      },
      status: "authenticated",
    });

    render(<SidebarNav />);

    expect(screen.getByText("Ava Green")).toBeVisible();
    expect(screen.getByText("ava@example.com")).toBeVisible();
    expect(screen.getByRole("img", { name: "Ava Green" })).toHaveAttribute(
      "src",
      expect.stringContaining(
        encodeURIComponent("https://example.com/avatar.png"),
      ),
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});
