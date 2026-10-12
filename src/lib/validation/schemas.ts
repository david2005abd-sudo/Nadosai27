import { z } from "zod";
import { ar } from "@/messages/ar";
import { BIO_MAX, FULL_NAME_MAX, MAX_USER_CONTENT } from "@/lib/constants";
import { isValidTimeZone } from "@/lib/time/timezone";

const byteLength = (value: string): number => new TextEncoder().encode(value).length;

export const passwordSchema = z
  .string()
  .refine((value) => byteLength(value) >= 8 && byteLength(value) <= 72, {
    message: ar.auth.signup.weakPassword,
  });

export const emailSchema = z.email({ message: ar.auth.signup.invalidEmail }).max(200);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: ar.common.required }),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, { message: ar.common.required }).max(FULL_NAME_MAX),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const chatRequestSchema = z.object({
  conversationId: z.uuid(),
  content: z
    .string()
    .trim()
    .min(1, { message: ar.app.chat.emptyMessage })
    .max(MAX_USER_CONTENT, { message: ar.app.chat.tooLongMessage }),
  clientMessageId: z.uuid(),
});

export const v1ChatRequestSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: ar.app.chat.emptyMessage })
    .max(MAX_USER_CONTENT, { message: ar.app.chat.tooLongMessage }),
  conversationId: z.uuid().optional(),
});

export const conversationCreateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const conversationUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { message: ar.common.required })
      .max(120, {
        message: ar.app.sidebar.titleTooLong,
      })
      .optional(),
    isArchived: z.boolean().optional(),
    isPinned: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: ar.errors.invalid,
  });

export const feedbackSchema = z.object({
  vote: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const snippetCreateSchema = z.object({
  title: z.string().trim().min(1, { message: ar.app.library.titleRequired }).max(120),
  content: z.string().trim().min(1, { message: ar.app.library.contentRequired }).max(8000),
  sourceMessageId: z.uuid().optional(),
});

export const profileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(1).max(FULL_NAME_MAX).optional(),
    username: z
      .union([
        z
          .string()
          .trim()
          .regex(/^[a-z0-9_]{3,20}$/, { message: ar.app.settings.usernameHint }),
        z.literal(""),
      ])
      .optional(),
    bio: z.string().trim().max(BIO_MAX, { message: ar.app.settings.bioHint }).optional(),
    theme: z.enum(["dark", "light", "system"]).optional(),
    locale: z.enum(["ar"]).optional(),
    timezone: z
      .string()
      .max(60)
      .refine(isValidTimeZone, { message: ar.app.settings.timezoneHint })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: ar.errors.invalid });

export const contactSchema = z.object({
  name: z.string().trim().min(1, { message: ar.common.required }).max(80),
  email: emailSchema,
  subject: z.string().trim().min(1, { message: ar.common.required }).max(120),
  message: z.string().trim().min(1, { message: ar.common.required }).max(4000),
  company: z.string().max(200).optional(),
});

export const apiKeyCreateSchema = z.object({
  name: z.string().trim().min(1, { message: ar.app.apiKeys.nameRequired }).max(60),
});

export const accountDeleteSchema = z.object({
  confirm: z.literal("حذف", { message: ar.app.settings.deleteWordLabel }),
});

export const notificationsReadSchema = z
  .object({
    id: z.uuid().optional(),
    all: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.id) || value.all === true, { message: ar.errors.invalid });

export const adminUserUpdateSchema = z
  .object({
    isActive: z.boolean().optional(),
    role: z.enum(["user", "admin"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: ar.errors.invalid });

export const adminModelUpdateSchema = z
  .object({
    isEnabled: z.boolean().optional(),
    setDefault: z.literal(true).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: ar.errors.invalid });

export const adminSettingsUpdateSchema = z.object({
  dailyMessageLimit: z.number().int().min(1).max(100000),
  dailyTokenLimit: z.number().int().min(100).max(100000000),
});

export const adminInboxUpdateSchema = z.object({
  status: z.enum(["new", "read", "closed"]),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});
