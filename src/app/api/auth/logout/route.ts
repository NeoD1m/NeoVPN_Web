import { NextRequest } from "next/server";
import { destroyUserSession, getSessionUser } from "@/lib/auth/user-session";
import { createAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) {
      await createAuditLog({
        actorType: "USER",
        userId: user.id,
        action: "user.logout",
        ipAddress: getClientIp(request),
      });
    }
    await destroyUserSession();
    return jsonResponse({ message: messages.auth.logoutSuccess });
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}
