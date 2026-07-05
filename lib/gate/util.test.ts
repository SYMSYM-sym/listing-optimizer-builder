import { describe, expect, it } from "vitest";
import { normalize, utf8Bytes, hasNegationContext, equalsNormalized } from "@/lib/gate/util";

describe("gate util", () => {
  it("normalize converts curly quotes and dashes", () => {
    expect(normalize("“Hello” — world")).toBe('"Hello" - world');
  });

  it("normalize decodes entities and collapses whitespace", () => {
    expect(normalize("Fish &amp;   chips")).toBe("Fish & chips");
  });

  it("utf8Bytes counts UTF-8 bytes", () => {
    expect(utf8Bytes("abc")).toBe(3);
    expect(utf8Bytes("café")).toBeGreaterThan(4);
  });

  it("hasNegationContext detects preceding negation", () => {
    const text = "We do not treat diabetes in this product";
    const index = text.indexOf("diabetes");
    expect(hasNegationContext(text, index)).toBe(true);
  });

  it("equalsNormalized compares after normalization", () => {
    expect(equalsNormalized("Hello—world", "Hello-world")).toBe(true);
  });
});
