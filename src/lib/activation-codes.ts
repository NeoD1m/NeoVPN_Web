import { randomBytes } from "crypto";
import { prisma } from "./prisma";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ATTEMPTS = 100;

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(
    bytes,
    (b) => CODE_CHARS[b % CODE_CHARS.length]
  ).join("");
}

export function formatActivationCode(segments: [string, string, string]): string {
  return `NEO-${segments[0]}-${segments[1]}-${segments[2]}`;
}

export async function generateUniqueActivationCode(): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = formatActivationCode([
      randomSegment(3),
      randomSegment(3),
      randomSegment(3),
    ]);

    const existing = await prisma.activationCode.findUnique({
      where: { code },
    });

    if (!existing) return code;
  }

  throw new Error("Не удалось сгенерировать уникальный код активации");
}

export async function generateActivationCodes(params: {
  count: number;
  durationDays: number;
  expiresAt?: Date | null;
  createdByAdminId: string;
}): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < params.count; i++) {
    const code = await generateUniqueActivationCode();
    await prisma.activationCode.create({
      data: {
        code,
        durationDays: params.durationDays,
        expiresAt: params.expiresAt ?? null,
        createdByAdminId: params.createdByAdminId,
        status: "ACTIVE",
      },
    });
    codes.push(code);
  }

  return codes;
}

export function normalizeActivationCode(input: string): string {
  return input.toUpperCase().trim().replace(/\s+/g, "");
}
