import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";
import { createUserSession } from "@/lib/auth/user-session";
import { createRemnawaveUser, RemnawaveError } from "@/lib/remnawave";
import { createAuditLog } from "@/lib/audit";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  rateLimitResponse,
} from "@/lib/api-response";
import { messages } from "@/lib/messages";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`register:${ip}`, 5, 60_000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterMs);

  if (!(await validateCsrf(request))) {
    return errorResponse(messages.auth.csrfInvalid, 403);
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { username, password, email, telegramUsername } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.username === username) {
        return errorResponse(messages.auth.usernameTaken, 409);
      }
      return errorResponse(messages.auth.emailTaken, 409);
    }

    const passwordHash = await hashPassword(password);
    const normalizedTelegram = telegramUsername
      ? telegramUsername.startsWith("@")
        ? telegramUsername
        : `@${telegramUsername}`
      : null;

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email: email || null,
        telegramUsername: normalizedTelegram,
      },
    });

    let remnawaveUuid: string | null = null;
    let subscriptionUrl: string | null = null;

    try {
      const rwUser = await createRemnawaveUser({
        username,
        email: email || undefined,
        telegramUsername: normalizedTelegram || undefined,
      });
      remnawaveUuid = rwUser.uuid;
      subscriptionUrl = rwUser.subscriptionUrl;

      await prisma.remnawaveMapping.create({
        data: {
          userId: user.id,
          remnawaveUuid: rwUser.uuid,
          remnawaveUsername: rwUser.username,
          subscriptionUrl: rwUser.subscriptionUrl,
          expireAt: new Date(rwUser.expireAt),
          status: rwUser.status,
          lastSyncAt: new Date(),
        },
      });
    } catch (error) {
      await createAuditLog({
        actorType: "SYSTEM",
        userId: user.id,
        action: "remnawave.user.create_failed",
        details: {
          error: error instanceof RemnawaveError ? error.message : String(error),
        },
        ipAddress: ip,
      });
    }

    await createAuditLog({
      actorType: "USER",
      userId: user.id,
      action: "user.registered",
      details: { username, remnawaveCreated: Boolean(remnawaveUuid) },
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    await createUserSession(user.id);

    return jsonResponse({
      message: messages.auth.registrationSuccess,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        telegramUsername: user.telegramUsername,
      },
      remnawaveCreated: Boolean(remnawaveUuid),
      subscriptionUrl,
    }, 201);
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}
