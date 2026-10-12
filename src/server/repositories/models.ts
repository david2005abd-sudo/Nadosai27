import { getAdminSupabase } from "@/server/supabase/admin";
import type { AiModel } from "@/types/db";

export async function listModels(): Promise<AiModel[]> {
  const { data, error } = await getAdminSupabase()
    .from("ai_models")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function getModelBySlug(slug: string): Promise<AiModel | null> {
  const { data, error } = await getAdminSupabase()
    .from("ai_models")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function isModelEnabled(slug: string): Promise<boolean> {
  const model = await getModelBySlug(slug);
  return Boolean(model?.is_enabled);
}

export async function setModelEnabled(slug: string, isEnabled: boolean): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("ai_models")
    .update({ is_enabled: isEnabled })
    .eq("slug", slug);
  return !error;
}
