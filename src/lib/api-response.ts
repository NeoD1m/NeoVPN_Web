import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function validationErrorResponse(error: ZodError): NextResponse {
  const firstError = error.errors[0]?.message ?? "Ошибка валидации";
  return errorResponse(firstError, 400);
}

export function rateLimitResponse(retryAfterMs?: number): NextResponse {
  const headers: Record<string, string> = {};
  if (retryAfterMs) {
    headers["Retry-After"] = String(Math.ceil(retryAfterMs / 1000));
  }
  return NextResponse.json(
    { error: "Слишком много запросов. Попробуйте позже" },
    { status: 429, headers }
  );
}
