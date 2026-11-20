import { describe, expect, it } from "vitest";
import { normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("lowercases the address", () => {
    expect(normalizeEmail("Saraa@Gmail.COM")).toBe("saraa@gmail.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  a@b.com ")).toBe("a@b.com");
  });

  it("leaves an already normalized address unchanged", () => {
    expect(normalizeEmail("a@b.com")).toBe("a@b.com");
  });
});