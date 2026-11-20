import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./userAgent";

const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const EDGE_WIN = CHROME_WIN + " Edg/120.0.0.0";
const FIREFOX_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

describe("describeUserAgent", () => {
  it("detects Chrome on Windows", () => {
    expect(describeUserAgent(CHROME_WIN)).toBe("Chrome على Windows");
  });

  it("detects Edge before Chrome", () => {
    expect(describeUserAgent(EDGE_WIN)).toBe("Edge على Windows");
  });

  it("detects Firefox", () => {
    expect(describeUserAgent(FIREFOX_WIN)).toBe("Firefox على Windows");
  });

  it("detects iOS before macOS", () => {
    expect(describeUserAgent(SAFARI_IPHONE)).toBe("Safari على iOS");
  });

  it("detects Android before Linux", () => {
    expect(describeUserAgent(CHROME_ANDROID)).toBe("Chrome على Android");
  });

  it("handles missing user agents", () => {
    expect(describeUserAgent(null)).toBe("جهاز غير معروف");
    expect(describeUserAgent("")).toBe("جهاز غير معروف");
  });
});