import { test, expect, type Page } from "@playwright/test";

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
const hasTestUser =
  hasSupabaseEnv && Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);
const hasOtherConversation = hasTestUser && Boolean(process.env.E2E_OTHER_CONVERSATION_ID);

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("البريد الإلكتروني").fill(process.env.E2E_USER_EMAIL ?? "");
  await page.getByLabel("كلمة المرور").fill(process.env.E2E_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page).toHaveURL(/\/app/);
}

test.describe("التسويق", () => {
  const viewports = [
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ];

  for (const viewport of viewports) {
    test(`الرئيسية تعرض عنوانها العربي بلا تمرير أفقي عند ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("محادثة عربية");
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});

test.describe("المصادقة والتطبيق", () => {
  test.skip(!hasSupabaseEnv, "يتطلب متغيرات Supabase في البيئة");

  test("/app بلا جلسة يحوّل إلى /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
  });

  test.skip(!hasTestUser, "يتطلب E2E_USER_EMAIL و E2E_USER_PASSWORD");

  test("جلسة اختبار: محادثة جديدة ورد وضع التطوير يبقى بعد إعادة التحميل", async ({ page }) => {
    await login(page);
    await page.goto("/app");
    await page.getByRole("button", { name: "محادثة جديدة" }).first().click();
    await expect(page).toHaveURL(/\/app\/c\//);
    await page.getByPlaceholder("اكتب رسالتك…").fill("سؤال اختباري");
    await page.keyboard.press("Enter");
    await expect(page.getByText("هذا وضع تطوير").first()).toBeVisible({ timeout: 30_000 });
    await page.reload();
    await expect(page.getByText("سؤال اختباري").first()).toBeVisible();
    await expect(page.getByText("هذا وضع تطوير").first()).toBeVisible();
  });

  test.skip(!hasOtherConversation, "يتطلب E2E_OTHER_CONVERSATION_ID");

  test("فتح محادثة مستخدم آخر يعيد 404", async ({ page }) => {
    await login(page);
    const response = await page.goto(`/app/c/${process.env.E2E_OTHER_CONVERSATION_ID}`);
    expect(response?.status()).toBe(404);
  });

  test("غير المدير لا يبقى على /admin", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/app/);
  });
});
