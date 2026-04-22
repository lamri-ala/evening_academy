import { randomUUID } from "node:crypto";
import { db } from "./db";

type AuditInput = {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  payload?: unknown;
};

export async function recordAudit(input: AuditInput): Promise<void> {
  await db
    .insertInto("AuditLog")
    .values({
      id: randomUUID(),
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      payload:
        input.payload === undefined ? null : JSON.stringify(input.payload),
    })
    .execute();
}
