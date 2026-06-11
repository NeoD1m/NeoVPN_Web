"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Key, UserPlus, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { adminFetch } from "@/lib/admin-fetch";

interface DashboardStats {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalCodes: number;
    usedCodes: number;
    activeCodes: number;
    revokedCodes: number;
    recentRegistrations: number;
    revenuePlaceholder: {
      total: number;
      currency: string;
      note: string;
    };
  };
  recentUsers: Array<{
    id: string;
    username: string;
    email: string | null;
    createdAt: string;
    remnawaveMapping: { expireAt: string | null; status: string | null } | null;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardStats | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/dashboard")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((d) => d && setData(d));
  }, [router]);

  if (!data) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { label: "Всего пользователей", value: data.stats.totalUsers, icon: Users },
    { label: "Активных подписок", value: data.stats.activeUsers, icon: TrendingUp },
    { label: "Сгенерировано кодов", value: data.stats.totalCodes, icon: Key },
    { label: "Использовано кодов", value: data.stats.usedCodes, icon: Key },
    { label: "Регистраций за 30 дней", value: data.stats.recentRegistrations, icon: UserPlus },
  ];

  return (
    <AdminLayout>
      <h1 className="mb-8 text-2xl font-bold text-white">Панель управления</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/60">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Статистика доходов</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-white">
            {data.stats.revenuePlaceholder.total}{" "}
            {data.stats.revenuePlaceholder.currency}
          </p>
          <p className="mt-2 text-sm text-white/50">
            {data.stats.revenuePlaceholder.note}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние регистрации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="pb-3 pr-4">Пользователь</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Подписка до</th>
                  <th className="pb-3">Дата регистрации</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-medium">{user.username}</td>
                    <td className="py-3 pr-4 text-white/60">{user.email ?? "—"}</td>
                    <td className="py-3 pr-4 text-white/60">
                      {formatDate(user.remnawaveMapping?.expireAt)}
                    </td>
                    <td className="py-3 text-white/60">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
