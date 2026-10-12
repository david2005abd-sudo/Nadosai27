import { redirect } from "next/navigation";
import { createServerSupabase } from "@/server/supabase/server";
import { getProfileById } from "@/server/repositories/profiles";
import type { Profile } from "@/types/db";

export interface AuthClaims {
  userId: string;
  email: string | null;
  isAdmin: boolean;
}

export interface AppUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
  profile: Profile;
}

interface RawClaims {
  sub?: string;
  email?: string;
  app_metadata?: { role?: string } | null;
}

export async function readClaims(): Promise<AuthClaims | null> {
  let supabase;
  try {
    supabase = await createServerSupabase();
  } catch {
    return null;
  }
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data || !data.claims) return null;
  const claims = data.claims as RawClaims;
  if (!claims.sub) return null;
  return {
    userId: claims.sub,
    email: claims.email ?? null,
    isAdmin: claims.app_metadata?.role === "admin",
  };
}

export async function requireUser(): Promise<AppUser> {
  const claims = await readClaims();
  if (!claims) redirect("/login");
  const profile = await getProfileById(claims.userId);
  if (!profile) redirect("/login");
  return { id: claims.userId, email: claims.email, isAdmin: claims.isAdmin, profile };
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/app");
  return user;
}

export interface ApiAuthResult {
  ok: true;
  userId: string;
  email: string | null;
  isAdmin: boolean;
  profile: Profile;
}

export interface ApiAuthFailure {
  ok: false;
  status: number;
  code: "unauthorized" | "forbidden";
}

export async function authenticateApiUser(): Promise<ApiAuthResult | ApiAuthFailure> {
  const claims = await readClaims();
  if (!claims) return { ok: false, status: 401, code: "unauthorized" };
  const profile = await getProfileById(claims.userId);
  if (!profile) return { ok: false, status: 401, code: "unauthorized" };
  if (!profile.is_active) return { ok: false, status: 403, code: "forbidden" };
  return {
    ok: true,
    userId: claims.userId,
    email: claims.email,
    isAdmin: claims.isAdmin,
    profile,
  };
}

export async function authenticateApiAdmin(): Promise<ApiAuthResult | ApiAuthFailure> {
  const result = await authenticateApiUser();
  if (!result.ok) return result;
  if (!result.isAdmin) return { ok: false, status: 403, code: "forbidden" };
  return result;
}
