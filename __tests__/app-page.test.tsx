import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home page", () => {
  it("shows the blank-canvas reset state and links to the legacy app", async () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Blank canvas",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "/legacy" })).toHaveAttribute(
      "href",
      "/legacy",
    );
  });
});
