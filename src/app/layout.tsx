import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CsrfProvider } from "@/components/providers/csrf-provider";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: {
    default: "NeoVPN — Премиальный VPN-сервис",
    template: "%s | NeoVPN",
  },
  description:
    "Безопасный и быстрый VPN-сервис с премиальным качеством подключения. Защитите свою конфиденциальность в интернете.",
  keywords: ["VPN", "NeoVPN", "безопасность", "конфиденциальность", "прокси"],
  openGraph: {
    title: "NeoVPN — Премиальный VPN-сервис",
    description: "Безопасный и быстрый VPN-сервис с премиальным качеством подключения.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <CsrfProvider>{children}</CsrfProvider>
      </body>
    </html>
  );
}
