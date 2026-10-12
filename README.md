# Nados AI

منصة محادثة عربية مبنية على Next.js و Supabase: حساب بالبريد، محادثة ببث تدريجي، سجل محادثات، حدود يومية معلنة، مفاتيح API، ولوحة تحكم للمشرف.

## المتطلبات

- Node.js 22
- مشروع Supabase مع تفعيل المصادقة بالبريد وكلمة المرور

## الإعداد

1. ثبّت الحزم:

```bash
npm install
```

2. انسخ `.env.example` إلى `.env.local` واملأ القيم:

```bash
cp .env.example .env.local
```

الأسماء:

- `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` كما في دليل Supabase SSR الرسمي.
- `SUPABASE_SECRET_KEY`: المفتاح السري، خادمي فقط، لا يبدأ بـ `NEXT_PUBLIC_`.
- `AI_API_KEY` و `AI_BASE_URL` و `AI_MODEL`: مزود متوافق مع OpenAI. بدون `AI_API_KEY` يعمل وضع تطوير صريح (MockProvider) بجملة ثابتة وليست إجابة نموذج.
- `API_KEY_PEPPER` و `AUDIT_IP_PEPPER`: ملحا تجزئة عشوائيان.
- `BOOTSTRAP_ADMIN_EMAIL`: بريد أول مدير.
- `RESEND_API_KEY`: اختياري لإرسال تنبيه بريدي برسائل التواصل.
- `NEXT_PUBLIC_SITE_URL`: عنوان الموقع العام.

3. اربط مشروع Supabase وشغّل الهجرات:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

أو نفّذ ملفات `supabase/migrations` بالترتيب من لوحة Supabase (SQL Editor) ثم `supabase/seed.sql`.

4. شغّل خادم التطوير:

```bash
npm run dev
```

5. في لوحة Supabase (Authentication > URL Configuration) اضبط:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback` و `http://localhost:3000/auth/reset`

## إنشاء أول مدير

أنشئ حسابًا من `/signup`، ثم:

```bash
npm run admin:bootstrap
```

الأمر يضبط `app_metadata.role = "admin"` للحساب المذكور في `BOOTSTRAP_ADMIN_EMAIL`. لا يوجد زر داخل المنتج يفعل ذلك.

## الاختبار

```bash
npm run typecheck   # فحص الأنواع
npm run lint        # ESLint
npm run test        # اختبارات الوحدة (vitest)
npm run build       # بناء الإنتاج
```

### اختبار الدخان (Playwright)

يتطلب متغيرات Supabase. للحصول على جلسة اختبار موثقة:

1. أنشئ مستخدمين اثنين من `/signup` وأكّد البريدَين.
2. أرسل رسالة من المستخدم الثاني واحفظ معرّف محادثته من الرابط `/app/c/<id>`.
3. ضع في البيئة: `E2E_USER_EMAIL` و `E2E_USER_PASSWORD` لجلسة المستخدم الأول، و `E2E_OTHER_CONVERSATION_ID` لمعرّف محادثة المستخدم الثاني.
4. شغّل:

```bash
npx playwright install chromium
npm run test:e2e
```

اختبارات RLS عبر SQL موجودة في `supabase/tests/rls_test.sql` وتُشغّل على قاعدة محلية:

```bash
psql "$DATABASE_URL" -f supabase/tests/rls_test.sql
```

## واجهة المفاتيح الخارجية

```
POST /api/v1/chat
Authorization: Bearer nados_...
{ "content": "نص", "conversationId": "uuid اختياري" }
```

الاستجابة JSON غير متدفق. أنشئ المفتاح من صفحة `/app/api-keys` بعد تسجيل الدخول.

## حدود الخطط المجانية

- Supabase Free: قاعدة 500 ميجابايت، إيقاف بعد أسبوع خمول، ورسائل المصادقة المدمجة محدودة المعدل (حوالي رسالتين في الساعة على القوالب المدمجة).
- Vercel Hobby: دالة Route Handler بحد تنفيذ افتراضي 10 ثوان؛ البث عبر `/api/chat` مضبوط بـ `maxDuration = 60` لكن راجع حدود خطتك عند النشر.
- حدود التطبيق نفسه: 40 رسالة مستخدم أو 80,000 رمز يوميًا (أيهما أسبق)، و20 طلب محادثة خلال 10 دقائق، و1500 رمز إكمال كحد أقصى للرد.

## ما لم يُبنَ في هذا الإصدار

رفع الملفات، البحث في الويب، النماذج المحلية، الدفع والاشتراك، إشعارات البريد للمستخدمين، Web Push، المحادثة الجماعية، استدعاء الأدوات، تطبيق جوال، صفحة حالة خدمة، انتحال شخصية مستخدم، وتسجيل الدخول الاجتماعي. `system_prompt` يبقى null والتوجيه نظام واحد ثابت على الخادم.
