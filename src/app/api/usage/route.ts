import { ar } from "@/messages/ar";
import { DEFAULT_MESSAGE_LIMIT, DEFAULT_TOKEN_LIMIT } from "@/lib/constants";
import { formatDateOnly } from "@/lib/format";
import { getDayRangeUtc, localDateKey } from "@/lib/time/day";
import { authenticateApiUser } from "@/server/auth";
import { jsonError } from "@/server/http";
import { countUserMessagesBetween, listUserMessageDates } from "@/server/repositories/messages";
import { getSystemSettings } from "@/server/repositories/settings";
import { listUsageSince, sumTokensBetween } from "@/server/repositories/usage";

export const runtime = "nodejs";

export async function GET() {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  const timezone = auth.profile.timezone;
  const { start, end } = getDayRangeUtc(timezone);
  const settings = await getSystemSettings();

  const eightDaysAgo = new Date(start);
  eightDaysAgo.setUTCDate(eightDaysAgo.getUTCDate() - 8);

  const [messagesToday, tokensToday, usageRows, messageDates] = await Promise.all([
    countUserMessagesBetween(auth.userId, start.toISOString(), end.toISOString()),
    sumTokensBetween(auth.userId, start.toISOString(), end.toISOString()),
    listUsageSince(auth.userId, eightDaysAgo.toISOString()),
    listUserMessageDates(auth.userId, eightDaysAgo.toISOString()),
  ]);

  const tokensByDay = new Map<string, number>();
  for (const row of usageRows) {
    const key = localDateKey(new Date(row.createdAt), timezone);
    tokensByDay.set(key, (tokensByDay.get(key) ?? 0) + row.totalTokens);
  }
  const messagesByDay = new Map<string, number>();
  for (const createdAt of messageDates) {
    const key = localDateKey(new Date(createdAt), timezone);
    messagesByDay.set(key, (messagesByDay.get(key) ?? 0) + 1);
  }

  const days: {
    date: string;
    label: string;
    messages: number;
    tokens: number;
  }[] = [];
  for (let offset = 7; offset >= 1; offset -= 1) {
    const dayStart = new Date(start);
    dayStart.setUTCDate(dayStart.getUTCDate() - offset);
    const key = localDateKey(dayStart, timezone);
    days.push({
      date: key,
      label: formatDateOnly(dayStart, timezone),
      messages: messagesByDay.get(key) ?? 0,
      tokens: tokensByDay.get(key) ?? 0,
    });
  }

  return Response.json({
    today: {
      messages: messagesToday,
      tokens: tokensToday,
      dailyMessageLimit: settings?.daily_message_limit ?? DEFAULT_MESSAGE_LIMIT,
      dailyTokenLimit: settings?.daily_token_limit ?? DEFAULT_TOKEN_LIMIT,
    },
    days,
    timezone,
  });
}
