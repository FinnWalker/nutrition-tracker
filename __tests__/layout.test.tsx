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

vi.mock("@/components/ui/NavSidebar", () => ({
  default: () => <div>Desktop nav</div>,
}));

vi.mock("@/components/ui/BottomNav", () => ({
  default: () => <div>Bottom nav</div>,
}));

describe("RootLayout", () => {
  it("renders children, shell navigation, and the auth slot", () => {
    render(
      <RootLayout auth={<div>Auth slot</div>}>
        <div>Page content</div>
      </RootLayout>,
    );

    expect(screen.getByText("Page content")).toBeVisible();
    expect(screen.getByText("Desktop nav")).toBeVisible();
    expect(screen.getByText("Bottom nav")).toBeVisible();
    expect(screen.getByText("Auth slot")).toBeVisible();
  });
});
