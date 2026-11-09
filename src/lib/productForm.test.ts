import { describe, expect, it } from "vitest";
import { parseProductForm } from "./productForm";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const valid = {
  name: "Phone",
  description: "Good camera",
  category: "Electronics",
  price: "500",
};

describe("parseProductForm", () => {
  it("accepts a valid product", () => {
    const result = parseProductForm(form(valid));
    expect(result).toEqual({
      ok: true,
      data: { name: "Phone", description: "Good camera", category: "Electronics", price: 500 },
    });
  });

  it("trims whitespace from text fields", () => {
    const result = parseProductForm(form({ ...valid, name: "  Phone  " }));
    expect(result.ok && result.data.name).toBe("Phone");
  });

  it("allows an empty description", () => {
    expect(parseProductForm(form({ ...valid, description: "" })).ok).toBe(true);
  });

  it("rejects a missing or blank name", () => {
    expect(parseProductForm(form({ ...valid, name: "" })).ok).toBe(false);
    expect(parseProductForm(form({ ...valid, name: "   " })).ok).toBe(false);
  });

  it("rejects a name longer than 100 characters", () => {
    expect(parseProductForm(form({ ...valid, name: "a".repeat(101) })).ok).toBe(false);
    expect(parseProductForm(form({ ...valid, name: "a".repeat(100) })).ok).toBe(true);
  });

  it("rejects a description longer than 1000 characters", () => {
    expect(parseProductForm(form({ ...valid, description: "a".repeat(1001) })).ok).toBe(false);
  });

  it.each(["0", "-5", "12.5", "abc", ""])("rejects invalid price %j", (price) => {
    expect(parseProductForm(form({ ...valid, price })).ok).toBe(false);
  });

  it("rejects a missing category", () => {
    expect(parseProductForm(form({ ...valid, category: "" })).ok).toBe(false);
  });

  it("returns the submitted values on error so the form can refill", () => {
    const result = parseProductForm(form({ ...valid, price: "-1" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.values).toMatchObject({ name: "Phone", price: "-1" });
    }
  });
});