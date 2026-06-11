"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { CSRF_HEADER } from "@/lib/csrf-constants";

interface CsrfContextValue {
  csrfToken: string;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  refreshToken: () => Promise<void>;
}

const CsrfContext = createContext<CsrfContextValue | null>(null);

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [csrfToken, setCsrfToken] = useState("");

  const refreshToken = useCallback(async () => {
    const res = await fetch("/api/csrf");
    const data = await res.json();
    setCsrfToken(data.csrfToken);
  }, []);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      if (csrfToken) {
        headers.set(CSRF_HEADER, csrfToken);
      }
      if (!headers.has("Content-Type") && options.body) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(url, { ...options, headers });
    },
    [csrfToken]
  );

  return (
    <CsrfContext.Provider value={{ csrfToken, apiFetch, refreshToken }}>
      {children}
    </CsrfContext.Provider>
  );
}

export function useCsrf() {
  const ctx = useContext(CsrfContext);
  if (!ctx) throw new Error("useCsrf must be used within CsrfProvider");
  return ctx;
}
