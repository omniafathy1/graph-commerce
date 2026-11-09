import neo4j from "neo4j-driver";
import { describe, expect, it } from "vitest";
import { toNum } from "./toNum";

describe("toNum", () => {
  it("converts a driver Integer to a plain number", () => {
    const value = neo4j.int(450);
    expect(typeof value).toBe("object"); // the original bug: not a number
    expect(toNum(value)).toBe(450);
  });

  it("converts an Integer that has the {low, high} shape", () => {
    expect(toNum(neo4j.int(0))).toBe(0);
    expect(toNum(neo4j.int(-12))).toBe(-12);
  });

  it("returns 0 for null and undefined", () => {
    expect(toNum(null)).toBe(0);
    expect(toNum(undefined)).toBe(0);
  });

  it("passes plain numbers through", () => {
    expect(toNum(12.5)).toBe(12.5);
  });

  it("converts numeric strings", () => {
    expect(toNum("42")).toBe(42);
  });

  it("returns NaN for non-numeric input instead of throwing", () => {
    expect(toNum("abc")).toBeNaN();
  });
});