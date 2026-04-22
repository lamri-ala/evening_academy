"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db, isUniqueConstraintError, nowIso, toBool, toInt } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { redirectLocalized } from "@/lib/action-helpers";

const studentSchema = z.object({
  code: z.string().trim().min(1).max(64),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  guardianName: z.string().trim().max(120).optional().nullable(),
  guardianPhone: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  active: z.boolean().optional(),
});

function extract(formData: FormData) {
  return {
    code: String(formData.get("code") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: (formData.get("phone") as string) || null,
    guardianName: (formData.get("guardianName") as string) || null,
    guardianPhone: (formData.get("guardianPhone") as string) || null,
    notes: (formData.get("notes") as string) || null,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  };
}

export type FormState = { error: string | null; fieldErrors?: Record<string, string> };

export async function createStudent(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = studentSchema.safeParse(extract(formData));
  if (!parsed.success) {
    return { error: "validation" };
  }
  const id = randomUUID();
  try {
    await db
      .insertInto("Student")
      .values({
        id,
        code: parsed.data.code,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        guardianName: parsed.data.guardianName,
        guardianPhone: parsed.data.guardianPhone,
        notes: parsed.data.notes,
        active: toInt(parsed.data.active ?? true),
      })
      .execute();
  } catch (e) {
    if (isUniqueConstraintError(e)) return { error: "duplicate" };
    throw e;
  }
  const created = await db
    .selectFrom("Student")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "student.create",
    entity: "Student",
    entityId: id,
    payload: { after: created },
  });
  revalidatePath("/students");
  return redirectLocalized("/students");
}

export async function updateStudent(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = studentSchema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const before = await db
    .selectFrom("Student")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return { error: "notfound" };
  try {
    await db
      .updateTable("Student")
      .set({
        code: parsed.data.code,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        guardianName: parsed.data.guardianName,
        guardianPhone: parsed.data.guardianPhone,
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
    .selectFrom("Student")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "student.update",
    entity: "Student",
    entityId: id,
    payload: { before, after: updated },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return redirectLocalized(`/students/${id}`);
}

export async function deleteStudent(id: string): Promise<void> {
  const session = await requireSession();
  const before = await db
    .selectFrom("Student")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return;
  // Soft-delete semantics: deactivate rather than hard-delete to preserve
  // ledger / audit references. Phase 1 has no ledger entries yet, but we
  // keep the same semantics for consistency.
  await db
    .updateTable("Student")
    .set({ active: 0, updatedAt: nowIso() })
    .where("id", "=", id)
    .execute();
  await recordAudit({
    actorId: session.user.id,
    action: "student.deactivate",
    entity: "Student",
    entityId: id,
    payload: { before },
  });
  revalidatePath("/students");
  return redirectLocalized("/students");
}
