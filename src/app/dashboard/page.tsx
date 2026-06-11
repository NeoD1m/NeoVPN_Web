"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  LogOut,
  User,
  Calendar,
  Key,
  ExternalLink,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCsrf } from "@/components/providers/csrf-provider";
import { formatDate, getSubscriptionStatus } from "@/lib/utils";

interface DashboardData {
  user: {
    id: string;
    username: string;
    email: string | null;
    telegramUsername: string | null;
    isDisabled: boolean;
    createdAt: string;
  };
  subscription: {
    status: string | null;
    expireAt: string | null;
    subscriptionUrl: string | null;
    hasRemnawaveAccount: boolean;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { apiFetch } = useCsrf();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setActivationError("");
    setActivationSuccess("");
    setActivating(true);

    try {
      const res = await apiFetch("/api/activation", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      const result = await res.json();

      if (!res.ok) {
        setActivationError(result.error ?? "Ошибка активации");
        return;
      }

      setActivationSuccess(result.message);
      setCode("");

      if (result.subscriptionUrl) {
        setTimeout(() => {
          window.location.href = result.subscriptionUrl;
        }, 1500);
      }

      const refreshed = await fetch("/api/dashboard").then((r) => r.json());
      setData(refreshed);
    } catch {
      setActivationError("Произошла ошибка. Попробуйте позже");
    } finally {
      setActivating(false);
    }
  }

  function copySubscriptionUrl() {
    if (data?.subscription.subscriptionUrl) {
      navigator.clipboard.writeText(data.subscription.subscriptionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const subStatus = getSubscriptionStatus(
    data.subscription.expireAt,
    data.user.isDisabled
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-red-500" />
            <span className="font-bold text-white">NeoVPN</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/60 sm:inline">
              {data.user.username}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Выход
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-white">Личный кабинет</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-red-400" />
                Информация об аккаунте
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-white/50">Имя пользователя</p>
                <p className="font-medium">{data.user.username}</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Email</p>
                <p className="font-medium">{data.user.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Telegram</p>
                <p className="font-medium">{data.user.telegramUsername ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Дата регистрации</p>
                <p className="font-medium">{formatDate(data.user.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-400" />
                Подписка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-white/50">Статус</p>
                <Badge
                  variant={
                    subStatus.variant === "active"
                      ? "success"
                      : subStatus.variant === "expired"
                        ? "warning"
                        : subStatus.variant === "disabled"
                          ? "danger"
                          : "muted"
                  }
                >
                  {subStatus.label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-white/50">Дата окончания</p>
                <p className="font-medium">
                  {formatDate(data.subscription.expireAt)}
                </p>
              </div>
              {data.subscription.subscriptionUrl && (
                <div>
                  <p className="mb-2 text-sm text-white/50">Ссылка на подписку</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copySubscriptionUrl}
                    >
                      {copied ? (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? "Скопировано" : "Копировать"}
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <a
                        href={data.subscription.subscriptionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Открыть
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-red-400" />
              Активация подписки
            </CardTitle>
            <CardDescription>
              Введите код активации в формате NEO-XXX-XXX-XXX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleActivate} className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 space-y-2">
                <Label htmlFor="code" className="sr-only">
                  Код активации
                </Label>
                <Input
                  id="code"
                  placeholder="NEO-ABC-123-XYZ"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase tracking-wider"
                  required
                />
              </div>
              <Button type="submit" disabled={activating} className="sm:self-end">
                {activating ? "Активация..." : "Активировать"}
              </Button>
            </form>
            {activationError && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {activationError}
              </div>
            )}
            {activationSuccess && (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {activationSuccess}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
