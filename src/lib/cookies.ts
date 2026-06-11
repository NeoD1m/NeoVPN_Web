/**
 * Cookie options for production behind HTTPS reverse proxy (Caddy).
 */
export function isSecureCookieContext(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return (
    process.env.APP_URL?.startsWith("https://") === true ||
    process.env.NODE_ENV === "production"
  );
}

export function cookieDefaults(maxAge?: number) {
  return {
    httpOnly: true,
    secure: isSecureCookieContext(),
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}
