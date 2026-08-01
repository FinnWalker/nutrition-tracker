import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LegacyLayout from "@/app/legacy/layout";

vi.mock("@/app/ui/sidebar-nav", () => ({
  default: ({ basePath }: { basePath?: string }) => (
    <nav aria-label="Primary">Primary nav {basePath}</nav>
  ),
}));

describe("LegacyLayout", () => {
  it("keeps the primary navigation in the desktop aside only", () => {
    render(<LegacyLayout>Page content</LegacyLayout>);

    const primaryNavs = screen.getAllByRole("navigation", { name: "Primary" });
    expect(primaryNavs).toHaveLength(1);

    const nav = primaryNavs[0];
    const aside = document.querySelector("aside");
    const main = screen.getByRole("main");

    expect(aside).toHaveClass(
      "hidden",
      "md:sticky",
      "md:top-0",
      "md:flex",
      "md:h-dvh",
      "md:self-start",
      "md:overflow-y-auto",
    );
    expect(aside).toContainElement(nav);
    expect(
      within(main).queryByRole("navigation", { name: "Primary" }),
    ).toBeNull();
  });

  it("opens the primary navigation in a mobile drawer", () => {
    render(<LegacyLayout>Page content</LegacyLayout>);

    expect(screen.getAllByRole("navigation", { name: "Primary" })).toHaveLength(
      1,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" }),
    );

    expect(screen.getAllByRole("navigation", { name: "Primary" })).toHaveLength(
      2,
    );
    expect(
      screen.getByRole("dialog", { name: "Navigation menu" }),
    ).toBeVisible();
  });
});
