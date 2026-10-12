import { afterEach, describe, expect, it } from "vitest";
import { getChatProvider } from "@/server/ai/factory";
import { selectContextMessages } from "@/server/services/context";
import { decideDuplicateTurn } from "@/server/services/chat";

const originalKey = process.env.AI_API_KEY;
const originalModel = process.env.AI_MODEL;
const originalBaseURL = process.env.AI_BASE_URL;

afterEach(() => {
  if (originalKey === undefined) delete process.env.AI_API_KEY;
  else process.env.AI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.AI_MODEL;
  else process.env.AI_MODEL = originalModel;
  if (originalBaseURL === undefined) delete process.env.AI_BASE_URL;
  else process.env.AI_BASE_URL = originalBaseURL;
});

describe("getChatProvider", () => {
  it("يختار mock عند غياب المفتاح", () => {
    delete process.env.AI_API_KEY;
    const selection = getChatProvider("gpt-4o-mini");
    expect(selection.isMock).toBe(true);
    expect(selection.provider.name).toBe("mock");
  });

  it("يختار مزود openai عند وجود المفتاح", () => {
    process.env.AI_API_KEY = "sk-test";
    process.env.AI_MODEL = "test-model";
    const selection = getChatProvider("gpt-4o-mini");
    expect(selection.isMock).toBe(false);
    expect(selection.provider.name).toBe("openai");
    expect(selection.model).toBe("test-model");
  });
});

describe("selectContextMessages", () => {
  it("يبقي آخر رسالة مستخدم دائمًا ويسقط الأقدم فوق السقف", () => {
    const selected = selectContextMessages(
      [
        { role: "user", content: "أ".repeat(30000) },
        { role: "assistant", content: "ب" },
        { role: "user", content: "آخر رسالة" },
      ],
      100,
    );
    expect(selected.length).toBe(2);
    expect(selected[0]?.content).toBe("ب");
    expect(selected[selected.length - 1]?.content).toBe("آخر رسالة");
    expect(selected.some((message) => message.content.startsWith("أأأ"))).toBe(false);
  });

  it("يسقط الأقدم حتى يصير التقدير تحت السقف", () => {
    const messages = [
      { role: "user" as const, content: "أ".repeat(3000) },
      { role: "assistant" as const, content: "ب".repeat(3000) },
      { role: "user" as const, content: "ج".repeat(100) },
    ];
    const selected = selectContextMessages(messages, 100);
    expect(selected.length).toBe(1);
  });

  it("لا يتجاوز 20 رسالة", () => {
    const messages = Array.from({ length: 50 }, (_, index) => ({
      role: "user" as const,
      content: `رسالة ${index}`,
    }));
    const selected = selectContextMessages(messages, 100000);
    expect(selected.length).toBe(20);
    expect(selected[selected.length - 1]?.content).toBe("رسالة 49");
  });
});

describe("decideDuplicateTurn", () => {
  it("لا ينشئ رسالة ثانية عند تكرار معرف العميل", () => {
    const decision = decideDuplicateTurn({ id: "u1" }, { content: "الرد" });
    expect(decision.action).not.toBe("insert");
  });

  it("يعيد الرد الموجود عند تكرار معرف العميل مع رد", () => {
    const decision = decideDuplicateTurn({ id: "u1" }, { content: "الرد المحفوظ" });
    expect(decision).toEqual({ action: "replay", assistantContent: "الرد المحفوظ" });
  });

  it("يعيد التوليد للرسالة الموجودة إن كان الرد غائبًا", () => {
    const decision = decideDuplicateTurn({ id: "u1" }, null);
    expect(decision).toEqual({ action: "reuse_existing", userMessageId: "u1" });
  });

  it("يسمح بالإدراج عند غياب التكرار", () => {
    expect(decideDuplicateTurn(null, null)).toEqual({ action: "insert" });
  });
});
