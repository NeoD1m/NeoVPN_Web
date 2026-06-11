import { z } from "zod";
import { messages } from "./messages";

export const usernameSchema = z
  .string()
  .min(3, messages.validation.usernameMin)
  .max(32, messages.validation.usernameMax)
  .regex(/^[a-zA-Z0-9_-]+$/, messages.validation.usernameFormat);

export const passwordSchema = z
  .string()
  .min(8, messages.validation.passwordMin)
  .max(128, messages.validation.passwordMax);

export const emailSchema = z
  .string()
  .email(messages.validation.emailInvalid)
  .optional()
  .or(z.literal(""));

export const telegramSchema = z
  .string()
  .regex(/^@?[a-zA-Z0-9_]{5,32}$/, messages.validation.telegramInvalid)
  .optional()
  .or(z.literal(""));

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  email: emailSchema,
  telegramUsername: telegramSchema,
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const activationCodeSchema = z.object({
  code: z
    .string()
    .transform((v) => v.toUpperCase().trim())
    .pipe(
      z
        .string()
        .regex(/^NEO-[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/, messages.validation.codeFormat)
    ),
});

export const adminLoginSchema = loginSchema;

export const generateCodesSchema = z.object({
  count: z.number().int().min(1).max(100),
  durationDays: z
    .number()
    .int()
    .min(1, messages.validation.durationMin)
    .max(3650, messages.validation.durationMax),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const remnawaveSettingsSchema = z.object({
  apiUrl: z.string().url("Некорректный URL API"),
  apiKey: z.string().optional(),
  squadName: z.string().min(1, "Укажите название сквада"),
});

export const adminUpdateUserSchema = z.object({
  email: emailSchema,
  telegramUsername: telegramSchema,
  isDisabled: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ActivationCodeInput = z.infer<typeof activationCodeSchema>;
