import { prisma } from "./prisma";
import type { AuditActorType, Prisma } from "@prisma/client";

export interface AuditLogParams {
  actorType: AuditActorType;
  userId?: string;
  adminId?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorType: params.actorType,
      userId: params.userId,
      adminId: params.adminId,
      action: params.action,
      details: (params.details ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
