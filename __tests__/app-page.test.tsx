import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

describe("Home page", () => {
  it("redirects visitors to the diary", () => {
    Home();

    expect(mockRedirect).toHaveBeenCalledWith("/diary");
  });
});
