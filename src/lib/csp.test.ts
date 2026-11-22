import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp";

describe("buildCsp", () => {
  const prod = buildCsp({ isDev: false });

  it("forbids plugins and framing", () => {
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("frame-ancestors 'none'");
  });

  it("restricts base and form targets to the same origin", () => {
    expect(prod).toContain("base-uri 'self'");
    expect(prod).toContain("form-action 'self'");
  });

  it("does not allow eval in production", () => {
    expect(prod).not.toContain("unsafe-eval");
  });

  it("allows eval and websockets only in development", () => {
    const dev = buildCsp({ isDev: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain("ws:");
    expect(prod).not.toContain("ws:");
  });

  it("never uses a wildcard source", () => {
    expect(prod).not.toMatch(/\s\*(\s|;|$)/);
  });

  it("is a single line, safe to use as a header value", () => {
    expect(prod).not.toContain("\n");
  });

  it("upgrades insecure requests only when enforcing in production", () => {
    expect(buildCsp({ isDev: false, enforce: true })).toContain("upgrade-insecure-requests");
    expect(prod).not.toContain("upgrade-insecure-requests");
    expect(buildCsp({ isDev: true, enforce: true })).not.toContain("upgrade-insecure-requests");
  });
});