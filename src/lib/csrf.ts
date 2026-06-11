import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { CSRF_COOKIE, CSRF_HEADER } from "./csrf-constants";
import { cookieDefaults } from "./cookies";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    ...cookieDefaults(60 * 60 * 24),
  });
}

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE)?.value;
  if (!token) {
    token = generateCsrfToken();
    await setCsrfCookie(token);
  }
  return token;
}

export async function validateCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

export { CSRF_HEADER } from "./csrf-constants";
