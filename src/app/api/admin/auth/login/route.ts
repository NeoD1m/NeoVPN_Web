import { NextRequest } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import {
  authenticateAdmin,
  createAdminSession,
} from "@/lib/auth/admin-session";
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
  const rateLimit = await checkRateLimit(`admin-login:${ip}`, 5, 60_000);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterMs);

  if (!(await validateCsrf(request))) {
    return errorResponse(messages.auth.csrfInvalid, 403);
  }

  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const result = await authenticateAdmin(
      parsed.data.username,
      parsed.data.password
    );

    if (!result.success) {
      await createAuditLog({
        actorType: "ADMIN",
        action: "admin.login_failed",
        details: { username: parsed.data.username },
        ipAddress: ip,
      });
      return errorResponse(result.error, 401);
    }

    await createAdminSession(result.admin.id);

    await createAuditLog({
      actorType: "ADMIN",
      adminId: result.admin.id,
      action: "admin.login",
      ipAddress: ip,
    });

    return jsonResponse({
      message: messages.admin.loginSuccess,
      admin: result.admin,
    });
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}
