"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  try {
    const created = await prisma.classroom.create({
      data: {
        name: parsed.data.name,
        capacity: parsed.data.capacity,
        notes: parsed.data.notes,
        active: parsed.data.active ?? true,
      },
    });
    await recordAudit({
      actorId: session.user.id,
      action: "classroom.create",
      entity: "Classroom",
      entityId: created.id,
      payload: { after: created },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "duplicate" };
    }
    throw e;
  }
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
  const before = await prisma.classroom.findUnique({ where: { id } });
  if (!before) return { error: "notfound" };
  try {
    const updated = await prisma.classroom.update({
      where: { id },
      data: {
        name: parsed.data.name,
        capacity: parsed.data.capacity,
        notes: parsed.data.notes,
        active: parsed.data.active ?? before.active,
      },
    });
    await recordAudit({
      actorId: session.user.id,
      action: "classroom.update",
      entity: "Classroom",
      entityId: id,
      payload: { before, after: updated },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "duplicate" };
    }
    throw e;
  }
  revalidatePath("/classrooms");
  return redirectLocalized("/classrooms");
}

export async function deleteClassroom(id: string): Promise<void> {
  const session = await requireSession();
  const before = await prisma.classroom.findUnique({ where: { id } });
  if (!before) return;
  await prisma.classroom.update({ where: { id }, data: { active: false } });
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
