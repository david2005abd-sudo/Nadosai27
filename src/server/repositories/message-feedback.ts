import { getAdminSupabase } from "@/server/supabase/admin";

export async function upsertVote(
  messageId: string,
  userId: string,
  vote: 1 | -1,
): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("message_feedback")
    .upsert({ message_id: messageId, user_id: userId, vote }, { onConflict: "message_id,user_id" });
  return !error;
}

export async function deleteVote(messageId: string, userId: string): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("message_feedback")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId);
  return !error;
}

export async function getVotesForMessages(
  userId: string,
  messageIds: string[],
): Promise<Map<string, number>> {
  if (messageIds.length === 0) return new Map();
  const { data } = await getAdminSupabase()
    .from("message_feedback")
    .select("message_id, vote")
    .eq("user_id", userId)
    .in("message_id", messageIds);
  const map = new Map<string, number>();
  for (const row of data ?? []) map.set(row.message_id, row.vote);
  return map;
}
