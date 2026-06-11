import Link from "next/link";
import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-500" />
          <span className="text-xl font-bold text-white">NeoVPN</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/#features" className="text-sm text-white/70 transition hover:text-white">
            Возможности
          </Link>
          <Link href="/#pricing" className="text-sm text-white/70 transition hover:text-white">
            Тарифы
          </Link>
          <Link href="/login" className="text-sm text-white/70 transition hover:text-white">
            Вход
          </Link>
          <Button asChild size="sm">
            <Link href="/register">Регистрация</Link>
          </Button>
        </nav>

        <div className="md:hidden">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/register">
              <Menu className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            <span className="font-semibold text-white">NeoVPN</span>
          </div>
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} NeoVPN. Все права защищены.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm text-white/50 hover:text-white">
              Вход
            </Link>
            <Link href="/register" className="text-sm text-white/50 hover:text-white">
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
