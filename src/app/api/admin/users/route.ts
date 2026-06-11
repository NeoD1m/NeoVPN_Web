import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionAdmin } from "@/lib/auth/admin-session";
import { hashPassword, generateSecurePassword } from "@/lib/password";
import { adminUpdateUserSchema } from "@/lib/validation";
import {
  getRemnawaveUserByUuid,
  disableRemnawaveUser,
  enableRemnawaveUser,
  deleteRemnawaveUser,
} from "@/lib/remnawave";
import { createAuditLog } from "@/lib/audit";
import { validateCsrf } from "@/lib/csrf";
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { exportToCsv } from "@/lib/utils";
import { messages } from "@/lib/messages";

export async function GET(request: NextRequest) {
  try {
    await requireSessionAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const exportCsv = searchParams.get("export") === "csv";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { telegramUsername: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: exportCsv ? undefined : skip,
        take: exportCsv ? undefined : limit,
        orderBy: { createdAt: "desc" },
        include: { remnawaveMapping: true },
      }),
      prisma.user.count({ where }),
    ]);

    if (exportCsv) {
      const csv = exportToCsv(
        ["ID", "Имя пользователя", "Email", "Telegram", "Статус", "Истекает", "Создан"],
        users.map((u) => [
          u.id,
          u.username,
          u.email,
          u.telegramUsername,
          u.isDisabled ? "Отключён" : "Активен",
          u.remnawaveMapping?.expireAt?.toISOString() ?? "",
          u.createdAt.toISOString(),
        ])
      );
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="users-${Date.now()}.csv"`,
        },
      });
    }

    return jsonResponse({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        telegramUsername: u.telegramUsername,
        isDisabled: u.isDisabled,
        createdAt: u.createdAt,
        remnawave: u.remnawaveMapping
          ? {
              uuid: u.remnawaveMapping.remnawaveUuid,
              expireAt: u.remnawaveMapping.expireAt,
              status: u.remnawaveMapping.status,
              lastSyncAt: u.remnawaveMapping.lastSyncAt,
            }
          : null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse(messages.auth.unauthorized, 401);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireSessionAdmin(request);
    if (!(await validateCsrf(request))) {
      return errorResponse(messages.auth.csrfInvalid, 403);
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) return errorResponse("ID пользователя обязателен", 400);

    const parsed = adminUpdateUserSchema.safeParse(updateData);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const normalizedTelegram = parsed.data.telegramUsername
      ? parsed.data.telegramUsername.startsWith("@")
        ? parsed.data.telegramUsername
        : `@${parsed.data.telegramUsername}`
      : null;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        email: parsed.data.email || null,
        telegramUsername: normalizedTelegram,
        ...(parsed.data.isDisabled !== undefined
          ? { isDisabled: parsed.data.isDisabled }
          : {}),
      },
    });

    if (parsed.data.isDisabled !== undefined) {
      const mapping = await prisma.remnawaveMapping.findUnique({
        where: { userId },
      });
      if (mapping) {
        try {
          if (parsed.data.isDisabled) {
            await disableRemnawaveUser(mapping.remnawaveUuid);
          } else {
            await enableRemnawaveUser(mapping.remnawaveUuid);
          }
        } catch {
          // Log but don't fail
        }
      }
    }

    await createAuditLog({
      actorType: "ADMIN",
      adminId: admin.id,
      action: "admin.user.updated",
      details: { userId, changes: parsed.data },
    });

    return jsonResponse({ message: messages.admin.userUpdated, user });
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireSessionAdmin(request);
    if (!(await validateCsrf(request))) {
      return errorResponse(messages.auth.csrfInvalid, 403);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return errorResponse("ID пользователя обязателен", 400);

    const mapping = await prisma.remnawaveMapping.findUnique({
      where: { userId },
    });

    if (mapping) {
      try {
        await deleteRemnawaveUser(mapping.remnawaveUuid);
      } catch {
        // Continue with local deletion
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    await createAuditLog({
      actorType: "ADMIN",
      adminId: admin.id,
      action: "admin.user.deleted",
      details: { userId },
    });

    return jsonResponse({ message: messages.admin.userDeleted });
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSessionAdmin(request);
    if (!(await validateCsrf(request))) {
      return errorResponse(messages.auth.csrfInvalid, 403);
    }

    const body = await request.json();
    const { action, userId } = body;

    if (action === "reset-password") {
      if (!userId) return errorResponse("ID пользователя обязателен", 400);

      const newPassword = generateSecurePassword(16);
      const passwordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });

      await createAuditLog({
        actorType: "ADMIN",
        adminId: admin.id,
        action: "admin.user.password_reset",
        details: { userId },
      });

      return jsonResponse({
        message: messages.auth.passwordResetSuccess,
        newPassword,
      });
    }

    if (action === "sync-remnawave") {
      if (!userId) return errorResponse("ID пользователя обязателен", 400);

      const mapping = await prisma.remnawaveMapping.findUnique({
        where: { userId },
      });
      if (!mapping) {
        return errorResponse("Remnawave аккаунт не найден", 404);
      }

      const rwUser = await getRemnawaveUserByUuid(mapping.remnawaveUuid);
      await prisma.remnawaveMapping.update({
        where: { userId },
        data: {
          subscriptionUrl: rwUser.subscriptionUrl,
          expireAt: new Date(rwUser.expireAt),
          status: rwUser.status,
          lastSyncAt: new Date(),
        },
      });

      return jsonResponse({ remnawave: rwUser });
    }

    return errorResponse("Неизвестное действие", 400);
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}
