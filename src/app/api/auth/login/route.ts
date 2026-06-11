import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation";
import {
  authenticateUser,
  createUserSession,
} from "@/lib/auth/user-session";
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
  const rateLimit = await checkRateLimit(`login:${ip}`, 10, 60_000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterMs);

  if (!(await validateCsrf(request))) {
    return errorResponse(messages.auth.csrfInvalid, 403);
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const result = await authenticateUser(
      parsed.data.username,
      parsed.data.password
    );

    if (!result.success) {
      await createAuditLog({
        actorType: "USER",
        action: "user.login_failed",
        details: { username: parsed.data.username },
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return errorResponse(result.error, 401);
    }

    await createUserSession(result.user.id);

    await createAuditLog({
      actorType: "USER",
      userId: result.user.id,
      action: "user.login",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonResponse({
      message: messages.auth.loginSuccess,
      user: result.user,
    });
  } catch (error) {
    console.error("[login]", error);
    const message =
      error instanceof Error && error.message.includes("connect")
        ? "Ошибка подключения к базе данных"
        : messages.general.serverError;
    return errorResponse(message, 500);
  }
}
