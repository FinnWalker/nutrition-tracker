import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "@/app/ui/theme-toggle";

const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockSetTheme.mockReset();
    mockUseTheme.mockReset();
  });

  it("renders a placeholder before mount and the toggle after mount", async () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: "dark",
      setTheme: mockSetTheme,
    });

    const serverMarkup = renderToStaticMarkup(<ThemeToggle />);
    expect(serverMarkup).toContain('aria-hidden="true"');

    render(<ThemeToggle />);
    expect(await screen.findByRole("button")).toBeInTheDocument();
  });

  it("toggles the theme through next-themes", async () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: "light",
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    const button = await screen.findByRole("button");
    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
