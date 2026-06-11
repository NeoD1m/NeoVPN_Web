import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/user-session";
import { activationCodeSchema } from "@/lib/validation";
import { normalizeActivationCode } from "@/lib/activation-codes";
import {
  updateRemnawaveSubscription,
  RemnawaveError,
} from "@/lib/remnawave";
import { getRemnawaveConfig } from "@/lib/settings";
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
  const rateLimit = await checkRateLimit(`activate:${ip}`, 5, 60_000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterMs);

  if (!(await validateCsrf(request))) {
    return errorResponse(messages.auth.csrfInvalid, 403);
  }

  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse(messages.auth.unauthorized, 401);
    }

    const body = await request.json();
    const parsed = activationCodeSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const code = normalizeActivationCode(parsed.data.code);

    const result = await prisma.$transaction(async (tx) => {
      const activationCode = await tx.activationCode.findUnique({
        where: { code },
      });

      if (!activationCode) {
        throw new Error(messages.activation.notFound);
      }

      if (activationCode.status === "USED") {
        throw new Error(messages.activation.alreadyUsed);
      }

      if (activationCode.status === "REVOKED") {
        throw new Error(messages.activation.revoked);
      }

      if (
        activationCode.expiresAt &&
        activationCode.expiresAt < new Date()
      ) {
        throw new Error(messages.activation.expired);
      }

      const mapping = await tx.remnawaveMapping.findUnique({
        where: { userId: sessionUser.id },
      });

      if (!mapping) {
        throw new Error(messages.activation.noMapping);
      }

      await tx.activationCode.update({
        where: { id: activationCode.id },
        data: {
          status: "USED",
          usedAt: new Date(),
          usedByUserId: sessionUser.id,
        },
      });

      return { activationCode, mapping };
    });

    const config = await getRemnawaveConfig();

    let subscriptionUrl: string;
    let expireAt: Date;

    try {
      const rwUser = await updateRemnawaveSubscription({
        uuid: result.mapping.remnawaveUuid,
        durationDays: result.activationCode.durationDays,
        squadName: config.squadName,
      });

      subscriptionUrl = rwUser.subscriptionUrl;
      expireAt = new Date(rwUser.expireAt);

      await prisma.remnawaveMapping.update({
        where: { userId: sessionUser.id },
        data: {
          subscriptionUrl: rwUser.subscriptionUrl,
          expireAt: new Date(rwUser.expireAt),
          status: rwUser.status,
          lastSyncAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.activationCode.update({
        where: { id: result.activationCode.id },
        data: {
          status: "ACTIVE",
          usedAt: null,
          usedByUserId: null,
        },
      });

      await createAuditLog({
        actorType: "USER",
        userId: sessionUser.id,
        action: "activation.failed",
        details: {
          code,
          error: error instanceof RemnawaveError ? error.message : String(error),
        },
        ipAddress: ip,
      });

      return errorResponse(messages.activation.remnawaveError, 502);
    }

    await createAuditLog({
      actorType: "USER",
      userId: sessionUser.id,
      action: "activation.success",
      details: {
        code,
        durationDays: result.activationCode.durationDays,
        expireAt: expireAt.toISOString(),
      },
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonResponse({
      message: messages.activation.success,
      subscriptionUrl,
      expireAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message in messages.activation) {
      return errorResponse(error.message, 400);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse(messages.general.serverError, 500);
  }
}
