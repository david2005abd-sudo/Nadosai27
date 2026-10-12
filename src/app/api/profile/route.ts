import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { profileUpdateSchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { updateProfile, type ProfileUpdatePatch } from "@/server/repositories/profiles";
import type { Profile } from "@/types/db";

export const runtime = "nodejs";

function toClientProfile(profile: Profile) {
  return {
    id: profile.id,
    fullName: profile.full_name,
    username: profile.username,
    bio: profile.bio,
    locale: profile.locale,
    timezone: profile.timezone,
    theme: profile.theme,
  };
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  const patch: ProfileUpdatePatch = {};
  if (parsed.data.fullName !== undefined) patch.full_name = parsed.data.fullName;
  if (parsed.data.username !== undefined) patch.username = parsed.data.username || null;
  if (parsed.data.bio !== undefined) patch.bio = parsed.data.bio || null;
  if (parsed.data.theme !== undefined) patch.theme = parsed.data.theme;
  if (parsed.data.locale !== undefined) patch.locale = parsed.data.locale;
  if (parsed.data.timezone !== undefined) patch.timezone = parsed.data.timezone;

  const updated = await updateProfile(auth.userId, patch);
  if (!updated) {
    return jsonError(500, "server", ar.app.settings.profileError);
  }

  return Response.json({ profile: toClientProfile(updated) });
}
