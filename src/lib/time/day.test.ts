import { describe, expect, it } from "vitest";
import { getDayRangeUtc, isSameLocalDay, localDateKey } from "@/lib/time/day";

describe("getDayRangeUtc", () => {
  it("يوم بغداد يبدأ 21:00 بالتوقيت العالمي في اليوم السابق", () => {
    const noon = new Date("2026-10-12T09:00:00Z");
    const { start, end } = getDayRangeUtc("Asia/Baghdad", noon);
    expect(start.toISOString()).toBe("2026-10-11T21:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-12T21:00:00.000Z");
  });

  it("لا يستخدم منتصف ليل UTC كحد لليوم", () => {
    const instant = new Date("2026-10-12T23:30:00Z");
    const { start } = getDayRangeUtc("Asia/Baghdad", instant);
    expect(start.toISOString()).not.toBe("2026-10-12T00:00:00.000Z");
    expect(start.toISOString()).toBe("2026-10-12T21:00:00.000Z");
  });

  it("لحظة داخل اليوم تقع بين الحدين", () => {
    const instant = new Date("2026-10-12T12:00:00Z");
    const { start, end } = getDayRangeUtc("Asia/Baghdad", instant);
    expect(instant.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(instant.getTime()).toBeLessThan(end.getTime());
  });

  it("UTC يعطي منتصف ليل UTC", () => {
    const instant = new Date("2026-10-12T12:00:00Z");
    const { start, end } = getDayRangeUtc("UTC", instant);
    expect(start.toISOString()).toBe("2026-10-12T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-13T00:00:00.000Z");
  });
});

describe("localDateKey/isSameLocalDay", () => {
  it("نفس اللحظة نفس المفتاح", () => {
    const instant = new Date("2026-10-12T20:59:59Z");
    expect(localDateKey(instant, "Asia/Baghdad")).toBe("2026-10-12");
  });

  it("لحظتان بعد منتصف ليل بغداد تحملان تاريخ اليوم المحلي", () => {
    const a = new Date("2026-10-11T21:00:00Z");
    const b = new Date("2026-10-12T02:00:00Z");
    expect(isSameLocalDay(a, b, "Asia/Baghdad")).toBe(true);
    expect(isSameLocalDay(a, b, "UTC")).toBe(false);
  });
});
