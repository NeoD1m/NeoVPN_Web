"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { CSRF_HEADER } from "@/lib/csrf-constants";

interface CsrfContextValue {
  csrfToken: string;
  csrfReady: boolean;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  refreshToken: () => Promise<string>;
}

const CsrfContext = createContext<CsrfContextValue | null>(null);

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Не удалось получить CSRF-токен");
  }
  const data = await res.json();
  return data.csrfToken as string;
}

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState("");
  const [csrfReady, setCsrfReady] = useState(false);
  const tokenRef = useRef("");

  const refreshToken = useCallback(async () => {
    const token = await fetchCsrfToken();
    tokenRef.current = token;
    setCsrfToken(token);
    setCsrfReady(true);
    return token;
  }, []);

  useEffect(() => {
    refreshToken().catch(() => setCsrfReady(false));
  }, [refreshToken]);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let token = tokenRef.current;
      if (!token) {
        token = await refreshToken();
      }

      const headers = new Headers(options.headers);
      headers.set(CSRF_HEADER, token);
      if (!headers.has("Content-Type") && options.body) {
        headers.set("Content-Type", "application/json");
      }

      return fetch(url, {
        ...options,
        headers,
        credentials: "include",
        cache: "no-store",
      });
    },
    [refreshToken]
  );

  return (
    <CsrfContext.Provider
      value={{ csrfToken, csrfReady, apiFetch, refreshToken }}
    >
      {children}
    </CsrfContext.Provider>
  );
}

export function useCsrf() {
  const ctx = useContext(CsrfContext);
  if (!ctx) throw new Error("useCsrf must be used within CsrfProvider");
  return ctx;
}

export async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (data.error as string) ?? "Произошла ошибка";
  } catch {
    return `Ошибка сервера (${res.status})`;
  }
}
