"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  Key,
  Settings,
  FileText,
  Database,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useCsrf } from "@/components/providers/csrf-provider";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", label: "Панель", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/codes", label: "Коды", icon: Key },
  { href: "/admin/settings", label: "Remnawave", icon: Settings },
  { href: "/admin/audit", label: "Аудит", icon: FileText },
  { href: "/admin/backup", label: "Резервные копии", icon: Database },
];

export function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { apiFetch } = useCsrf();

  async function handleLogout() {
    await apiFetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6">
          <Shield className="h-7 w-7 text-red-500" />
          <div>
            <p className="font-bold text-white">NeoVPN</p>
            <p className="text-xs text-white/40">Администрирование</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                pathname === item.href
                  ? "bg-red-600/20 text-red-300"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Выход
          </Button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
