"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db, nowIso } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { redirectLocalized } from "@/lib/action-helpers";
import { parseHHMM, rangesOverlap } from "@/lib/time";

const schema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(24 * 60),
    endMinute: z.number().int().min(1).max(24 * 60),
    subjectId: z.string().min(1),
    teacherId: z.string().min(1),
    classroomId: z.string().min(1),
    label: z
      .string()
      .trim()
      .max(120)
      .optional()
      .nullable()
      .or(z.literal("").transform(() => null)),
  })
  .refine((v) => v.endMinute > v.startMinute, { message: "range" });

export type FormState = { error: string | null };

function extract(formData: FormData) {
  const startMinute = parseHHMM(String(formData.get("start") ?? ""));
  const endMinute = parseHHMM(String(formData.get("end") ?? ""));
  const dayOfWeek = Number.parseInt(String(formData.get("dayOfWeek") ?? "-1"), 10);
  return {
    dayOfWeek,
    startMinute: startMinute ?? -1,
    endMinute: endMinute ?? -1,
    subjectId: String(formData.get("subjectId") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    classroomId: String(formData.get("classroomId") ?? ""),
    label: (formData.get("label") as string) || null,
  };
}

async function detectConflict(params: {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  teacherId: string;
  classroomId: string;
  excludeId?: string;
}): Promise<"teacher" | "classroom" | null> {
  let q = db
    .selectFrom("TimetableSlot")
    .select(["id", "startMinute", "endMinute", "teacherId", "classroomId"])
    .where("active", "=", 1)
    .where("dayOfWeek", "=", params.dayOfWeek)
    .where((eb) =>
      eb.or([
        eb("teacherId", "=", params.teacherId),
        eb("classroomId", "=", params.classroomId),
      ]),
    );
  if (params.excludeId) q = q.where("id", "!=", params.excludeId);
  const candidates = await q.execute();
  for (const c of candidates) {
    if (
      rangesOverlap(
        params.startMinute,
        params.endMinute,
        c.startMinute,
        c.endMinute,
      )
    ) {
      if (c.teacherId === params.teacherId) return "teacher";
      if (c.classroomId === params.classroomId) return "classroom";
    }
  }
  return null;
}

export async function createTimetableSlot(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const conflict = await detectConflict(parsed.data);
  if (conflict) return { error: `conflict:${conflict}` };

  const id = randomUUID();
  await db
    .insertInto("TimetableSlot")
    .values({
      id,
      dayOfWeek: parsed.data.dayOfWeek,
      startMinute: parsed.data.startMinute,
      endMinute: parsed.data.endMinute,
      subjectId: parsed.data.subjectId,
      teacherId: parsed.data.teacherId,
      classroomId: parsed.data.classroomId,
      label: parsed.data.label,
    })
    .execute();
  const created = await db
    .selectFrom("TimetableSlot")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "timetable.create",
    entity: "TimetableSlot",
    entityId: id,
    payload: { after: created },
  });
  revalidatePath("/timetable");
  return redirectLocalized("/timetable");
}

export async function updateTimetableSlot(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { error: "validation" };
  const before = await db
    .selectFrom("TimetableSlot")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return { error: "notfound" };
  const conflict = await detectConflict({ ...parsed.data, excludeId: id });
  if (conflict) return { error: `conflict:${conflict}` };

  await db
    .updateTable("TimetableSlot")
    .set({
      dayOfWeek: parsed.data.dayOfWeek,
      startMinute: parsed.data.startMinute,
      endMinute: parsed.data.endMinute,
      subjectId: parsed.data.subjectId,
      teacherId: parsed.data.teacherId,
      classroomId: parsed.data.classroomId,
      label: parsed.data.label,
      updatedAt: nowIso(),
    })
    .where("id", "=", id)
    .execute();
  const updated = await db
    .selectFrom("TimetableSlot")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  await recordAudit({
    actorId: session.user.id,
    action: "timetable.update",
    entity: "TimetableSlot",
    entityId: id,
    payload: { before, after: updated },
  });
  revalidatePath("/timetable");
  return redirectLocalized("/timetable");
}

export async function deleteTimetableSlot(id: string): Promise<void> {
  const session = await requireSession();
  const before = await db
    .selectFrom("TimetableSlot")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!before) return;
  await db.deleteFrom("TimetableSlot").where("id", "=", id).execute();
  await recordAudit({
    actorId: session.user.id,
    action: "timetable.delete",
    entity: "TimetableSlot",
    entityId: id,
    payload: { before },
  });
  revalidatePath("/timetable");
  return redirectLocalized("/timetable");
}
