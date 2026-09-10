import { prisma } from "./prisma";

export async function audit(actorId: string | null, action: string, entityType: string, entityId: string | null, summary?: string) {
  await prisma.auditLog.create({ data: { actorId, action, entityType, entityId, summary } });
}
