import { prisma } from "./prisma";

const WINDOW_MS = 60_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs = WINDOW_MS
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - (now.getTime() % windowMs));

  await prisma.rateLimitEntry.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  const entry = await prisma.rateLimitEntry.upsert({
    where: {
      key_windowStart: { key, windowStart },
    },
    create: {
      key,
      windowStart,
      count: 1,
      expiresAt: new Date(windowStart.getTime() + windowMs),
    },
    update: { count: { increment: 1 } },
  });

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.expiresAt.getTime() - now.getTime(),
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
