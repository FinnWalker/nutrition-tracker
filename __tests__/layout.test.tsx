import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

vi.mock("@/app/ui/auth-session-provider", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/app/ui/theme-provider", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/app/ui/theme-toggle", () => ({
  default: () => <button type="button">Theme toggle</button>,
}));

vi.mock("@/app/ui/sidebar-nav", () => ({
  default: () => <nav aria-label="Primary">Primary nav</nav>,
}));

describe("RootLayout", () => {
  it("keeps the primary navigation in the desktop aside only", () => {
    render(<RootLayout auth={null}>Page content</RootLayout>);

    const primaryNavs = screen.getAllByRole("navigation", { name: "Primary" });
    expect(primaryNavs).toHaveLength(1);

    const nav = primaryNavs[0];
    const aside = document.querySelector("aside");
    const main = screen.getByRole("main");

    expect(aside).toHaveClass("hidden", "md:flex");
    expect(aside).toContainElement(nav);
    expect(within(main).queryByRole("navigation", { name: "Primary" })).toBeNull();
  });
});
