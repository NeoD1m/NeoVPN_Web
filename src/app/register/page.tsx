"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCsrf, parseApiError } from "@/components/providers/csrf-provider";

export default function RegisterPage() {
  const { apiFetch, csrfReady } = useCsrf();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    telegramUsername: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csrfReady) {
      setError("Загрузка защиты формы... Попробуйте снова через секунду");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setError(await parseApiError(res));
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Произошла ошибка. Попробуйте позже");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-500" />
            <span className="text-xl font-bold">NeoVPN</span>
          </Link>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт для доступа к VPN-сервису
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя *</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="username"
                placeholder="latin letters, numbers, _ -"
              />
              <p className="text-xs text-white/40">
                Только латиница, цифры, _ и - (минимум 3 символа)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (необязательно)</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (необязательно)</Label>
              <Input
                id="telegram"
                placeholder="@username"
                value={form.telegramUsername}
                onChange={(e) =>
                  setForm({ ...form, telegramUsername: e.target.value })
                }
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !csrfReady}
            >
              {!csrfReady
                ? "Загрузка..."
                : loading
                  ? "Регистрация..."
                  : "Зарегистрироваться"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-white/50">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-red-400 hover:underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
