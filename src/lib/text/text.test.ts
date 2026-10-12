import { describe, expect, it } from "vitest";
import { truncateTitle } from "@/lib/text/title";
import { estimateTokens } from "@/lib/text/estimate";
import { escapeHtml, escapeLikePattern } from "@/lib/text/escape";

describe("truncateTitle", () => {
  it("truncates to 40 unicode code points", () => {
    const input = "\u0623".repeat(60);
    const result = truncateTitle(input, 40);
    expect(Array.from(result).length).toBe(40);
  });

  it("does not break surrogate pairs", () => {
    const emoji = "\u{1F602}";
    const input = emoji.repeat(50);
    const result = truncateTitle(input, 40);
    expect(result).toBe(emoji.repeat(40));
    for (const char of Array.from(result)) {
      expect(char).toBe(emoji);
    }
  });

  it("cuts at a word boundary when possible", () => {
    const words = Array.from({ length: 30 }, () => "\u0643\u0644\u0645\u0629").join(" ");
    const result = truncateTitle(words, 40);
    const chars = Array.from(result);
    expect(chars.length).toBeLessThanOrEqual(40);
    expect(result.trim()).toBe(result);
    expect(result.endsWith("\u0643\u0644\u0645\u0629")).toBe(true);
  });

  it("trims extra spaces", () => {
    const expected =
      "\u0645\u0631\u062D\u0628\u064B\u0627 \u0628\u0627\u0644\u0639\u0627\u0644\u0645";
    expect(
      truncateTitle(
        "  \u0645\u0631\u062D\u0628\u064B\u0627   \u0628\u0627\u0644\u0639\u0627\u0644\u0645  ",
        40,
      ),
    ).toBe(expected);
  });
});

describe("estimateTokens", () => {
  it("Math.ceil(length / 3)", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("a")).toBe(1);
    expect(estimateTokens("abcd")).toBe(2);
  });
});

describe("escapeHtml", () => {
  it("escapes special characters", () => {
    const input = "<>&\"'";
    const expected = "\u0026lt;\u0026gt;\u0026amp;\u0026quot;\u0026#39;";
    expect(escapeHtml(input)).toBe(expected);
  });
});

describe("escapeLikePattern", () => {
  it("escapes LIKE pattern characters", () => {
    const input = "100%_of\\it";
    const expected = "100\\%\\_of\\\\it";
    expect(escapeLikePattern(input)).toBe(expected);
  });
});
