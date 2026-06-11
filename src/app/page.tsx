"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Globe,
  Lock,
  Server,
  Smartphone,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, Footer } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Максимальная скорость",
    description:
      "Оптимизированные серверы обеспечивают минимальную задержку и высокую пропускную способность.",
  },
  {
    icon: Lock,
    title: "Военное шифрование",
    description:
      "Протоколы VLESS, Trojan и Shadowsocks с современными алгоритмами шифрования.",
  },
  {
    icon: Globe,
    title: "Глобальная сеть",
    description:
      "Серверы в десятках стран для доступа к любому контенту без ограничений.",
  },
  {
    icon: Server,
    title: "Надёжная инфраструктура",
    description:
      "Построено на Remnawave — профессиональной платформе управления VPN.",
  },
  {
    icon: Smartphone,
    title: "Все устройства",
    description:
      "Поддержка iOS, Android, Windows, macOS и Linux через единую подписку.",
  },
  {
    icon: Shield,
    title: "Без логов",
    description:
      "Мы не храним историю вашей активности. Ваша конфиденциальность — наш приоритет.",
  },
];

const pricingPlans = [
  {
    name: "7 дней",
    description: "Пробный период для знакомства с сервисом",
    features: ["Полный доступ", "Все серверы", "Без ограничений скорости"],
  },
  {
    name: "30 дней",
    description: "Оптимальный выбор для регулярного использования",
    features: ["Полный доступ", "Приоритетная поддержка", "Все протоколы"],
    popular: true,
  },
  {
    name: "365 дней",
    description: "Максимальная выгода для постоянных пользователей",
    features: ["Полный доступ", "VIP поддержка", "Максимальная экономия"],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative flex min-h-screen items-center justify-center px-4 pt-16">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm text-red-300">
                <Shield className="h-4 w-4" />
                Премиальный VPN-сервис
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                <span className="text-gradient">Свобода</span>
                <br />
                <span className="text-white">в интернете</span>
              </h1>

              <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 sm:text-xl">
                NeoVPN — это безопасный, быстрый и надёжный VPN-сервис.
                Защитите свои данные и получите доступ к интернету без ограничений.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="min-w-[200px]">
                  <Link href="/register">
                    Начать бесплатно
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                  <Link href="/login">Уже есть аккаунт</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                Почему NeoVPN?
              </h2>
              <p className="mx-auto max-w-2xl text-white/60">
                Мы создали сервис, который сочетает производительность,
                безопасность и простоту использования.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full transition-colors hover:border-red-500/30">
                    <CardHeader>
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20">
                        <feature.icon className="h-5 w-5 text-red-400" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                Тарифные планы
              </h2>
              <p className="mx-auto max-w-2xl text-white/60">
                Выберите подходящий период подписки. Активация через код после регистрации.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {pricingPlans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className={`relative h-full ${
                      plan.popular
                        ? "border-red-500/50 shadow-lg shadow-red-900/20"
                        : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-3 py-0.5 text-xs font-medium text-white">
                        Популярный
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                            <Check className="h-4 w-4 shrink-0 text-red-400" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button asChild className="mt-6 w-full">
                        <Link href="/register">Зарегистрироваться</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Card className="border-red-500/20 bg-gradient-to-br from-red-950/30 to-zinc-950/80 p-8">
              <h2 className="mb-4 text-3xl font-bold text-white">
                Готовы начать?
              </h2>
              <p className="mb-8 text-white/60">
                Зарегистрируйтесь за минуту, активируйте код и получите доступ к VPN.
              </p>
              <Button asChild size="lg">
                <Link href="/register">
                  Создать аккаунт
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
