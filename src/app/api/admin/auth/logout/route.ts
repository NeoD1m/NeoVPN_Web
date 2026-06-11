import { NextRequest } from "next/server";
import { destroyAdminSession, getSessionAdmin } from "@/lib/auth/admin-session";
import { createAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

export async function POST(request: NextRequest) {
  try {
    const admin = await getSessionAdmin();
    if (admin) {
      await createAuditLog({
        actorType: "ADMIN",
        adminId: admin.id,
        action: "admin.logout",
        ipAddress: getClientIp(request),
      });
    }
    await destroyAdminSession();
    return jsonResponse({ message: messages.auth.logoutSuccess });
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}
