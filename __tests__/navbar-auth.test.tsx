import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavbarAuth from "@/app/ui/navbar-auth";

const mockSignOut = vi.fn();
const mockUseSession = vi.fn();

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt} src={src} {...props} />
  ),
}));

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
  useSession: () => mockUseSession(),
}));

vi.mock("@/app/ui/google-sign-in-button", () => ({
  default: ({ label }: { label: string }) => (
    <button type="button">{label}</button>
  ),
}));

describe("NavbarAuth", () => {
  beforeEach(() => {
    mockSignOut.mockReset();
    mockUseSession.mockReset();
  });

  it("renders the sign-in CTA for signed-out visitors", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<NavbarAuth />);

    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeVisible();
  });

  it("renders the signed-in user profile when user data is provided", () => {
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

    render(<NavbarAuth />);

    expect(screen.getByText("Ava Green")).toBeVisible();
    expect(screen.getByText("Free plan")).toBeVisible();
    expect(screen.getByRole("img", { name: "Ava Green" })).toHaveAttribute(
      "src",
      "https://example.com/avatar.png",
    );
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });
});
