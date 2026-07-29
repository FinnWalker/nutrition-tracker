import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home page", () => {
  it("shows the diary CTA without checking auth state", async () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Nutrition Tracker",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open diary" })).toHaveAttribute(
      "href",
      "/diary",
    );
  });
});
