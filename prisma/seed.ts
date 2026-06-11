import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMeAdmin123!";

  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.admin.create({
      data: {
        username: adminUsername,
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });
    console.log(`Администратор создан: ${adminUsername}`);
    console.log("⚠️  Смените пароль администратора после первого входа!");
  } else {
    console.log(`Администратор уже существует: ${adminUsername}`);
  }

  const defaultSettings = [
    { key: "remnawave_squad_name", value: "MainSquad", isSecret: false },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {},
    });
  }

  console.log("Начальные настройки применены");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
