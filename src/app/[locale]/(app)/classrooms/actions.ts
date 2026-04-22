"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db, isUniqueConstraintError, nowIso, toBool, toInt } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { redirectLocalized } from "@/lib/action-helpers";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  capacity: z.number().int().min(0).nullable(),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  active: z.boolean().optional(),
});

export type FormState = { error: string | null };

function extract(formData: FormData) {
  const cap = String(formData.get("capacity") ?? "").trim();
  const capacity = cap === "" ? null : Number.parseInt(cap, 10);
  return {
    name: String(formData.get("name") ?? ""),
    capacity: Number.isFinite(capacity) ? capacity : null,
    notes: (formData.get("notes") as string) || null,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  };
}

export async function createClassroom(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const id = randomUUID();
  try {
    await db
      .insertInto("Classroom")
      .values({
        id,
        name: parsed.data.name,
        capacity: parsed.data.capacity,
        notes: parsed.data.notes,
        active: toInt(parsed.data.active ?? true),
      })
      .execute();
  } catch (e) {
    if (isUniqueConstraintError(e)) return { error: "duplicate" };
    throw e;
  }
  const created = await db
    .selectFrom("Classroom")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "classroom.create",
    entity: "Classroom",
    entityId: id,
    payload: { after: created },
  });
  revalidatePath("/classrooms");
  return redirectLocalized("/classrooms");
}

export async function updateClassroom(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const before = await db
    .selectFrom("Classroom")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return { error: "notfound" };
  try {
    await db
      .updateTable("Classroom")
      .set({
        name: parsed.data.name,
        capacity: parsed.data.capacity,
        notes: parsed.data.notes,
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
    .selectFrom("Classroom")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "classroom.update",
    entity: "Classroom",
    entityId: id,
    payload: { before, after: updated },
  });
  revalidatePath("/classrooms");
  return redirectLocalized("/classrooms");
}

export async function deleteClassroom(id: string): Promise<void> {
  const session = await requireSession();
  const before = await db
    .selectFrom("Classroom")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return;
  await db
    .updateTable("Classroom")
    .set({ active: 0, updatedAt: nowIso() })
    .where("id", "=", id)
    .execute();
  await recordAudit({
    actorId: session.user.id,
    action: "classroom.deactivate",
    entity: "Classroom",
    entityId: id,
    payload: { before },
  });
  revalidatePath("/classrooms");
  return redirectLocalized("/classrooms");
}
