import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUTH_REDIRECT,
  getSafeCallbackPath,
} from "@/app/lib/auth-redirect";

describe("getSafeCallbackPath", () => {
  it("accepts internal paths", () => {
    expect(getSafeCallbackPath("/dashboard")).toBe("/dashboard");
    expect(getSafeCallbackPath("/meals?day=today")).toBe("/meals?day=today");
  });

  it("rejects external or protocol-relative urls", () => {
    expect(getSafeCallbackPath("https://evil.example")).toBe(
      DEFAULT_AUTH_REDIRECT,
    );
    expect(getSafeCallbackPath("//evil.example")).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("uses the first value from repeated params", () => {
    expect(getSafeCallbackPath(["/dashboard", "/settings"])).toBe("/dashboard");
  });
});
