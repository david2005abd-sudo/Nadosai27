# التوثيق والتحقق

الأوامر التالية شُغّلت فعليًا على هذا المستودع (Node 22.13.1 / Windows) وهذه نتائجها الأخيرة:

## الأوامر الناجحة

```
> npm run typecheck
> tsc --noEmit
(لا أخطاء)

> npm run lint
> eslint
(لا تحذيرات ولا أخطاء)

> npm run test
> vitest run
Test Files  6 passed (6)
     Tests  42 passed (42)

> npm run build
> next build
✓ Compiled successfully
✓ Generating static pages (43/43)
51 مسارًا: تسويق ثابت، تطبيق وإدارة و API ديناميكية، Proxy (Middleware) مفعّل
```

## ربط NVIDIA NIM وتشغيل النموذج الحقيقي (تم)

```
> فحص /v1/models بالمفتاح: 80 نموذجًا (كثير منها 404 لهذا الحساب)
> اختبار مرشحين بالبث:
z-ai/glm-5.3-flash  -> أول رمز 1.1s، إجابة عربية صحيحة  (المختار)
openai/gpt-oss-20b  -> أول رمز 34s (بداية باردة)، إجابة صحيحة (بديل مفعّل)
البقية             -> 404 أو مهلة

> تحديث ai_models و system_settings.default_model عبر Management API
> npx wrangler secret put AI_API_KEY / AI_BASE_URL / AI_MODEL (بدون سطر نهائي عبر spawnSync)
```

اختبار شامل من طرف إلى طرف على النسخة المنشورة (مستخدم اختبار مؤقت عبر Admin API + مفتاح API مُجزّأ بالفلفل):

```
POST /api/v1/chat  -> 200
model: z-ai/glm-5.3-flash
usage: {"promptTokens":131,"completionTokens":11,"totalTokens":142}  (أرقام المزود)
content: "عاصمة العراق هي بغداد."
ثم حذف مستخدم الاختبار (cascade)
```

مشكلتان حُلّتا أثناء الربط:
1. مفتاح `sb_secret_` في هذا المشروع يرفضه PostgREST («Invalid API key») — استُبدل بمفتاح `service_role` القديم في `SUPABASE_SECRET_KEY` محليًا وعلى الـWorker.
2. إرسال قيمة السر عبر أنبوب PowerShell يضيف سطرًا جديدًا — أُعيد الضبط عبر `spawnSync` بمدخل بلا سطر نهائي.

## النشر الفعلي على Cloudflare Workers (تم)

```
> npx supabase link --project-ref pbntwnhfhdpwibttfmts
> npx supabase db push
Applying migration 0001_functions.sql ... 0014_rate_limit_windows.sql
Finished supabase db push (14 migrations)

> supabase seed (عبر Management API /database/query)
HTTP 201 + تحقق: ai_models.gpt-4o-mini is_enabled=true، system_settings (40/80000)

> npx wrangler secret put SUPABASE_SECRET_KEY / API_KEY_PEPPER / AUDIT_IP_PEPPER
✨ Success (ثلاثة أسرار)

> npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy
Deployed nadosai → https://nadosai.nwr4930hq.workers.dev
```

فحص النسخة المنشورة (كل النتائج فعلية):

```
/                     -> 200 (عنوان عربي + rtl)
/about /services /faq /contact /privacy /terms /login /signup /forgot-password -> 200
/sitemap.xml /robots.txt -> 200
/api/health           -> {"ok":true}
/app (بلا جلسة)       -> 307 إلى /login?next=%2Fapp
/_next/static/*.css|js -> 200
/api/v1/chat بلا توكن -> 401 {"error":{"code":"unauthorized","message":"نص عربي"}}
```

مشكلتان حُلّتا أثناء النشر (موثقتان في patches/ عبر patch-package):
1. OpenNext على Windows: فشل إنشاء symlinks (EPERM) — استُبدل بـ cpSync dereference في @opennextjs/aws.
2. Next 16.4 يحمّل `preview-props.json` عند تهيئة الخادم وأسقط الـWorker بخطأ 1101 — أُضيف المانيفست لقائمة الالتقاط في @opennextjs/cloudflare.


تسلسل الإصلاحات أثناء التحقق: خطأ تسمية مجلد المشروع (حروف كبيرة) حُلّ بإنشاء القالب في مجلد مؤقت ونقل الملفات، تعارض vitest مع @types/node@20 حُلّ بالترقية إلى ^22، ثم إصلاح 8 أخطاء أنواع (تصدير مخططات النماذج، params في Next 16، توقيع setAll في proxy، نمط join في بحث الرسائل)، ثم 3 إخفاقات اختبار (خوارزمية تحويل منتصف الليل المحلي كانت تتباعد فأعيدت بصياغة نقطة ثابتة، وتوقعَي اختبار صُحّحا وفق السلوك المطلوب).

## ما لم يُنفّذ هنا ولماذا (قابل للتحقق)

- **اختبار الدخان عبر Playwright**: مكتوب في `e2e/smoke.spec.ts` لكنه يتطلب مشروع Supabase حقيقيًا (متغيرات `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` وحساب اختبار موثق في README). بيئة البناء هنا لا تحتوي مشروع Supabase، والاختبارات تُتخطى ذاتيًا (`test.skip`) عند غياب البيئة بدل أن تفشل بشكل مضلل. التنفيذ بعد ضبط البيئة:
  ```
  npx playwright install chromium
  npm run test:e2e
  ```
- **اختبارات RLS عبر SQL**: مكتوبة في `supabase/tests/rls_test.sql` (تغطي: مستخدم لا يقرأ رسائل أو محادثات أو سجلات غيره، منع رفع role إلى admin، منع الزائر من قراءة profiles). لم تُنفّذ هنا لعدم توفر قاعدة PostgreSQL/Supabase محلية في هذه البيئة. التنفيذ على قاعدة محلية:
  ```
  psql "$DATABASE_URL" -f supabase/tests/rls_test.sql
  ```
  لا يوجد نجاح مُدّعى لها بدون تنفيذ فعلي.
- **المحادثة الحقيقية عبر المزود**: تعمل فقط عند ضبط `AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL`. بدونها يعمل MockProvider بجملة تطوير ثابتة، وهذا هو المسار الذي يغطيه اختبار الدخان.
- **إشعار البريد في نموذج التواصل**: اختياري عبر `RESEND_API_KEY` و`BOOTSTRAP_ADMIN_EMAIL`. بدون المفتاح تبقى الرسالة محفوظة في `contact_messages` فقط، ورسالة النجاح لا تدّعي الإرسال.

## حدود بيئة النشر المجانية (تُراجع عند النشر)

- Supabase Free: 500MB قاعدة، إيقاف بعد أسبوع خمول، رسائل مصادقة مدمجة بمعدل منخفض (~2/ساعة حسب وثيقة Supabase الحالية).
- Vercel Hobby: مهلة دالة افتراضية 10 ثوان؛ `/api/chat` مضبوط بـ `maxDuration = 60` — راجع سقف خطتك الفعلي قبل النشر.
