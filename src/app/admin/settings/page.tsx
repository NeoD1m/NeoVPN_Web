"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wifi, Save } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsrf } from "@/components/providers/csrf-provider";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { apiFetch } = useCsrf();
  const [form, setForm] = useState({
    apiUrl: "",
    apiKey: "",
    squadName: "MainSquad",
  });
  const [maskedKey, setMaskedKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [message, setMessage] = useState("");
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.settings) {
          setForm({
            apiUrl: data.settings.apiUrl,
            apiKey: "",
            squadName: data.settings.squadName,
          });
          setMaskedKey(data.settings.apiKeyMasked);
          setHasApiKey(data.settings.hasApiKey);
        }
      });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await apiFetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error);
    setLoading(false);
  }

  async function handleTest() {
    setTestResult("Проверка...");
    const res = await apiFetch("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({ action: "test-connection" }),
    });
    const data = await res.json();
    setTestResult(
      data.success
        ? `${data.message}${data.userCount !== undefined ? ` (пользователей: ${data.userCount})` : ""}`
        : `${data.message}: ${data.details ?? ""}`
    );
  }

  return (
    <AdminLayout>
      <h1 className="mb-8 text-2xl font-bold text-white">Настройки Remnawave</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>API Remnawave</CardTitle>
          <CardDescription>
            Настройте подключение к панели Remnawave. API-ключ хранится в зашифрованном виде.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">URL API</Label>
              <Input
                id="apiUrl"
                type="url"
                placeholder="https://panel.example.com"
                value={form.apiUrl}
                onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API-ключ</Label>
              {hasApiKey && (
                <p className="text-xs text-white/40">
                  Текущий ключ: {maskedKey} (оставьте пустым, чтобы не менять)
                </p>
              )}
              <Input
                id="apiKey"
                type="password"
                placeholder={hasApiKey ? "••••••••" : "Bearer token из панели"}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="squadName">Название сквада</Label>
              <Input
                id="squadName"
                placeholder="MainSquad"
                value={form.squadName}
                onChange={(e) => setForm({ ...form, squadName: e.target.value })}
                required
              />
              <p className="text-xs text-white/40">
                Сквад, в который будут добавляться пользователи при активации кода
              </p>
            </div>

            {message && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button type="button" variant="outline" onClick={handleTest}>
                <Wifi className="mr-2 h-4 w-4" />
                Проверить подключение
              </Button>
            </div>

            {testResult && (
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                {testResult}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
