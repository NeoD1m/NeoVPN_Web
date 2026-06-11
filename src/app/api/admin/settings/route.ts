import { NextRequest } from "next/server";
import { requireSessionAdmin } from "@/lib/auth/admin-session";
import {
  getRemnawaveConfigForAdmin,
  setSetting,
} from "@/lib/settings";
import { testRemnawaveConnection } from "@/lib/remnawave";
import { remnawaveSettingsSchema } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
import { validateCsrf } from "@/lib/csrf";
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { messages } from "@/lib/messages";

export async function GET(request: NextRequest) {
  try {
    await requireSessionAdmin(request);
    const config = await getRemnawaveConfigForAdmin();
    return jsonResponse({ settings: config });
  } catch {
    return errorResponse(messages.auth.unauthorized, 401);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireSessionAdmin(request);
    if (!(await validateCsrf(request))) {
      return errorResponse(messages.auth.csrfInvalid, 403);
    }

    const body = await request.json();
    const parsed = remnawaveSettingsSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    await setSetting("remnawave_api_url", parsed.data.apiUrl);
    await setSetting("remnawave_squad_name", parsed.data.squadName);

    if (parsed.data.apiKey && parsed.data.apiKey.length > 0) {
      await setSetting("remnawave_api_key", parsed.data.apiKey, true);
    }

    await createAuditLog({
      actorType: "ADMIN",
      adminId: admin.id,
      action: "admin.settings.updated",
      details: { apiUrl: parsed.data.apiUrl, squadName: parsed.data.squadName },
    });

    return jsonResponse({ message: messages.admin.settingsSaved });
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSessionAdmin(request);
    if (!(await validateCsrf(request))) {
      return errorResponse(messages.auth.csrfInvalid, 403);
    }

    const body = await request.json();
    if (body.action === "test-connection") {
      const result = await testRemnawaveConnection();
      return jsonResponse({
        success: result.success,
        message: result.success
          ? messages.admin.connectionSuccess
          : messages.admin.connectionFailed,
        userCount: result.userCount,
        details: result.message,
      });
    }

    return errorResponse("Неизвестное действие", 400);
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}
