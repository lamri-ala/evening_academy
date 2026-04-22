"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db, nowIso, toBool, toInt } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { redirectLocalized } from "@/lib/action-helpers";
import { parseMoney } from "@/lib/money";

const baseSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  notes: z.string().trim().max(2000).optional().nullable(),
  sessionRate: z.number().int().min(0),
  active: z.boolean().optional(),
});

export type FormState = { error: string | null };

function extract(formData: FormData) {
  const rateStr = String(formData.get("sessionRate") ?? "0");
  const rateMinor = parseMoney(rateStr) ?? 0;
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    notes: (formData.get("notes") as string) || null,
    sessionRate: rateMinor,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  };
}

export async function createTeacher(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = baseSchema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const id = randomUUID();
  await db
    .insertInto("Teacher")
    .values({
      id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
      sessionRate: parsed.data.sessionRate,
      active: toInt(parsed.data.active ?? true),
    })
    .execute();
  const created = await db
    .selectFrom("Teacher")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "teacher.create",
    entity: "Teacher",
    entityId: id,
    payload: { after: created },
  });
  revalidatePath("/teachers");
  return redirectLocalized("/teachers");
}

export async function updateTeacher(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = baseSchema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const before = await db
    .selectFrom("Teacher")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return { error: "notfound" };
  await db
    .updateTable("Teacher")
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
      sessionRate: parsed.data.sessionRate,
      active: toInt(parsed.data.active ?? toBool(before.active)),
      updatedAt: nowIso(),
    })
    .where("id", "=", id)
    .execute();
  const updated = await db
    .selectFrom("Teacher")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "teacher.update",
    entity: "Teacher",
    entityId: id,
    payload: { before, after: updated },
  });
  revalidatePath("/teachers");
  revalidatePath(`/teachers/${id}`);
  return redirectLocalized(`/teachers/${id}`);
}

export async function deleteTeacher(id: string): Promise<void> {
  const session = await requireSession();
  const before = await db
    .selectFrom("Teacher")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return;
  await db
    .updateTable("Teacher")
    .set({ active: 0, updatedAt: nowIso() })
    .where("id", "=", id)
    .execute();
  await recordAudit({
    actorId: session.user.id,
    action: "teacher.deactivate",
    entity: "Teacher",
    entityId: id,
    payload: { before },
  });
  revalidatePath("/teachers");
  return redirectLocalized("/teachers");
}
