import { getSessionUser } from "@/lib/auth/user-session";
import { prisma } from "@/lib/prisma";
import { getRemnawaveUserByUuid } from "@/lib/remnawave";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return errorResponse(messages.auth.unauthorized, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { remnawaveMapping: true },
    });

    if (!user) {
      return errorResponse(messages.auth.unauthorized, 401);
    }

    let subscriptionUrl = user.remnawaveMapping?.subscriptionUrl ?? null;
    let expireAt = user.remnawaveMapping?.expireAt ?? null;
    let status = user.remnawaveMapping?.status ?? null;

    if (user.remnawaveMapping?.remnawaveUuid) {
      try {
        const rwUser = await getRemnawaveUserByUuid(
          user.remnawaveMapping.remnawaveUuid
        );
        subscriptionUrl = rwUser.subscriptionUrl;
        expireAt = new Date(rwUser.expireAt);
        status = rwUser.status;

        await prisma.remnawaveMapping.update({
          where: { userId: user.id },
          data: {
            subscriptionUrl: rwUser.subscriptionUrl,
            expireAt: new Date(rwUser.expireAt),
            status: rwUser.status,
            lastSyncAt: new Date(),
          },
        });
      } catch {
        // Use cached data if sync fails
      }
    }

    return jsonResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        telegramUsername: user.telegramUsername,
        isDisabled: user.isDisabled,
        createdAt: user.createdAt,
      },
      subscription: {
        status,
        expireAt,
        subscriptionUrl,
        hasRemnawaveAccount: Boolean(user.remnawaveMapping),
      },
    });
  } catch {
    return errorResponse(messages.general.serverError, 500);
  }
}
