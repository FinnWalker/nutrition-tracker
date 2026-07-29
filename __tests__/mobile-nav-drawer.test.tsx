import { fireEvent, render, screen } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it } from "vitest";
import MobileNavDrawer from "@/app/ui/mobile-nav-drawer";

describe("MobileNavDrawer", () => {
  it("closes when the backdrop is clicked", () => {
    render(
      <MobileNavDrawer>
        <nav aria-label="Primary">
          <Link href="/diary">Diary</Link>
        </nav>
      </MobileNavDrawer>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" }),
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Close navigation menu" })[0],
    );

    expect(
      screen.queryByRole("dialog", { name: "Navigation menu" }),
    ).toBeNull();
  });

  it("closes after selecting a navigation link", () => {
    render(
      <MobileNavDrawer>
        <nav aria-label="Primary">
          <Link href="/diary">Diary</Link>
        </nav>
      </MobileNavDrawer>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" }),
    );
    fireEvent.click(screen.getByRole("link", { name: "Diary" }));

    expect(
      screen.queryByRole("dialog", { name: "Navigation menu" }),
    ).toBeNull();
  });
});
