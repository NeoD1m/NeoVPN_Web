import { execFile } from "child_process";
import { promisify } from "util";
import { mkdir } from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

async function backup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL не установлен");
    process.exit(1);
  }

  const backupDir = process.env.BACKUP_DIR ?? "./backups";
  await mkdir(backupDir, { recursive: true });

  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;
  const filepath = path.join(backupDir, filename);

  console.log(`Создание резервной копии: ${filepath}`);

  await execFileAsync("pg_dump", [dbUrl, "-f", filepath], {
    env: process.env,
  });

  console.log("Резервная копия создана успешно");
}

backup().catch((err) => {
  console.error("Ошибка резервного копирования:", err);
  process.exit(1);
});
