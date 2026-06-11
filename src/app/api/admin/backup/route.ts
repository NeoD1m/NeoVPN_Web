import { NextRequest } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSessionAdmin } from "@/lib/auth/admin-session";
import { validateCsrf } from "@/lib/csrf";
import { createAuditLog } from "@/lib/audit";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { messages } from "@/lib/messages";

const execFileAsync = promisify(execFile);

export async function GET(request: NextRequest) {
  try {
    await requireSessionAdmin();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "export") {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) return errorResponse("DATABASE_URL не настроен", 500);

      const backupDir = process.env.BACKUP_DIR ?? "/app/backups";
      await mkdir(backupDir, { recursive: true });
      const filename = `backup-${Date.now()}.sql`;
      const filepath = path.join(backupDir, filename);

      await execFileAsync("pg_dump", [dbUrl, "-f", filepath], {
        env: process.env,
      });

      const content = await readFile(filepath, "utf-8");

      return new Response(content, {
        headers: {
          "Content-Type": "application/sql",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return errorResponse("Неизвестное действие", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка экспорта";
    return errorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSessionAdmin();
    if (!(await validateCsrf(request))) {
      return errorResponse(messages.auth.csrfInvalid, 403);
    }

    const body = await request.json();

    if (body.action === "import") {
      const { sql } = body;
      if (!sql || typeof sql !== "string") {
        return errorResponse("SQL данные обязательны", 400);
      }

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) return errorResponse("DATABASE_URL не настроен", 500);

      const tempDir = process.env.BACKUP_DIR ?? "/app/backups";
      await mkdir(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, `import-${Date.now()}.sql`);
      await writeFile(tempFile, sql, "utf-8");

      await execFileAsync("psql", [dbUrl, "-f", tempFile], {
        env: process.env,
      });

      await createAuditLog({
        actorType: "ADMIN",
        adminId: admin.id,
        action: "admin.database.imported",
      });

      return jsonResponse({ message: messages.admin.importSuccess });
    }

    if (body.action === "create-backup") {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) return errorResponse("DATABASE_URL не настроен", 500);

      const backupDir = process.env.BACKUP_DIR ?? "/app/backups";
      await mkdir(backupDir, { recursive: true });
      const filename = `scheduled-backup-${Date.now()}.sql`;
      const filepath = path.join(backupDir, filename);

      await execFileAsync("pg_dump", [dbUrl, "-f", filepath], {
        env: process.env,
      });

      await createAuditLog({
        actorType: "ADMIN",
        adminId: admin.id,
        action: "admin.database.backup_created",
        details: { filename },
      });

      return jsonResponse({
        message: messages.admin.backupCreated,
        filename,
      });
    }

    return errorResponse("Неизвестное действие", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка импорта";
    return errorResponse(message, 500);
  }
}
