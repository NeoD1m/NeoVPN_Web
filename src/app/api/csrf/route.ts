import { getCsrfToken } from "@/lib/csrf";
import { jsonResponse } from "@/lib/api-response";

export async function GET() {
  const token = await getCsrfToken();
  return jsonResponse({ csrfToken: token });
}
