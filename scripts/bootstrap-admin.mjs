import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL;

if (!url || !secret) {
  console.error("المتغيران NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SECRET_KEY مطلوبان في .env.local");
  process.exit(1);
}
if (!email) {
  console.error("BOOTSTRAP_ADMIN_EMAIL مطلوب في .env.local");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) {
  console.error(error.message);
  process.exit(1);
}

const user = data.users.find((candidate) => (candidate.email ?? "").toLowerCase() === email.toLowerCase());
if (!user) {
  console.error("لا يوجد مستخدم بهذا البريد. أنشئ الحساب أولًا من صفحة إنشاء الحساب ثم أعد الأمر.");
  process.exit(1);
}

const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: { ...user.app_metadata, role: "admin" },
});
if (updateError) {
  console.error(updateError.message);
  process.exit(1);
}

console.log(`تم تعيين ${email} مديرًا عبر app_metadata.role.`);
