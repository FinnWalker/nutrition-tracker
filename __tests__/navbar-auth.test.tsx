import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavbarAuth from "@/app/ui/navbar-auth";

const mockGetCurrentUserProfile = vi.fn();

vi.mock("@/app/lib/get-current-user-profile", () => ({
  getCurrentUserProfile: (...args: unknown[]) =>
    mockGetCurrentUserProfile(...args),
}));

vi.mock("@/app/ui/google-sign-in-button", () => ({
  default: ({ label }: { label: string }) => (
    <button type="button">{label}</button>
  ),
}));

vi.mock("@/app/ui/sign-out-button", () => ({
  default: () => <button type="button">Sign out</button>,
}));

describe("NavbarAuth", () => {
  beforeEach(() => {
    mockGetCurrentUserProfile.mockReset();
  });

  it("renders the sign-in CTA for signed-out visitors", async () => {
    mockGetCurrentUserProfile.mockResolvedValue(null);

    render(await NavbarAuth());

    expect(
      screen.getByRole("button", { name: "Sign in with Google" }),
    ).toBeVisible();
  });

  it("renders the signed-in user profile when user data is provided", async () => {
    mockGetCurrentUserProfile.mockResolvedValue({
      name: "Ava Green",
      email: "ava@example.com",
      image: "https://example.com/avatar.png",
    });

    render(await NavbarAuth());

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
