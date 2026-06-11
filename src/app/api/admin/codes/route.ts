import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionAdmin } from "@/lib/auth/admin-session";
import { generateActivationCodes } from "@/lib/activation-codes";
import { createAuditLog } from "@/lib/audit";
import { validateCsrf } from "@/lib/csrf";
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { exportToCsv, formatDurationDays } from "@/lib/utils";
import { messages } from "@/lib/messages";
import { z } from "zod";

const generateSchema = z.object({
  count: z.number().int().min(1).max(100),
  durationDays: z.number().int().min(1).max(3650),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requireSessionAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const duration = searchParams.get("duration");
    const exportCsv = searchParams.get("export") === "csv";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && ["ACTIVE", "USED", "REVOKED"].includes(status)) {
      where.status = status;
    }
    if (duration) {
      where.durationDays = parseInt(duration, 10);
    }

    const [codes, total] = await Promise.all([
      prisma.activationCode.findMany({
        where,
        skip: exportCsv ? undefined : skip,
        take: exportCsv ? undefined : limit,
        orderBy: { createdAt: "desc" },
        include: {
          usedByUser: { select: { username: true } },
          createdByAdmin: { select: { username: true } },
        },
      }),
      prisma.activationCode.count({ where }),
    ]);

    if (exportCsv) {
      const csv = exportToCsv(
        ["Код", "Длительность", "Статус", "Создан", "Использован", "Пользователь", "Создал"],
        codes.map((c) => [
          c.code,
          formatDurationDays(c.durationDays),
          c.status,
          c.createdAt.toISOString(),
          c.usedAt?.toISOString() ?? "",
          c.usedByUser?.username ?? "",
          c.createdByAdmin.username,
        ])
      );
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="codes-${Date.now()}.csv"`,
        },
      });
    }

    return jsonResponse({
      codes: codes.map((c) => ({
        id: c.id,
        code: c.code,
        durationDays: c.durationDays,
        status: c.status,
        expiresAt: c.expiresAt,
        usedAt: c.usedAt,
        createdAt: c.createdAt,
        usedBy: c.usedByUser?.username ?? null,
        createdBy: c.createdByAdmin.username,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse(messages.auth.unauthorized, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSessionAdmin(request);
    if (!(await validateCsrf(request))) {
      return errorResponse(messages.auth.csrfInvalid, 403);
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const codes = await generateActivationCodes({
      count: parsed.data.count,
      durationDays: parsed.data.durationDays,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdByAdminId: admin.id,
    });

    await createAuditLog({
      actorType: "ADMIN",
      adminId: admin.id,
      action: "admin.codes.generated",
      details: {
        count: parsed.data.count,
        durationDays: parsed.data.durationDays,
      },
    });

    return jsonResponse({
      message: messages.admin.codeGenerated,
      codes,
    }, 201);
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireSessionAdmin(request);
    if (!(await validateCsrf(request))) {
      return errorResponse(messages.auth.csrfInvalid, 403);
    }

    const body = await request.json();
    const { codeId, action } = body;

    if (!codeId) return errorResponse("ID кода обязателен", 400);

    if (action === "revoke") {
      const code = await prisma.activationCode.update({
        where: { id: codeId },
        data: { status: "REVOKED" },
      });

      await createAuditLog({
        actorType: "ADMIN",
        adminId: admin.id,
        action: "admin.code.revoked",
        details: { codeId, code: code.code },
      });

      return jsonResponse({ message: messages.admin.codeRevoked });
    }

    return errorResponse("Неизвестное действие", 400);
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}
