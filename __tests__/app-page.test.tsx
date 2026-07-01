import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

const mockUseSession = vi.fn();
const mockUsePathname = vi.fn();
const mockUseSearchParams = vi.fn();
const mockSignIn = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

describe("Home page", () => {
  beforeEach(() => {
    mockUseSession.mockReset();
    mockUsePathname.mockReset();
    mockUseSearchParams.mockReset();
    mockSignIn.mockReset();
    mockUsePathname.mockReturnValue("/");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("shows the sign-in CTA when signed out", async () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Nutrition Tracker",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Open dashboard" }),
    ).not.toBeInTheDocument();
  });

  it("shows the dashboard CTA when signed in", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Ava Green",
          email: "ava@example.com",
        },
      },
      status: "authenticated",
    });

    render(<Home />);

    expect(
      screen.queryByRole("link", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });
});
