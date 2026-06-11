import { prisma } from "@/lib/prisma";
import { requireSessionAdmin } from "@/lib/auth/admin-session";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

export async function GET() {
  try {
    await requireSessionAdmin();

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      totalCodes,
      usedCodes,
      activeCodes,
      revokedCodes,
      recentUsers,
      recentRegistrations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.remnawaveMapping.count({
        where: { expireAt: { gt: now } },
      }),
      prisma.activationCode.count(),
      prisma.activationCode.count({ where: { status: "USED" } }),
      prisma.activationCode.count({ where: { status: "ACTIVE" } }),
      prisma.activationCode.count({ where: { status: "REVOKED" } }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          remnawaveMapping: {
            select: { expireAt: true, status: true },
          },
        },
      }),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return jsonResponse({
      stats: {
        totalUsers,
        activeUsers,
        totalCodes,
        usedCodes,
        activeCodes,
        revokedCodes,
        recentRegistrations,
        revenuePlaceholder: {
          total: 0,
          currency: "RUB",
          note: "Интеграция с платёжной системой не настроена",
        },
      },
      recentUsers,
    });
  } catch {
    return errorResponse(messages.auth.unauthorized, 401);
  }
}
