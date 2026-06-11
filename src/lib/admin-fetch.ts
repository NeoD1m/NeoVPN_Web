/** Authenticated fetch for admin API routes (includes session cookie). */
export function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    cache: "no-store",
  });
}
