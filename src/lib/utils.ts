import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDurationDays(days: number): string {
  if (days === 7) return "7 дней";
  if (days === 30) return "30 дней";
  if (days === 90) return "90 дней";
  if (days === 180) return "180 дней";
  if (days === 365) return "365 дней";
  return `${days} дн.`;
}

export function getSubscriptionStatus(
  expireAt: Date | string | null | undefined,
  isDisabled?: boolean
): { label: string; variant: "active" | "expired" | "disabled" | "none" } {
  if (isDisabled) {
    return { label: "Отключён", variant: "disabled" };
  }
  if (!expireAt) {
    return { label: "Не активирован", variant: "none" };
  }
  const exp = typeof expireAt === "string" ? new Date(expireAt) : expireAt;
  if (exp > new Date()) {
    return { label: "Активна", variant: "active" };
  }
  return { label: "Истекла", variant: "expired" };
}

export function exportToCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const escape = (val: string | number | null | undefined) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");
}
