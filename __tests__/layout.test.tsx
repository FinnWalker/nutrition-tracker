import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

vi.mock("@/app/ui/auth-session-provider", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

describe("RootLayout", () => {
  it("renders children and the auth slot without the legacy shell", () => {
    render(
      <RootLayout auth={<div>Auth slot</div>}>
        <div>Page content</div>
      </RootLayout>,
    );

    expect(screen.getByText("Page content")).toBeVisible();
    expect(screen.getByText("Auth slot")).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "Primary" })).toBeNull();
    expect(document.querySelector("aside")).toBeNull();
  });
});
