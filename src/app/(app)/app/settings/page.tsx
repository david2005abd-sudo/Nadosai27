import { requireUser } from "@/server/auth";
import { SettingsView } from "@/components/app/SettingsView";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <SettingsView
      email={user.email}
      initial={{
        fullName: user.profile.full_name ?? "",
        username: user.profile.username ?? "",
        bio: user.profile.bio ?? "",
        theme:
          user.profile.theme === "light" || user.profile.theme === "system"
            ? user.profile.theme
            : "dark",
        timezone: user.profile.timezone,
      }}
    />
  );
}
