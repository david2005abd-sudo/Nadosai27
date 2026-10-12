import { describe, expect, it } from "vitest";
import {
  evaluateQuota,
  shouldInsertQuotaNotification,
  shouldNotifyQuota,
  type QuotaLimits,
  type QuotaState,
} from "@/server/services/quota";

const limits: QuotaLimits = { dailyMessageLimit: 40, dailyTokenLimit: 80000 };

describe("evaluateQuota", () => {
  it("يسمح حتى الرسالة الأربعين", () => {
    const state: QuotaState = { messagesToday: 39, tokensToday: 0 };
    expect(evaluateQuota(state, limits).allowed).toBe(true);
  });

  it("يمنع عند الرسالة 41", () => {
    const state: QuotaState = { messagesToday: 40, tokensToday: 0 };
    const decision = evaluateQuota(state, limits);
    expect(decision).toEqual({ allowed: false, reason: "messages" });
  });

  it("يمنع عند تجاوز الرموز", () => {
    const state: QuotaState = { messagesToday: 3, tokensToday: 80000 };
    const decision = evaluateQuota(state, limits);
    expect(decision).toEqual({ allowed: false, reason: "tokens" });
  });
});

describe("shouldInsertQuotaNotification", () => {
  it("ينبّه عند بلوغ 80٪ من سقف الرسائل", () => {
    const state: QuotaState = { messagesToday: 32, tokensToday: 0 };
    expect(shouldInsertQuotaNotification(state, limits, false)).toBe(true);
  });

  it("لا ينبّه تحت 80٪", () => {
    const state: QuotaState = { messagesToday: 31, tokensToday: 0 };
    expect(shouldInsertQuotaNotification(state, limits, false)).toBe(false);
  });

  it("لا يتكرر في اليوم نفسه", () => {
    const state: QuotaState = { messagesToday: 39, tokensToday: 0 };
    expect(shouldInsertQuotaNotification(state, limits, true)).toBe(false);
  });

  it("ينبّه عند بلوغ 80٪ من سقف الرموز", () => {
    const state: QuotaState = { messagesToday: 1, tokensToday: 64000 };
    expect(shouldNotifyQuota(state, limits)).toBe(true);
  });
});
