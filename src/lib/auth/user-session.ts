import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { verifyPassword } from "../password";
import { messages } from "../messages";
import { cookieDefaults } from "../cookies";

const SESSION_COOKIE = "neovpn_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export interface SessionUser {
  id: string;
  username: string;
  email: string | null;
  telegramUsername: string | null;
}

function generateSessionToken(): string {
  return randomBytes(48).toString("hex");
}

export async function createUserSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.userSession.create({
    data: { sessionToken: token, userId, expires },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    ...cookieDefaults(SESSION_DURATION_MS / 1000),
  });

  return token;
}

export async function destroyUserSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.userSession.deleteMany({ where: { sessionToken: token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  if (session.user.isDisabled) return null;

  return {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    telegramUsername: session.user.telegramUsername,
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error(messages.auth.unauthorized);
  }
  return user;
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<{ success: true; user: SessionUser } | { success: false; error: string }> {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    return { success: false, error: messages.auth.invalidCredentials };
  }

  if (user.isDisabled) {
    return { success: false, error: messages.auth.accountDisabled };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { success: false, error: messages.auth.accountLocked };
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
      failedLoginAttempts: attempts,
    };

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return { success: false, error: messages.auth.invalidCredentials };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      telegramUsername: user.telegramUsername,
    },
  };
}

export { SESSION_COOKIE };
