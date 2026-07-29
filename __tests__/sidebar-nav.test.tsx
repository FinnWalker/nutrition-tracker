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

  it("lets signed-out users open the diary from primary navigation", async () => {
    mockUsePathname.mockReturnValue("/");

    render(await SidebarNav());

    expect(screen.getByText("Auth slot")).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeVisible();
    expect(
      await screen.findByRole("button", { name: /Switch to .* mode/ }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Diary" })).toHaveAttribute(
      "href",
      "/diary",
    );
  });

  it("marks the current page link", async () => {
    mockUsePathname.mockReturnValue("/diary");

    render(await SidebarNav());

    expect(screen.getByRole("link", { name: "Diary" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Diary" })).toHaveClass(
      "bg-brand-muted",
    );
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
