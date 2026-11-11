import { describe, expect, it } from "vitest";
import { retryAfterSeconds } from "./rateLimit";

const WINDOW = 15 * 60 * 1000;

describe("retryAfterSeconds", () => {
  it("returns the full window right after it starts", () => {
    expect(retryAfterSeconds(1000, 1000, WINDOW)).toBe(900);
  });

  it("returns the remaining time mid-window", () => {
    expect(retryAfterSeconds(0, 5 * 60 * 1000, WINDOW)).toBe(600);
  });

  it("rounds up partial seconds", () => {
    expect(retryAfterSeconds(0, WINDOW - 500, WINDOW)).toBe(1);
  });

  it("never returns a negative number once the window has passed", () => {
    expect(retryAfterSeconds(0, WINDOW + 5000, WINDOW)).toBe(0);
  });

  it("returns 0 exactly at the end of the window", () => {
    expect(retryAfterSeconds(0, WINDOW, WINDOW)).toBe(0);
  });
});