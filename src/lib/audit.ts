import { prisma } from "./db";

type AuditInput = {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  payload?: unknown;
};

export async function recordAudit(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      payload:
        input.payload === undefined ? null : JSON.stringify(input.payload),
    },
  });
}
