import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionAdmin } from "@/lib/auth/admin-session";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

export async function GET(request: NextRequest) {
  try {
    await requireSessionAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { username: true } },
          admin: { select: { username: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return jsonResponse({
      logs: logs.map((l) => ({
        id: l.id,
        actorType: l.actorType,
        action: l.action,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
        actor: l.user?.username ?? l.admin?.username ?? "system",
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse(messages.auth.unauthorized, 401);
  }
}
