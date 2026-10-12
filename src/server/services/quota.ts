import { QUOTA_NOTIFY_RATIO } from "@/lib/constants";

export interface QuotaLimits {
  dailyMessageLimit: number;
  dailyTokenLimit: number;
}

export interface QuotaState {
  messagesToday: number;
  tokensToday: number;
}

export type QuotaDecision = { allowed: true } | { allowed: false; reason: "messages" | "tokens" };

export function evaluateQuota(state: QuotaState, limits: QuotaLimits): QuotaDecision {
  if (state.messagesToday >= limits.dailyMessageLimit) {
    return { allowed: false, reason: "messages" };
  }
  if (state.tokensToday >= limits.dailyTokenLimit) {
    return { allowed: false, reason: "tokens" };
  }
  return { allowed: true };
}

export function shouldNotifyQuota(state: QuotaState, limits: QuotaLimits): boolean {
  const messageRatio =
    limits.dailyMessageLimit > 0 ? state.messagesToday / limits.dailyMessageLimit : 0;
  const tokenRatio = limits.dailyTokenLimit > 0 ? state.tokensToday / limits.dailyTokenLimit : 0;
  return Math.max(messageRatio, tokenRatio) >= QUOTA_NOTIFY_RATIO;
}

export function shouldInsertQuotaNotification(
  state: QuotaState,
  limits: QuotaLimits,
  alreadyNotifiedToday: boolean,
): boolean {
  if (alreadyNotifiedToday) return false;
  return shouldNotifyQuota(state, limits);
}
