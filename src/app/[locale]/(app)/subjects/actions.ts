"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db, isUniqueConstraintError, nowIso, toBool, toInt } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { redirectLocalized } from "@/lib/action-helpers";
import { parseMoney } from "@/lib/money";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z
    .string()
    .trim()
    .max(32)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  sessionPrice: z.number().int().min(0),
  defaultTeacherRate: z.number().int().min(0).nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  active: z.boolean().optional(),
});

export type FormState = { error: string | null };

function extract(formData: FormData) {
  const sessionPrice = parseMoney(String(formData.get("sessionPrice") ?? "0")) ?? 0;
  const teacherRateStr = String(formData.get("defaultTeacherRate") ?? "").trim();
  const teacherRate = teacherRateStr === "" ? null : parseMoney(teacherRateStr);
  return {
    name: String(formData.get("name") ?? ""),
    code: (formData.get("code") as string) || null,
    sessionPrice,
    defaultTeacherRate: teacherRate,
    color: (formData.get("color") as string) || null,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  };
}

export async function createSubject(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const id = randomUUID();
  try {
    await db
      .insertInto("Subject")
      .values({
        id,
        name: parsed.data.name,
        code: parsed.data.code,
        sessionPrice: parsed.data.sessionPrice,
        defaultTeacherRate: parsed.data.defaultTeacherRate,
        color: parsed.data.color,
        active: toInt(parsed.data.active ?? true),
      })
      .execute();
  } catch (e) {
    if (isUniqueConstraintError(e)) return { error: "duplicate" };
    throw e;
  }
  const created = await db
    .selectFrom("Subject")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "subject.create",
    entity: "Subject",
    entityId: id,
    payload: { after: created },
  });
  revalidatePath("/subjects");
  return redirectLocalized("/subjects");
}

export async function updateSubject(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const before = await db
    .selectFrom("Subject")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return { error: "notfound" };
  try {
    await db
      .updateTable("Subject")
      .set({
        name: parsed.data.name,
        code: parsed.data.code,
        sessionPrice: parsed.data.sessionPrice,
        defaultTeacherRate: parsed.data.defaultTeacherRate,
        color: parsed.data.color,
        active: toInt(parsed.data.active ?? toBool(before.active)),
        updatedAt: nowIso(),
      })
      .where("id", "=", id)
      .execute();
  } catch (e) {
    if (isUniqueConstraintError(e)) return { error: "duplicate" };
    throw e;
  }
  const updated = await db
    .selectFrom("Subject")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "subject.update",
    entity: "Subject",
    entityId: id,
    payload: { before, after: updated },
  });
  revalidatePath("/subjects");
  revalidatePath(`/subjects/${id}`);
  return redirectLocalized(`/subjects/${id}`);
}

export async function deleteSubject(id: string): Promise<void> {
  const session = await requireSession();
  const before = await db
    .selectFrom("Subject")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return;
  await db
    .updateTable("Subject")
    .set({ active: 0, updatedAt: nowIso() })
    .where("id", "=", id)
    .execute();
  await recordAudit({
    actorId: session.user.id,
    action: "subject.deactivate",
    entity: "Subject",
    entityId: id,
    payload: { before },
  });
  revalidatePath("/subjects");
  return redirectLocalized("/subjects");
}
