import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage, { DashboardData } from "@/app/dashboard/page";

const mockAuth = vi.fn();
const mockRedirect = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockRedirect.mockReset();
    mockFindUnique.mockReset();
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("shows the database user id for the signed-in user", async () => {
    mockFindUnique.mockResolvedValue({ id: "user_cuid_123" });

    render(await DashboardData({ email: "ava@example.com" }));

    expect(screen.getByText("user_cuid_123")).toBeVisible();
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: "ava@example.com" },
      select: { id: true },
    });
  });

  it("redirects signed-out visitors to login", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Fdashboard",
    );
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("renders the signed-in shell before loading dashboard data", async () => {
    mockAuth.mockResolvedValue({
      user: {
        name: "Ava Green",
        email: "ava@example.com",
      },
    });
    mockFindUnique.mockResolvedValue({ id: "user_cuid_123" });

    render(await DashboardPage());

    expect(screen.getByText("Dashboard")).toBeVisible();
    expect(screen.getByText("Signed in as Ava Green.")).toBeVisible();
    expect(screen.getByText("Database user ID")).toBeVisible();
  });

  it("shows a fallback message when the user has no database record", async () => {
    mockFindUnique.mockResolvedValue(null);

    render(await DashboardData({ email: "ava@example.com" }));

    expect(screen.getByText("No database record found")).toBeVisible();
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: "ava@example.com" },
      select: { id: true },
    });
  });
});
