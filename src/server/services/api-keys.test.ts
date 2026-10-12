import { describe, expect, it } from "vitest";
import {
  extractBearerToken,
  generateApiKey,
  hashApiKey,
  isApiKeyUsable,
} from "@/server/services/api-keys";

describe("hashApiKey", () => {
  it("لا يعيد السر نفسه", () => {
    const raw = "nados_abcdef0123456789";
    const hash = hashApiKey(raw, "pepper");
    expect(hash).not.toContain(raw);
    expect(hash).not.toContain("pepper");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("نفس المدخل يعطي نفس التجزئة", () => {
    expect(hashApiKey("nados_x", "p")).toBe(hashApiKey("nados_x", "p"));
  });
});

describe("generateApiKey", () => {
  it("الصيغة والبادئة صحيحتان", () => {
    const generated = generateApiKey("pepper");
    expect(generated.raw.startsWith("nados_")).toBe(true);
    expect(generated.prefix).toBe(generated.raw.slice("nados_".length, "nados_".length + 8));
    expect(generated.prefix).toHaveLength(8);
    expect(generated.hash).not.toBe(generated.raw);
  });
});

describe("isApiKeyUsable", () => {
  it("يرفض المفتاح الملغى", () => {
    expect(isApiKeyUsable({ revoked_at: "2026-01-01T00:00:00Z", expires_at: null })).toBe(false);
  });

  it("يرفض المفتاح المنتهي", () => {
    expect(
      isApiKeyUsable(
        { revoked_at: null, expires_at: "2026-01-01T00:00:00Z" },
        new Date("2026-06-01T00:00:00Z"),
      ),
    ).toBe(false);
  });

  it("يقبل المفتاح الساري", () => {
    expect(
      isApiKeyUsable(
        { revoked_at: null, expires_at: "2099-01-01T00:00:00Z" },
        new Date("2026-06-01T00:00:00Z"),
      ),
    ).toBe(true);
  });
});

describe("extractBearerToken", () => {
  it("يستخرج المفتاح من الترويسة", () => {
    expect(extractBearerToken("Bearer nados_abc12345")).toBe("nados_abc12345");
  });

  it("يرفض الترويسات الأخرى", () => {
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken("Bearer other_abc")).toBeNull();
  });
});
