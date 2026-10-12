"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { listTimeZones } from "@/lib/time/timezone";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getBrowserSupabase } from "@/server/supabase/client";
import { applyTheme, type ThemeChoice } from "@/components/ui/ThemeSwitch";
import { Dialog } from "@/components/ui/Dialog";
import {
  btnPrimary,
  cardClass,
  inputClass,
  labelClass,
  sectionTitle,
} from "@/components/ui/styles";
import { cn } from "@/lib/utils";

interface ProfileInitial {
  fullName: string;
  username: string;
  bio: string;
  theme: ThemeChoice;
  timezone: string;
}

export function SettingsView({
  email,
  initial,
}: {
  email: string | null;
  initial: ProfileInitial;
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initial.fullName);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [theme, setTheme] = useState<ThemeChoice>(initial.theme);
  const [themeNotice, setThemeNotice] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWord, setDeleteWord] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [timezone, setTimezone] = useState(initial.timezone);
  const [localeNotice, setLocaleNotice] = useState<string | null>(null);
  const [localeError, setLocaleError] = useState<string | null>(null);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileNotice(null);
    setProfileError(null);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          bio: bio.trim(),
        }),
      });
      setProfileNotice(ar.app.settings.profileSaved);
    } catch (error) {
      setProfileError(error instanceof ApiError ? error.message : ar.app.settings.profileError);
    } finally {
      setSavingProfile(false);
    }
  }

  async function selectTheme(choice: ThemeChoice) {
    setTheme(choice);
    applyTheme(choice);
    setThemeNotice(null);
    try {
      await apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify({ theme: choice }) });
    } catch {
      setThemeNotice(ar.app.settings.localeError);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordNotice(null);
    setPasswordError(null);
    try {
      const supabase = getBrowserSupabase();
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email ?? email;
      if (!userEmail) {
        setPasswordError(ar.app.settings.passwordError);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordError(ar.app.settings.passwordWrong);
        return;
      }
      if (new TextEncoder().encode(newPassword).length < 8) {
        setPasswordError(ar.app.settings.passwordTooShort);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordError(ar.app.settings.passwordError);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setPasswordNotice(ar.app.settings.passwordChanged);
    } catch {
      setPasswordError(ar.app.settings.passwordError);
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch("/api/account", {
        method: "DELETE",
        body: JSON.stringify({ confirm: deleteWord.trim() }),
      });
      try {
        const supabase = getBrowserSupabase();
        await supabase.auth.signOut();
      } catch {
        void 0;
      }
      router.replace("/");
      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : ar.app.settings.deleteError);
      setDeleting(false);
    }
  }

  async function saveTimezone(event: React.FormEvent) {
    event.preventDefault();
    setLocaleNotice(null);
    setLocaleError(null);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ timezone, locale: "ar" }),
      });
      setLocaleNotice(ar.app.settings.localeSaved);
    } catch (error) {
      setLocaleError(error instanceof ApiError ? error.message : ar.app.settings.localeError);
    }
  }

  const themeOptions: { value: ThemeChoice; label: string }[] = [
    { value: "dark", label: ar.app.settings.themeDark },
    { value: "light", label: ar.app.settings.themeLight },
    { value: "system", label: ar.app.settings.themeSystem },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-lg font-semibold">{ar.app.settings.title}</h1>

        <section aria-label={ar.app.settings.profile} className={cn(cardClass, "mb-6")}>
          <h2 className={cn(sectionTitle, "mb-4")}>{ar.app.settings.profile}</h2>
          <form onSubmit={saveProfile} className="flex flex-col gap-3" noValidate>
            <div>
              <label htmlFor="settings-name" className={labelClass}>
                {ar.app.settings.fullName}
              </label>
              <input
                id="settings-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                maxLength={80}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="settings-username" className={labelClass}>
                {ar.app.settings.username}
              </label>
              <input
                id="settings-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                dir="ltr"
                maxLength={20}
                className={`${inputClass} text-start`}
              />
              <p className="mt-1 text-xs text-ink-2">{ar.app.settings.usernameHint}</p>
            </div>
            <div>
              <label htmlFor="settings-bio" className={labelClass}>
                {ar.app.settings.bio}
              </label>
              <textarea
                id="settings-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={3}
                maxLength={280}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-ink-2">{ar.app.settings.bioHint}</p>
            </div>
            {profileNotice ? <p className="text-sm text-success">{profileNotice}</p> : null}
            {profileError ? (
              <p role="alert" className="text-sm text-danger">
                {profileError}
              </p>
            ) : null}
            <button type="submit" disabled={savingProfile} className={`${btnPrimary} self-start`}>
              {savingProfile ? ar.common.saving : ar.app.settings.saveProfile}
            </button>
          </form>
        </section>

        <section aria-label={ar.app.settings.appearance} className={cn(cardClass, "mb-6")}>
          <h2 className={cn(sectionTitle, "mb-2")}>{ar.app.settings.appearance}</h2>
          <p className="mb-3 text-sm text-ink-2">{ar.app.settings.themeHint}</p>
          <div
            role="radiogroup"
            aria-label={ar.app.settings.appearance}
            className="flex flex-wrap gap-2"
          >
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={theme === option.value}
                onClick={() => void selectTheme(option.value)}
                className={cn(
                  "min-h-11 rounded-lg border px-4 font-medium",
                  theme === option.value
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-edge hover:bg-raised",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {themeNotice ? <p className="mt-2 text-sm text-danger">{themeNotice}</p> : null}
        </section>

        <section aria-label={ar.app.settings.security} className={cn(cardClass, "mb-6")}>
          <h2 className={cn(sectionTitle, "mb-4")}>{ar.app.settings.security}</h2>
          <form onSubmit={changePassword} className="flex flex-col gap-3" noValidate>
            <div>
              <label htmlFor="settings-current-password" className={labelClass}>
                {ar.app.settings.currentPassword}
              </label>
              <input
                id="settings-current-password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={`${inputClass} text-start`}
              />
            </div>
            <div>
              <label htmlFor="settings-new-password" className={labelClass}>
                {ar.app.settings.newPassword}
              </label>
              <input
                id="settings-new-password"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={`${inputClass} text-start`}
              />
            </div>
            {passwordNotice ? <p className="text-sm text-success">{passwordNotice}</p> : null}
            {passwordError ? (
              <p role="alert" className="text-sm text-danger">
                {passwordError}
              </p>
            ) : null}
            <button type="submit" disabled={savingPassword} className={`${btnPrimary} self-start`}>
              {savingPassword ? ar.common.saving : ar.app.settings.changePassword}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-danger/40 p-4">
            <h3 className="mb-1 font-medium text-danger">{ar.app.settings.dangerZone}</h3>
            <p className="mb-3 text-sm text-ink-2">{ar.app.settings.deleteDesc}</p>
            <button
              type="button"
              className="min-h-11 rounded-lg bg-danger px-4 font-medium text-white"
              onClick={() => {
                setDeleteWord("");
                setDeleteError(null);
                setDeleteOpen(true);
              }}
            >
              {ar.app.settings.deleteButton}
            </button>
          </div>
        </section>

        <section aria-label={ar.app.settings.localeSection} className={cardClass}>
          <h2 className={cn(sectionTitle, "mb-4")}>{ar.app.settings.localeSection}</h2>
          <form onSubmit={saveTimezone} className="flex flex-col gap-3" noValidate>
            <div>
              <span className={labelClass}>{ar.app.settings.language}</span>
              <p className="min-h-11 rounded-lg border border-edge bg-raised px-3 py-2 text-sm">
                {ar.app.settings.languageValue}
              </p>
            </div>
            <div>
              <label htmlFor="settings-timezone" className={labelClass}>
                {ar.app.settings.timezone}
              </label>
              <select
                id="settings-timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className={inputClass}
              >
                {listTimeZones().map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ink-2">{ar.app.settings.timezoneHint}</p>
            </div>
            {localeNotice ? <p className="text-sm text-success">{localeNotice}</p> : null}
            {localeError ? (
              <p role="alert" className="text-sm text-danger">
                {localeError}
              </p>
            ) : null}
            <button type="submit" className={`${btnPrimary} self-start`}>
              {ar.common.save}
            </button>
          </form>
        </section>
      </div>

      <Dialog
        open={deleteOpen}
        title={ar.app.settings.dangerZone}
        onClose={() => setDeleteOpen(false)}
      >
        <p className="mb-3 text-sm text-ink-2">{ar.app.settings.deleteDesc}</p>
        <label htmlFor="delete-word" className={labelClass}>
          {ar.app.settings.deleteWordLabel}
        </label>
        <input
          id="delete-word"
          value={deleteWord}
          onChange={(event) => setDeleteWord(event.target.value)}
          className={inputClass}
          autoComplete="off"
        />
        {deleteError ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {deleteError}
          </p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-danger px-4 font-medium text-white disabled:opacity-50"
            disabled={deleting || deleteWord.trim() !== "حذف"}
            onClick={() => void deleteAccount()}
          >
            {deleting ? ar.common.saving : ar.app.settings.deleteButton}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-edge px-4 font-medium"
            onClick={() => setDeleteOpen(false)}
          >
            {ar.common.cancel}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
