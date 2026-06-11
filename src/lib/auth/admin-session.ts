import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { verifyPassword } from "../password";
import { messages } from "../messages";
import type { AdminRole } from "@prisma/client";
import { cookieDefaults } from "../cookies";

const ADMIN_SESSION_COOKIE = "neovpn_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

export interface SessionAdmin {
  id: string;
  username: string;
  role: AdminRole;
}

function generateSessionToken(): string {
  return randomBytes(48).toString("hex");
}

export async function createAdminSession(adminId: string): Promise<string> {
  const token = generateSessionToken();
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.adminSession.create({
    data: { sessionToken: token, adminId, expires },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    ...cookieDefaults(SESSION_DURATION_MS / 1000),
    sameSite: "strict",
    path: "/admin",
  });

  return token;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({ where: { sessionToken: token } });
    cookieStore.delete(ADMIN_SESSION_COOKIE);
  }
}

export async function getSessionAdmin(): Promise<SessionAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { sessionToken: token },
    include: { admin: true },
  });

  if (!session || session.expires < new Date()) {
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  if (!session.admin.isActive) return null;

  return {
    id: session.admin.id,
    username: session.admin.username,
    role: session.admin.role,
  };
}

export async function requireSessionAdmin(): Promise<SessionAdmin> {
  const admin = await getSessionAdmin();
  if (!admin) {
    throw new Error(messages.auth.unauthorized);
  }
  return admin;
}

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<
  { success: true; admin: SessionAdmin } | { success: false; error: string }
> {
  const admin = await prisma.admin.findUnique({ where: { username } });

  if (!admin || !admin.isActive) {
    return { success: false, error: messages.admin.invalidCredentials };
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return { success: false, error: messages.auth.accountLocked };
  }

  const valid = await verifyPassword(password, admin.passwordHash);

  if (!valid) {
    const attempts = admin.failedLoginAttempts + 1;
    const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
      failedLoginAttempts: attempts,
    };

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: updateData,
    });

    return { success: false, error: messages.admin.invalidCredentials };
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  return {
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    },
  };
}

export { ADMIN_SESSION_COOKIE };
