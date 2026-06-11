"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Trash2, KeyRound } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCsrf } from "@/components/providers/csrf-provider";
import { adminFetch } from "@/lib/admin-fetch";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  telegramUsername: string | null;
  isDisabled: boolean;
  createdAt: string;
  remnawave: {
    uuid: string;
    expireAt: string | null;
    status: string | null;
    lastSyncAt: string | null;
  } | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { apiFetch } = useCsrf();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const loadUsers = useCallback(async (q = search) => {
    setLoading(true);
    const res = await adminFetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, [search, router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleResetPassword(userId: string) {
    if (!confirm("Сбросить пароль пользователя?")) return;
    const res = await apiFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ action: "reset-password", userId }),
    });
    const data = await res.json();
    if (res.ok) setNewPassword(data.newPassword);
  }

  async function handleToggleDisable(user: UserRow) {
    await apiFetch("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify({
        userId: user.id,
        email: user.email ?? "",
        telegramUsername: user.telegramUsername ?? "",
        isDisabled: !user.isDisabled,
      }),
    });
    loadUsers();
  }

  async function handleDelete(userId: string) {
    if (!confirm("Удалить пользователя? Это действие необратимо.")) return;
    await apiFetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    loadUsers();
  }

  async function handleSync(userId: string) {
    await apiFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ action: "sync-remnawave", userId }),
    });
    loadUsers();
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Пользователи</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadUsers()}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" onClick={() => loadUsers()}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/admin/users?export=csv">CSV</a>
          </Button>
        </div>
      </div>

      {newPassword && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Новый пароль: <code className="font-mono font-bold">{newPassword}</code>
          <Button
            variant="ghost"
            size="sm"
            className="ml-4"
            onClick={() => setNewPassword(null)}
          >
            Закрыть
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="p-4">Пользователь</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Telegram</th>
                  <th className="p-4">Статус</th>
                  <th className="p-4">Подписка до</th>
                  <th className="p-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/50">
                      Загрузка...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/50">
                      Пользователи не найдены
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="p-4 font-medium">{user.username}</td>
                      <td className="p-4 text-white/60">{user.email ?? "—"}</td>
                      <td className="p-4 text-white/60">
                        {user.telegramUsername ?? "—"}
                      </td>
                      <td className="p-4">
                        <Badge variant={user.isDisabled ? "danger" : "success"}>
                          {user.isDisabled ? "Отключён" : "Активен"}
                        </Badge>
                      </td>
                      <td className="p-4 text-white/60">
                        {formatDate(user.remnawave?.expireAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Сбросить пароль"
                            onClick={() => handleResetPassword(user.id)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Синхронизировать Remnawave"
                            onClick={() => handleSync(user.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={user.isDisabled ? "Включить" : "Отключить"}
                            onClick={() => handleToggleDisable(user)}
                          >
                            {user.isDisabled ? "✓" : "✕"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Удалить"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
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
