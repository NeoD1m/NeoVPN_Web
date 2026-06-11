"use client";

import { useState } from "react";
import { Download, Upload, Database } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCsrf } from "@/components/providers/csrf-provider";

export default function AdminBackupPage() {
  const { apiFetch } = useCsrf();
  const [importSql, setImportSql] = useState("");
  const [message, setMessage] = useState("");

  async function handleCreateBackup() {
    setMessage("Создание резервной копии...");
    const res = await apiFetch("/api/admin/backup", {
      method: "POST",
      body: JSON.stringify({ action: "create-backup" }),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error);
  }

  async function handleImport() {
    if (!importSql.trim()) {
      setMessage("Введите SQL для импорта");
      return;
    }
    if (!confirm("Импорт может перезаписать данные. Продолжить?")) return;

    setMessage("Импорт...");
    const res = await apiFetch("/api/admin/backup", {
      method: "POST",
      body: JSON.stringify({ action: "import", sql: importSql }),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error);
  }

  return (
    <AdminLayout>
      <h1 className="mb-8 text-2xl font-bold text-white">Резервные копии</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-red-400" />
              Экспорт базы данных
            </CardTitle>
            <CardDescription>
              Скачайте полный дамп PostgreSQL для резервного копирования
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <a href="/api/admin/backup?action=export">
                <Download className="mr-2 h-4 w-4" />
                Скачать SQL дамп
              </a>
            </Button>
            <Button variant="outline" onClick={handleCreateBackup}>
              <Database className="mr-2 h-4 w-4" />
              Создать резервную копию на сервере
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-red-400" />
              Импорт базы данных
            </CardTitle>
            <CardDescription>
              Восстановление из SQL дампа. Используйте с осторожностью.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={importSql}
              onChange={(e) => setImportSql(e.target.value)}
              placeholder="-- SQL dump content"
              className="h-40 w-full rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-white"
            />
            <Button variant="destructive" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              Импортировать
            </Button>
          </CardContent>
        </Card>
      </div>

      {message && (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          {message}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Плановое резервное копирование</CardTitle>
          <CardDescription>
            Настройте cron для автоматического резервного копирования (см. docs/BACKUP.md)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-black/40 p-4 text-xs text-white/70 overflow-x-auto">
{`# Ежедневное резервное копирование в 3:00
0 3 * * * docker compose exec -T app npm run backup`}
          </pre>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
