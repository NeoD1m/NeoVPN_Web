"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Ban } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCsrf } from "@/components/providers/csrf-provider";
import { formatDate, formatDurationDays } from "@/lib/utils";

const DURATION_PRESETS = [
  { label: "7 дней", days: 7 },
  { label: "30 дней", days: 30 },
  { label: "90 дней", days: 90 },
  { label: "180 дней", days: 180 },
  { label: "365 дней", days: 365 },
];

interface CodeRow {
  id: string;
  code: string;
  durationDays: number;
  status: string;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
  usedBy: string | null;
  createdBy: string;
}

export default function AdminCodesPage() {
  const router = useRouter();
  const { apiFetch } = useCsrf();
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    count: 1,
    durationDays: 30,
    customDays: "",
  });
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (durationFilter) params.set("duration", durationFilter);
    const res = await fetch(`/api/admin/codes?${params}`);
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setCodes(data.codes ?? []);
    setLoading(false);
  }, [statusFilter, durationFilter, router]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const durationDays = generateForm.customDays
      ? parseInt(generateForm.customDays, 10)
      : generateForm.durationDays;

    const res = await apiFetch("/api/admin/codes", {
      method: "POST",
      body: JSON.stringify({
        count: generateForm.count,
        durationDays,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setGeneratedCodes(data.codes);
      setShowGenerate(false);
      loadCodes();
    }
  }

  async function handleRevoke(codeId: string) {
    if (!confirm("Отозвать этот код?")) return;
    await apiFetch("/api/admin/codes", {
      method: "PATCH",
      body: JSON.stringify({ codeId, action: "revoke" }),
    });
    loadCodes();
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "danger" | "muted"> = {
      ACTIVE: "success",
      USED: "muted",
      REVOKED: "danger",
    };
    const labels: Record<string, string> = {
      ACTIVE: "Активен",
      USED: "Использован",
      REVOKED: "Отозван",
    };
    return (
      <Badge variant={variants[status] ?? "muted"}>
        {labels[status] ?? status}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Коды активации</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="USED">Использованные</option>
            <option value="REVOKED">Отозванные</option>
          </select>
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="">Все длительности</option>
            {DURATION_PRESETS.map((p) => (
              <option key={p.days} value={p.days}>
                {p.label}
              </option>
            ))}
          </select>
          <Button variant="outline" asChild>
            <a href={`/api/admin/codes?export=csv&status=${statusFilter}&duration=${durationFilter}`}>
              CSV
            </a>
          </Button>
          <Button onClick={() => setShowGenerate(!showGenerate)}>
            <Plus className="mr-2 h-4 w-4" />
            Сгенерировать
          </Button>
        </div>
      </div>

      {generatedCodes.length > 0 && (
        <Card className="mb-6 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-emerald-300">Сгенерированные коды</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {generatedCodes.map((c) => (
                <div key={c} className="rounded bg-black/40 px-3 py-2">
                  {c}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => setGeneratedCodes([])}
            >
              Закрыть
            </Button>
          </CardContent>
        </Card>
      )}

      {showGenerate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Генерация кодов</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={generateForm.count}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        count: parseInt(e.target.value, 10),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Длительность</Label>
                  <select
                    value={generateForm.durationDays}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        durationDays: parseInt(e.target.value, 10),
                        customDays: "",
                      })
                    }
                    className="flex h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white"
                  >
                    {DURATION_PRESETS.map((p) => (
                      <option key={p.days} value={p.days}>
                        {p.label}
                      </option>
                    ))}
                    <option value={0}>Произвольная</option>
                  </select>
                </div>
                {generateForm.durationDays === 0 && (
                  <div className="space-y-2">
                    <Label>Дней (произвольно)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={3650}
                      value={generateForm.customDays}
                      onChange={(e) =>
                        setGenerateForm({
                          ...generateForm,
                          customDays: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit">Сгенерировать</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGenerate(false)}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="p-4">Код</th>
                  <th className="p-4">Длительность</th>
                  <th className="p-4">Статус</th>
                  <th className="p-4">Использован</th>
                  <th className="p-4">Пользователь</th>
                  <th className="p-4">Создан</th>
                  <th className="p-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/50">
                      Загрузка...
                    </td>
                  </tr>
                ) : codes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/50">
                      Коды не найдены
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => (
                    <tr key={code.id} className="border-b border-white/5">
                      <td className="p-4 font-mono font-medium">{code.code}</td>
                      <td className="p-4">{formatDurationDays(code.durationDays)}</td>
                      <td className="p-4">{statusBadge(code.status)}</td>
                      <td className="p-4 text-white/60">
                        {formatDate(code.usedAt)}
                      </td>
                      <td className="p-4 text-white/60">{code.usedBy ?? "—"}</td>
                      <td className="p-4 text-white/60">
                        {formatDate(code.createdAt)}
                      </td>
                      <td className="p-4">
                        {code.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Отозвать"
                            onClick={() => handleRevoke(code.id)}
                          >
                            <Ban className="h-4 w-4 text-red-400" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
