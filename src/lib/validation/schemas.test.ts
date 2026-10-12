import { describe, expect, it } from "vitest";
import { chatRequestSchema, v1ChatRequestSchema } from "@/lib/validation/schemas";

describe("chatRequestSchema", () => {
  const base = {
    conversationId: "123e4567-e89b-42d3-a456-426614174000",
    clientMessageId: "123e4567-e89b-42d3-a456-426614174001",
  };

  it("يرفض النص الفارغ", () => {
    const result = chatRequestSchema.safeParse({ ...base, content: "   " });
    expect(result.success).toBe(false);
  });

  it("يرفض النص الأطول من 8000 حرف", () => {
    const result = chatRequestSchema.safeParse({ ...base, content: "أ".repeat(8001) });
    expect(result.success).toBe(false);
  });

  it("يقبل نصًا صحيحًا ويقص الفراغ", () => {
    const result = chatRequestSchema.safeParse({ ...base, content: "  مرحبًا  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.content).toBe("مرحبًا");
  });

  it("يرفض معرفات غير صحيحة", () => {
    const result = chatRequestSchema.safeParse({ ...base, conversationId: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("v1 يقبل جسمًا بدون conversationId", () => {
    const result = v1ChatRequestSchema.safeParse({ content: "مرحبًا" });
    expect(result.success).toBe(true);
  });
});
