import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SidebarNav from "@/app/ui/sidebar-nav";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/app/ui/navbar-auth", () => ({
  default: () => <div>Auth slot</div>,
}));

describe("SidebarNav", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it("renders the primary navigation links", () => {
    mockUsePathname.mockReturnValue("/");

    render(<SidebarNav />);

    expect(screen.getByText("Auth slot")).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Diary" })).toHaveAttribute(
      "href",
      "/diary",
    );
    expect(screen.getByRole("link", { name: "Saved Foods" })).toHaveAttribute(
      "href",
      "/food-library",
    );
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "href",
      "/goals",
    );
  });

  it("marks the current page link", () => {
    mockUsePathname.mockReturnValue("/diary");

    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: "Diary" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Diary" })).toHaveClass(
      "bg-brand-muted",
    );
    expect(
      screen.getByRole("link", { name: "Saved Foods" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("can scope links to the legacy namespace", () => {
    mockUsePathname.mockReturnValue("/legacy/diary");

    render(<SidebarNav basePath="/legacy" />);

    expect(screen.getByRole("link", { name: "Diary" })).toHaveAttribute(
      "href",
      "/legacy/diary",
    );
    expect(screen.getByRole("link", { name: "Saved Foods" })).toHaveAttribute(
      "href",
      "/legacy/food-library",
    );
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "href",
      "/legacy/goals",
    );
    expect(screen.getByRole("link", { name: "Diary" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
