"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface AuditRow {
  id: string;
  actorType: string;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: string;
}

export default function AdminAuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setLogs(data.logs ?? []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <AdminLayout>
      <h1 className="mb-8 text-2xl font-bold text-white">Журнал аудита</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="p-4">Дата</th>
                  <th className="p-4">Актор</th>
                  <th className="p-4">Действие</th>
                  <th className="p-4">IP</th>
                  <th className="p-4">Детали</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/50">
                      Загрузка...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/50">
                      Записи не найдены
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5">
                      <td className="p-4 text-white/60 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="p-4">
                        <span className="text-white/80">{log.actor}</span>
                        <span className="ml-1 text-xs text-white/40">
                          ({log.actorType})
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-red-300">
                        {log.action}
                      </td>
                      <td className="p-4 text-white/60">{log.ipAddress ?? "—"}</td>
                      <td className="p-4 max-w-xs truncate text-white/40 text-xs">
                        {log.details ? JSON.stringify(log.details) : "—"}
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
