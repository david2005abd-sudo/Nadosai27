import { getAdminSupabase } from "@/server/supabase/admin";
import type { Profile } from "@/types/db";

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await getAdminSupabase()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export interface ProfileUpdatePatch {
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
  theme?: string;
  locale?: string;
  timezone?: string;
}

export async function updateProfile(
  id: string,
  patch: ProfileUpdatePatch,
): Promise<Profile | null> {
  const { data, error } = await getAdminSupabase()
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export interface AdminUserListItem {
  id: string;
  email: string | null;
  fullName: string | null;
  username: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

export async function listUsersForAdmin(limit = 100): Promise<AdminUserListItem[]> {
  const admin = getAdminSupabase();
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: limit,
  });
  if (authError || !authData) return [];
  const users = authData.users;
  if (users.length === 0) return [];
  const ids = users.map((user) => user.id);
  const { data: profiles } = await admin.from("profiles").select("*").in("id", ids);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return users.map((user) => {
    const profile = profileById.get(user.id);
    return {
      id: user.id,
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      username: profile?.username ?? null,
      role: profile?.role ?? "user",
      isActive: profile?.is_active ?? true,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
    };
  });
}

export async function setUserActive(id: string, isActive: boolean): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);
  return !error;
}

export async function setUserRole(id: string, role: "user" | "admin"): Promise<boolean> {
  const admin = getAdminSupabase();
  const { error: profileError } = await admin.from("profiles").update({ role }).eq("id", id);
  if (profileError) return false;
  if (role === "admin") {
    const { data: authData } = await admin.auth.admin.getUserById(id);
    if (!authData?.user) return false;
    const { error: authError } = await admin.auth.admin.updateUserById(id, {
      app_metadata: { ...authData.user.app_metadata, role: "admin" },
    });
    return !authError;
  }
  const { data: authData } = await admin.auth.admin.getUserById(id);
  if (!authData?.user) return false;
  const nextMetadata = { ...authData.user.app_metadata };
  delete nextMetadata.role;
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    app_metadata: nextMetadata,
  });
  return !authError;
}

export async function deleteAuthUser(id: string): Promise<boolean> {
  const { error } = await getAdminSupabase().auth.admin.deleteUser(id);
  return !error;
}
