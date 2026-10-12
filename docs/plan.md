# خطة Nados AI

## القرارات المقفولة

- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS 4 + React 19. لا TanStack Start ولا Vite ولا Pages Router.
- المصادقة Supabase Auth بالبريد وكلمة المرور فقط عبر @supabase/ssr. حماية الصفحات بـ getClaims. تجديد الجلسة في proxy.ts (Next 16).
- مزود واحد متوافق مع OpenAI عبر حزمتي ai و @ai-sdk/openai مع baseURL. عند غياب AI_API_KEY يعمل MockProvider بجملة تطوير عربية ثابتة و metadata.provider = "mock".
- التوجيه نظام واحد ثابت على الخادم عبر instructions. لا system_prompt من العميل ويبقى null.
- السقف قبل الاتصال بالمزود: 40 رسالة مستخدم في يوم المستخدم (منتصف الليل في profiles.timezone) أو 80000 رمز، أيهما أسبق. التجاوز 429 برسالة عربية.
- حد المعدل 20 طلب محادثة خلال 10 دقائق لكل مستخدم وآخر في جدول rate_limit_windows عبر دالة check_rate_limit ذرية.
- حد الخرج 1500 رمز إكمال. السياق: آخر 20 رسالة غير superseded ثم إسقاط الأقدم حتى تقدير أقل من 6000 رمز إدخال مع إبقاء آخر رسالة مستخدم دائمًا.
- تقدير الرموز Math.ceil(length / 3). أرقام المزود تحفظ إن عادت مع metadata.usageSource = provider أو estimate. لا يعتمد أي رقم من المتصفح.
- إعادة التوليد: superseded = true ثم رسالة مساعد جديدة. لا حذف للقديم.
- الحذف نهائي مع تأكيد. حذف المحادثة يحذف رسائلها وتقييمها ويبقي سجل الاستهلاك مع conversation_id فارغًا.
- حذف الحساب من قسم الأمان بعد كتابة كلمة حذف. الخادم يحذف مستخدم Auth والجداول تتبع on delete cascade.
- التثبيت is_pinned بحد 5. المكتبة مقاطع محفوظة. البحث pg_trgm بحد 20 وتأخير 300 مللي ثانية.
- الثيم الداكن افتراضيًا ويطبق قبل الرسم. الإشعارات داخل التطبيق فقط. التواصل يحفظ في قاعدة البيانات عبر Route Handler مع honeypot وحد 5 طلبات في الساعة لكل مجزأ عنوان.
- /api/v1/chat للمفاتيح الخارجية JSON غير متدفق. البث للواجهة فقط عبر /api/chat.
- أول مدير عبر npm run admin:bootstrap الذي يضبط app_metadata.role = "admin". لا زر داخل المنتج.
- الأسماء في src/messages/ar.ts. المصطلحات: محادثة، نموذج، الرموز، المكتبة، الإشعارات، لوحة التحكم، مفاتيح API.

## شجرة المسارات

- تسويق: / و /about و /services و /contact و /faq و /privacy و /terms و 404.
- مصادقة: /login و /signup و /forgot-password و /auth/callback (Route Handler) و /auth/reset.
- تطبيق: /app و /app/c/[id] و /app/search و /app/library و /app/notifications و /app/settings و /app/usage و /app/api-keys.
- إدارة: /admin و /admin/users و /admin/usage و /admin/models و /admin/inbox و /admin/audit.
- API: /api/health و /api/chat (بث) و /api/conversations و /api/conversations/[id] و /api/conversations/[id]/messages و /api/conversations/[id]/regenerate و /api/messages/[id]/feedback و /api/search و /api/library و /api/library/[id] و /api/notifications و /api/usage و /api/profile و /api/account و /api/api-keys و /api/api-keys/[id] و /api/contact و /api/admin/users/[id] و /api/admin/models/[slug] و /api/admin/settings و /api/admin/inbox/[id] و /api/v1/chat.

## حدود الخطط المجانية (يجب التحقق منها عند النشر)

- Supabase Free: قاعدة بيانات 500 ميجابايت، توقف المشروع بعد أسبوع خمول، نسخ احتياطي يومي لمدة أسبوع، 5 جيجابايت خروج شبكة، 50 ألف مستخدم نشط شهريًا، حد طلبات على حافة البيانات يتأثر بالاستخدام، وسقف حجم الطلب.
- Vercel Hobby: دالة Route Handler بحد أقصى 10 ثوان افتراضيًا وقت التنفيذ. البث يتجاوز المهلة القصيرة للتنفيذ عند الاستجابة التدريجية لكن يجب التحقق من مدة الطلب الفعلية وضبط maxDuration حسب الوثيقة. العرض المجاني شخصي وغير تجاري.
- Supabase Auth: رسائل البريد المدمجة محدودة بمعدل منخفض في الخطة المجانية (حوالي رسالتين في الساعة على قوالب البريد المدمج حسب وثيقة Supabase الحالية). للتوسع: SMTP مخصص لاحقًا.

## ملاحظات تنفيذ

- RLS على كل الجداول مع منح الحد الأدنى. الكتابة على الجداول الحساسة من الخادم بمفتاح السر بعد فحص getClaims.
- كتابة الأدوار في profiles نسخة عرض فقط؛ الحقيقة في app_metadata.role ومحفّز يمنع تغيير role أو is_active من غير المدير.
- day المستخدم يحسب من profiles.timezone والافتراضي Asia/Baghdad، وليس منتصف ليل UTC.
- هذا المستودع لا يعرض مدخلًا لأي بند من قائمة قسم 2 (رفع ملفات، بحث ويب، دفع، إشعارات بريد، أدوات، جوال، دخول اجتماعي).
