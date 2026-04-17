"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  const candidates = await prisma.timetableSlot.findMany({
    where: {
      active: true,
      dayOfWeek: params.dayOfWeek,
      OR: [
        { teacherId: params.teacherId },
        { classroomId: params.classroomId },
      ],
      ...(params.excludeId ? { NOT: { id: params.excludeId } } : {}),
    },
  });
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

  const created = await prisma.timetableSlot.create({
    data: {
      dayOfWeek: parsed.data.dayOfWeek,
      startMinute: parsed.data.startMinute,
      endMinute: parsed.data.endMinute,
      subjectId: parsed.data.subjectId,
      teacherId: parsed.data.teacherId,
      classroomId: parsed.data.classroomId,
      label: parsed.data.label,
    },
  });
  await recordAudit({
    actorId: session.user.id,
    action: "timetable.create",
    entity: "TimetableSlot",
    entityId: created.id,
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
  const before = await prisma.timetableSlot.findUnique({ where: { id } });
  if (!before) return { error: "notfound" };
  const conflict = await detectConflict({ ...parsed.data, excludeId: id });
  if (conflict) return { error: `conflict:${conflict}` };

  const updated = await prisma.timetableSlot.update({
    where: { id },
    data: {
      dayOfWeek: parsed.data.dayOfWeek,
      startMinute: parsed.data.startMinute,
      endMinute: parsed.data.endMinute,
      subjectId: parsed.data.subjectId,
      teacherId: parsed.data.teacherId,
      classroomId: parsed.data.classroomId,
      label: parsed.data.label,
    },
  });
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
  const before = await prisma.timetableSlot.findUnique({ where: { id } });
  if (!before) return;
  await prisma.timetableSlot.delete({ where: { id } });
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
